import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import '../styles/main.css'

const Account = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    name: '',
    gender: '',
    birth_date: ''
  })

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/menu'))
    loadUser()
    
    return () => {
      hideBackButton()
    }
  }, [navigate])

  const loadUser = async () => {
    try {
      const data = await api.getCurrentUser()
      setUser(data)
      setProfile({
        name: data.name || '',
        gender: data.gender || '',
        birth_date: data.birth_date ? formatDateForInput(data.birth_date) : ''
      })
    } catch (error) {
      console.error('Ошибка загрузки пользователя:', error)
    } finally {
      setLoading(false)
    }
  }


  const formatDateForInput = (dateString) => {
    // Преобразуем YYYY-MM-DD в формат для date input (YYYY-MM-DD)
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch (e) {
      return ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateProfile({
        name: profile.name || null,
        gender: profile.gender || null,
        birth_date: profile.birth_date || null
      })
      await loadUser()
      alert('Профиль сохранен')
    } catch (error) {
      alert('Ошибка при сохранении профиля: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      const data = await api.exportUserData()
      // Используем user.id из ответа API, если user в состоянии null
      const userId = data?.user?.id || user?.id || 'unknown'
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user_data_${userId}_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      alert('Данные экспортированы')
    } catch (error) {
      alert('Ошибка при экспорте данных: ' + error.message)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Вы уверены, что хотите удалить аккаунт? Все ваши данные будут безвозвратно удалены. Это действие нельзя отменить.'
    )
    
    if (!confirmed) {
      return
    }
    
    const doubleConfirmed = window.confirm(
      'Это последнее предупреждение. Все ваши данные будут удалены навсегда. Продолжить?'
    )
    
    if (!doubleConfirmed) {
      return
    }
    
    try {
      await api.deleteAccount()
      // Очищаем localStorage для гостевого режима
      localStorage.removeItem('guest_user_id')
      // Перенаправляем на главный экран
      navigate('/')
    } catch (error) {
      alert('Ошибка при удалении аккаунта: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="content">
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="content">
        <h2 className="text-title">Аккаунт</h2>
        
        <div style={{ marginTop: '36px' }}>
          <div className="form-group">
            <label className="form-label">Имя</label>
            <input 
              type="text"
              className="form-input" 
              placeholder="Имя"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Пол</label>
            <select
              className="form-input"
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
            >
              <option value="">Выберите пол</option>
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Дата рождения</label>
            <input 
              type="date"
              className="form-input" 
              value={profile.birth_date}
              onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
            />
          </div>
        </div>
        
        <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid #d9d9d9' }}>
          <div className="form-group">
            <label className="form-label">Экспорт данных</label>
            <Button 
              onClick={handleExport} 
              type="secondary"
              style={{ width: '100%', marginTop: '8px' }}
            >
              Отправить
            </Button>
          </div>
          
          <div className="form-group" style={{ marginTop: '24px' }}>
            <label className="form-label" style={{ color: '#ff4444' }}>Удаление аккаунта</label>
            <Button 
              onClick={handleDeleteAccount} 
              type="secondary"
              style={{ 
                width: '100%', 
                marginTop: '8px',
                backgroundColor: '#ff4444',
                color: '#ffffff',
                borderColor: '#ff4444'
              }}
            >
              Удалить аккаунт
            </Button>
          </div>
        </div>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button onClick={() => navigate('/menu')} type="secondary">
          Назад
        </Button>
        <Button onClick={handleSave} type="primary" disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  )
}

export default Account


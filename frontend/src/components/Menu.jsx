import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import '../styles/main.css'
import '../styles/components.css'

const Menu = () => {
  const navigate = useNavigate()
  const [isGuest, setIsGuest] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    initTelegramWebApp()
    hideBackButton()
    
    // Проверяем, является ли пользователь гостем
    const checkGuestStatus = async () => {
      try {
        const user = await api.getCurrentUser()
        // Гость определяется по отрицательному telegram_id или наличию ip_address
        setIsGuest(user.telegram_id < 0 || !!user.ip_address)
      } catch (error) {
        console.error('Failed to check guest status:', error)
      }
    }
    
    checkGuestStatus()
  }, [])

  const handleGenerateTestData = async () => {
    if (isGenerating) return
    
    setIsGenerating(true)
    try {
      await api.generateTestData()
      alert('Тестовые данные успешно сгенерированы')
      // Перезагружаем страницу для обновления данных
      window.location.reload()
    } catch (error) {
      console.error('Failed to generate test data:', error)
      alert(`Ошибка при генерации тестовых данных: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container">
      <div className="content">
        <h2 className="text-title">Меню</h2>
        
        <div style={{ marginTop: '36px' }}>
          <div className="menu-item" onClick={() => navigate('/progress')}>
            <span className="menu-icon">📊</span>
            <div className="menu-text">Прогресс</div>
          </div>
          <div className="menu-item" onClick={() => navigate('/account')}>
            <span className="menu-icon">👤</span>
            <div className="menu-text">Аккаунт</div>
          </div>
          <div className="menu-item" onClick={() => navigate('/settings')}>
            <span className="menu-icon">⚙️</span>
            <div className="menu-text">Настройки</div>
          </div>
          <div className="menu-item" onClick={() => navigate('/change-spheres')}>
            <span className="menu-icon">🎯</span>
            <div className="menu-text">Изменить фокус-сферы</div>
          </div>
          <div className="menu-item" onClick={() => navigate('/daily')}>
            <span className="menu-icon">❓</span>
            <div className="menu-text">Вопрос дня</div>
          </div>
          {isGuest && (
            <div className="menu-item" onClick={handleGenerateTestData} style={{ opacity: isGenerating ? 0.6 : 1 }}>
              <span className="menu-icon">🧪</span>
              <div className="menu-text">
                {isGenerating ? 'Генерация...' : 'Сгенерировать все тестовые данные'}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button onClick={() => navigate('/daily')} type="primary">
          Начать день
        </Button>
      </div>
    </div>
  )
}

export default Menu


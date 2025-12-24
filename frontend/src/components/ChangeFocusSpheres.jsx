import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import { SPHERES, SPHERE_KEYS } from '../utils/constants'
import { useTheme } from '../utils/useTheme'
import '../styles/main.css'
import '../styles/components.css'

const ChangeFocusSpheres = () => {
  const navigate = useNavigate()
  const [selectedSpheres, setSelectedSpheres] = useState([])
  const [ratings, setRatings] = useState({})
  const [spheres, setSpheres] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [canChange, setCanChange] = useState(true)
  const [checkMessage, setCheckMessage] = useState('')
  const isDark = useTheme()

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/menu'))
    loadData()
    
    return () => {
      hideBackButton()
    }
  }, [navigate])

  const loadData = async () => {
    try {
      const [focusData, ratingsData, spheresData, canChangeData] = await Promise.all([
        api.getFocusSpheres(),
        api.getSphereRatings(),
        api.getAllSpheres(),
        api.canChangeFocusSpheres()
      ])
      
      setSelectedSpheres(focusData.map(s => s.sphere))
      
      const ratingsMap = {}
      ratingsData.forEach(item => {
        ratingsMap[item.sphere] = item.rating
      })
      setRatings(ratingsMap)
      
      setCanChange(canChangeData.can_change)
      setCheckMessage(canChangeData.message || '')
      
      // Сортируем сферы: сначала обычные с оценками (по возрастанию), потом платные, потом без оценок
      const sortedSpheres = [...spheresData].sort((a, b) => {
        const ratingA = ratingsMap[a.key] || 0
        const ratingB = ratingsMap[b.key] || 0
        const isPaidA = a.name.includes('(платно)')
        const isPaidB = b.name.includes('(платно)')
        
        // Платные сферы всегда идут после обычных
        if (isPaidA && !isPaidB) return 1
        if (!isPaidA && isPaidB) return -1
        
        // Если обе платные или обе обычные, сортируем по оценкам
        // Если обе сферы без оценок, сохраняем исходный порядок
        if (ratingA === 0 && ratingB === 0) {
          return 0
        }
        
        // Сферы без оценок идут в конец
        if (ratingA === 0) return 1
        if (ratingB === 0) return -1
        
        // Сортируем по возрастанию оценок
        return ratingA - ratingB
      })
      
      setSpheres(sortedSpheres)
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
      // Используем константы как fallback для сфер
      const fallbackSpheres = SPHERE_KEYS.map(key => ({
        key,
        name: SPHERES[key]
      }))
      setSpheres(fallbackSpheres)
    } finally {
      setLoading(false)
    }
  }

  const handleSphereClick = (sphere) => {
    // Блокируем выбор если нельзя менять фокус-сферы
    if (!canChange) {
      alert(checkMessage || 'Нельзя изменить фокус-сферы: не все вопросы по текущим сферам отвечены')
      return
    }
    
    setSelectedSpheres(prev => {
      if (prev.includes(sphere)) {
        return prev.filter(s => s !== sphere)
      } else if (prev.length < 2) {
        return [...prev, sphere]
      } else {
        return prev
      }
    })
  }

  const handleSave = async () => {
    if (selectedSpheres.length === 0) {
      alert('Выберите хотя бы одну сферу')
      return
    }

    // Проверяем возможность изменения перед сохранением
    try {
      const canChangeData = await api.canChangeFocusSpheres()
      if (!canChangeData.can_change) {
        alert(canChangeData.message || 'Нельзя изменить фокус-сферы: не все вопросы по текущим сферам отвечены')
        return
      }
    } catch (error) {
      console.error('Ошибка проверки возможности изменения:', error)
      // Продолжаем попытку сохранения, так как проверка на бэкенде все равно выполнится
    }

    setSaving(true)
    try {
      await api.updateFocusSpheres(selectedSpheres)
      alert('Фокус-сферы обновлены')
      navigate('/menu')
    } catch (error) {
      alert('Ошибка при сохранении: ' + error.message)
    } finally {
      setSaving(false)
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
        <h2 className="text-title">Изменение фокус-сфер</h2>
        
        {!canChange && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#fff3cd', 
            borderRadius: '8px',
            color: '#856404',
            fontSize: '14px'
          }}>
            {checkMessage || 'Нельзя изменить фокус-сферы: не все вопросы по текущим сферам отвечены за период с момента последнего изменения'}
          </div>
        )}
        
        <div className="sphere-grid" style={{ marginTop: '36px', opacity: canChange ? 1 : 0.5 }}>
          {spheres.map(sphere => {
            const isSelected = selectedSpheres.includes(sphere.key)
            const rating = ratings[sphere.key]
            const isPaid = sphere.name.includes('(платно)')
            
            return (
              <div
                key={sphere.key}
                className={`sphere-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSphereClick(sphere.key)}
                style={{ 
                  cursor: canChange ? 'pointer' : 'not-allowed',
                  backgroundColor: isPaid ? (isDark ? `${sphere.color}20` : `${sphere.color}15`) : undefined
                }}
              >
                {rating && (
                  <span className="sphere-rating">{rating}/10</span>
                )}
                <div 
                  className="sphere-name" 
                  style={{ 
                    textAlign: 'center',
                    color: isPaid ? sphere.color : undefined
                  }}
                >
                  {sphere.name}
                </div>
                <div 
                  className={`checkbox ${isSelected ? 'checked' : ''}`}
                  style={{ marginTop: '8px' }}
                />
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button 
          onClick={handleSave} 
          type="primary"
          disabled={saving || selectedSpheres.length === 0 || !canChange}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
        <Button onClick={() => navigate('/menu')} type="secondary">
          Назад
        </Button>
      </div>
    </div>
  )
}

export default ChangeFocusSpheres


import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import { SPHERES, SPHERE_KEYS } from '../utils/constants'
import '../styles/main.css'
import '../styles/components.css'

const SphereSelection = () => {
  const navigate = useNavigate()
  const [selectedSpheres, setSelectedSpheres] = useState([])
  const [ratings, setRatings] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/rating'))
    
    // Загружаем оценки для отображения
    loadRatings()
    
    return () => {
      hideBackButton()
    }
  }, [navigate])

  const loadRatings = async () => {
    try {
      const data = await api.getSphereRatings()
      const ratingsMap = {}
      data.forEach(item => {
        ratingsMap[item.sphere] = item.rating
      })
      setRatings(ratingsMap)
    } catch (error) {
      console.error('Ошибка загрузки оценок:', error)
    }
  }

  const handleSphereClick = (sphere) => {
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

  const handleContinue = async () => {
    if (selectedSpheres.length === 0) {
      alert('Выберите хотя бы одну сферу')
      return
    }

    if (selectedSpheres.length > 2) {
      alert('Можно выбрать максимум 2 сферы')
      return
    }

    setLoading(true)
    try {
      await api.updateFocusSpheres(selectedSpheres)
      navigate('/chart')
    } catch (error) {
      alert('Ошибка при сохранении выбора: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="content">
        <h2 className="text-title">
          Выбери 1–2 сфер, с которыми хочешь работать сейчас
        </h2>
        
        <div className="sphere-grid" style={{ marginTop: '151px' }}>
          {SPHERE_KEYS.map(sphere => {
            const isSelected = selectedSpheres.includes(sphere)
            const rating = ratings[sphere]
            
            return (
              <div
                key={sphere}
                className={`sphere-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSphereClick(sphere)}
              >
                {rating && (
                  <span className="sphere-rating">{rating}/10</span>
                )}
                <div className="sphere-name">{SPHERES[sphere]}</div>
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
          onClick={handleContinue} 
          type="primary"
          disabled={loading || selectedSpheres.length === 0}
        >
          {loading ? 'Сохранение...' : 'Продолжить'}
        </Button>
        <Button onClick={() => navigate('/rating')} type="secondary">
          Назад
        </Button>
      </div>
    </div>
  )
}

export default SphereSelection


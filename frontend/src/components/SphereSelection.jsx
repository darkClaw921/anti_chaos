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
  const [spheres, setSpheres] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/rating'))
    
    // Загружаем оценки и сферы для отображения
    loadData()
    
    return () => {
      hideBackButton()
    }
  }, [navigate])

  const loadData = async () => {
    try {
      const [spheresData, ratingsData] = await Promise.all([
        api.getAllSpheres(),
        api.getSphereRatings()
      ])
      
      const ratingsMap = {}
      ratingsData.forEach(item => {
        ratingsMap[item.sphere] = item.rating
      })
      setRatings(ratingsMap)
      
      // Сортируем сферы по оценкам по возрастанию (сферы без оценок в конце)
      const sortedSpheres = [...spheresData].sort((a, b) => {
        const ratingA = ratingsMap[a.key] || 0
        const ratingB = ratingsMap[b.key] || 0
        
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
          {spheres.map(sphere => {
            const isSelected = selectedSpheres.includes(sphere.key)
            const rating = ratings[sphere.key]
            
            return (
              <div
                key={sphere.key}
                className={`sphere-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSphereClick(sphere.key)}
              >
                {rating && (
                  <span className="sphere-rating">{rating}/10</span>
                )}
                <div className="sphere-name">{sphere.name}</div>
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


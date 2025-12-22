import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import { SPHERES, SPHERE_KEYS, RATING_SCALE } from '../utils/constants'
import '../styles/main.css'
import '../styles/components.css'

const SphereRating = () => {
  const navigate = useNavigate()
  const [ratings, setRatings] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/format'))
    
    return () => {
      hideBackButton()
    }
  }, [navigate])

  const handleRatingClick = (sphere, rating) => {
    setRatings(prev => ({
      ...prev,
      [sphere]: rating
    }))
  }

  const handleContinue = async () => {
    // Проверяем, что все сферы оценены
    const allRated = SPHERE_KEYS.every(sphere => ratings[sphere] !== undefined)
    
    if (!allRated) {
      alert('Пожалуйста, оцените все сферы')
      return
    }

    setLoading(true)
    try {
      const ratingsArray = Object.entries(ratings).map(([sphere, rating]) => ({
        sphere,
        rating
      }))
      
      await api.createSphereRatings(ratingsArray)
      navigate('/selection')
    } catch (error) {
      alert('Ошибка при сохранении оценок: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="content">
        <h2 className="text-title">Оцени сферы по шкале от 1 до 10</h2>
        
        <div style={{ marginTop: '64px' }}>
          {SPHERE_KEYS.map(sphere => (
            <div key={sphere} style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '12px', fontSize: '16px' }}>
                {SPHERES[sphere]}
              </div>
              <div className="rating-group">
                {RATING_SCALE.map(rating => (
                  <button
                    key={rating}
                    className={`rating-button ${ratings[sphere] === rating ? 'active' : ''}`}
                    onClick={() => handleRatingClick(sphere, rating)}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button 
          onClick={handleContinue} 
          type="primary"
          disabled={loading}
        >
          {loading ? 'Сохранение...' : 'Продолжить'}
        </Button>
      </div>
    </div>
  )
}

export default SphereRating


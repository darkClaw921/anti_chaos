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
  const [spheres, setSpheres] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/format'))
    loadSpheres()
    
    return () => {
      hideBackButton()
    }
  }, [navigate])

  const loadSpheres = async () => {
    try {
      const data = await api.getAllSpheres()
      setSpheres(data)
    } catch (error) {
      console.error('Ошибка загрузки сфер:', error)
      // Используем константы как fallback
      const fallbackSpheres = SPHERE_KEYS.map(key => ({
        key,
        name: SPHERES[key]
      }))
      setSpheres(fallbackSpheres)
    }
  }

  const handleRatingClick = (sphere, rating) => {
    setRatings(prev => ({
      ...prev,
      [sphere]: rating
    }))
  }

  const handleContinue = async () => {
    // Проверяем, что все сферы оценены
    const sphereKeys = spheres.length > 0 ? spheres.map(s => s.key) : SPHERE_KEYS
    const allRated = sphereKeys.every(sphere => ratings[sphere] !== undefined)
    
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
          {(spheres.length > 0 ? spheres : SPHERE_KEYS.map(key => ({ key, name: SPHERES[key] }))).map(sphere => {
            const sphereKey = typeof sphere === 'string' ? sphere : sphere.key
            const sphereName = typeof sphere === 'string' ? SPHERES[sphere] : sphere.name
            return (
              <div key={sphereKey} style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '12px', fontSize: '16px' }}>
                  {sphereName}
                </div>
                <div className="rating-group">
                  {RATING_SCALE.map(rating => (
                    <button
                      key={rating}
                      className={`rating-button ${ratings[sphereKey] === rating ? 'active' : ''}`}
                      onClick={() => handleRatingClick(sphereKey, rating)}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
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


import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import { SPHERES, SPHERE_KEYS, RATING_SCALE } from '../utils/constants'
import '../styles/main.css'
import '../styles/components.css'

const EditSphereRating = () => {
  const navigate = useNavigate()
  const [ratings, setRatings] = useState({})
  const [spheres, setSpheres] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingRatings, setLoadingRatings] = useState(true)

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/settings'))
    
    // Загружаем текущие оценки и сферы
    loadCurrentRatings()
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

  const loadCurrentRatings = async () => {
    try {
      const data = await api.getSphereRatings()
      const ratingsMap = {}
      data.forEach(item => {
        ratingsMap[item.sphere] = item.rating
      })
      setRatings(ratingsMap)
    } catch (error) {
      console.error('Ошибка загрузки оценок:', error)
    } finally {
      setLoadingRatings(false)
    }
  }

  const handleRatingClick = (sphere, rating) => {
    setRatings(prev => ({
      ...prev,
      [sphere]: rating
    }))
  }

  const handleSave = async () => {
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
      alert('Оценки сохранены')
      navigate('/settings')
    } catch (error) {
      alert('Ошибка при сохранении оценок: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingRatings) {
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
        <h2 className="text-title">Изменить оценку сфер жизни</h2>
        
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
          onClick={handleSave} 
          type="primary"
          disabled={loading}
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </Button>
        <Button onClick={() => navigate('/settings')} type="secondary">
          Отмена
        </Button>
      </div>
    </div>
  )
}

export default EditSphereRating


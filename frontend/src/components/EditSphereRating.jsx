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
      // Сортируем сферы: сначала обычные, потом платные в конце
      const sortedSpheres = [...data].sort((a, b) => {
        const isPaidA = a.name.includes('(платно)')
        const isPaidB = b.name.includes('(платно)')
        
        // Платные сферы всегда идут в конец
        if (isPaidA && !isPaidB) return 1
        if (!isPaidA && isPaidB) return -1
        
        // Если обе платные или обе обычные, сохраняем исходный порядок
        return 0
      })
      setSpheres(sortedSpheres)
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

  const handleRatingClick = (sphere, rating, isPaid) => {
    // Блокируем оценку платных сфер
    if (isPaid) {
      return
    }
    
    setRatings(prev => ({
      ...prev,
      [sphere]: rating
    }))
  }

  const handleSave = async () => {
    // Проверяем, что все обычные (не платные) сферы оценены
    const sphereKeys = spheres.length > 0 ? spheres.map(s => s.key) : SPHERE_KEYS
    // Фильтруем платные сферы из проверки
    const regularSpheres = sphereKeys.filter(key => {
      const sphere = spheres.find(s => s.key === key) || { key, name: SPHERES[key] || '' }
      return !sphere.name.includes('(платно)')
    })
    const allRated = regularSpheres.every(sphere => ratings[sphere] !== undefined)
    
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
            const isPaid = sphereName.includes('(платно)')
            return (
              <div key={sphereKey} style={{ marginBottom: '20px', position: 'relative' }}>
                <div style={{ marginBottom: '12px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {sphereName}
                  {isPaid && <span style={{ fontSize: '16px' }}>🔒</span>}
                </div>
                <div className="rating-group">
                  {RATING_SCALE.map(rating => (
                    <button
                      key={rating}
                      className={`rating-button ${ratings[sphereKey] === rating ? 'active' : ''} ${isPaid ? 'disabled' : ''}`}
                      onClick={() => handleRatingClick(sphereKey, rating, isPaid)}
                      disabled={isPaid}
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


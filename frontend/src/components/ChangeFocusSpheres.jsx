import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import { SPHERES, SPHERE_KEYS } from '../utils/constants'
import '../styles/main.css'
import '../styles/components.css'

const ChangeFocusSpheres = () => {
  const navigate = useNavigate()
  const [selectedSpheres, setSelectedSpheres] = useState([])
  const [ratings, setRatings] = useState({})
  const [spheres, setSpheres] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      const [focusData, ratingsData, spheresData] = await Promise.all([
        api.getFocusSpheres(),
        api.getSphereRatings(),
        api.getAllSpheres()
      ])
      
      setSelectedSpheres(focusData.map(s => s.sphere))
      
      const ratingsMap = {}
      ratingsData.forEach(item => {
        ratingsMap[item.sphere] = item.rating
      })
      setRatings(ratingsMap)
      
      setSpheres(spheresData)
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
        
        <div className="sphere-grid" style={{ marginTop: '36px' }}>
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
          onClick={handleSave} 
          type="primary"
          disabled={saving || selectedSpheres.length === 0}
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


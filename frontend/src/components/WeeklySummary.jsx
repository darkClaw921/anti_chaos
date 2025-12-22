import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import { SPHERES } from '../utils/constants'
import '../styles/main.css'
import '../styles/components.css'

const WeeklySummary = () => {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [spheres, setSpheres] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/progress'))
    loadSummary()
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
    }
  }

  const loadSummary = async () => {
    try {
      const data = await api.getWeeklySummary()
      setSummary(data)
    } catch (error) {
      console.error('Ошибка загрузки итогов:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSphereName = (sphereKey) => {
    const sphere = spheres.find(s => s.key === sphereKey)
    return sphere ? sphere.name : (SPHERES[sphereKey] || sphereKey)
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
        <h2 className="text-title">Неделя завершена</h2>
        <p style={{ marginBottom: '24px' }}>Твоя динамика за последние 7 дней</p>
        
        {summary && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h3>Твои активные сферы</h3>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                {summary.focus_spheres.map(sphere => (
                  <div key={sphere} style={{ 
                    padding: '12px', 
                    border: '1px solid #d9d9d9',
                    borderRadius: '2px',
                    textAlign: 'center',
                    minWidth: '120px'
                  }}>
                    {getSphereName(sphere)}
                  </div>
                ))}
              </div>
            </div>
            
            {summary.progress.grown_spheres.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3>Выросла</h3>
                {summary.progress.grown_spheres.map(item => (
                  <div key={item.sphere} className="progress-item">
                    <div className="progress-item-label">
                      <span>{SPHERES[item.sphere] || item.sphere}</span>
                    </div>
                    <div className="progress-slider">
                      <div 
                        className="progress-slider-fill" 
                        style={{ width: `${(item.growth / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {summary.progress.declined_spheres.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3>Просела</h3>
                {summary.progress.declined_spheres.map(item => (
                  <div key={item.sphere} className="progress-item">
                    <div className="progress-item-label">
                      <span>{SPHERES[item.sphere] || item.sphere}</span>
                    </div>
                    <div className="progress-slider">
                      <div 
                        className="progress-slider-fill" 
                        style={{ width: `${(item.decline / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button onClick={() => navigate('/monthly')} type="primary">
          Месячный отчёт
        </Button>
        <Button onClick={() => navigate('/progress')} type="secondary">
          Назад
        </Button>
        <Button onClick={() => navigate('/menu')} type="secondary">
          Меню
        </Button>
      </div>
    </div>
  )
}

export default WeeklySummary


import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar } from 'react-chartjs-2'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import { prepareSpiderChartDataComparison, getSpiderChartOptions } from '../utils/chart'
import { SPHERES } from '../utils/constants'
import { useTheme } from '../utils/useTheme'
import '../styles/main.css'
import '../styles/components.css'

const MonthlyReport = () => {
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [spheres, setSpheres] = useState([])
  const [loading, setLoading] = useState(true)
  const isDark = useTheme()

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/progress'))
    loadReport()
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

  const loadReport = async () => {
    try {
      const data = await api.getMonthlyReport()
      setReport(data)
    } catch (error) {
      console.error('Ошибка загрузки отчёта:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSphereName = (sphereKey) => {
    const sphere = spheres.find(s => s.key === sphereKey)
    return sphere ? sphere.name : (SPHERES[sphereKey] || sphereKey)
  }

  const handleShare = () => {
    if (window.Telegram && window.Telegram.WebApp) {
      // Используем Telegram Web App API для шаринга
      const shareText = `Мой месячный отчёт по саморазвитию! 🎯`
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`)
    } else {
      // Fallback для обычного браузера
      if (navigator.share) {
        navigator.share({
          title: 'Месячный отчёт',
          text: 'Мой месячный отчёт по саморазвитию!',
          url: window.location.href
        }).catch(() => {
          // Пользователь отменил шаринг
        })
      } else {
        // Копируем ссылку в буфер обмена
        navigator.clipboard.writeText(window.location.href)
        alert('Ссылка скопирована в буфер обмена!')
      }
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

  const chartData = report && report.initial_ratings && report.current_ratings
    ? prepareSpiderChartDataComparison(
        report.initial_ratings,
        report.current_ratings,
        spheres.length > 0 ? spheres : null
      )
    : null

  return (
    <div className="container">
      <div className="content">
        <h2 className="text-title" style={{ marginBottom: '24px' }}>Месячный отчёт</h2>
        
        {report && (
          <>
            {chartData && (
              <>
                <div className="spider-chart-container" style={{ marginTop: '24px', marginBottom: '24px' }}>
                  <Radar data={chartData} options={getSpiderChartOptions(isDark, true)} />
                </div>
                
                {/* Легенда */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '24px', 
                  marginBottom: '32px',
                  fontSize: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '20px', 
                      height: '2px', 
                      backgroundColor: '#1890ff',
                      borderBottom: '2px solid #1890ff'
                    }}></div>
                    <span style={{ color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)' }}>
                      Было
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '20px', 
                      height: '2px', 
                      backgroundColor: '#52c41a',
                      borderBottom: '2px solid #52c41a'
                    }}></div>
                    <span style={{ color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)' }}>
                      Стало
                    </span>
                  </div>
                </div>
              </>
            )}
            
            {/* Активные сферы */}
            {report.focus_spheres && report.focus_spheres.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
                }}>
                  Активные сферы: {report.focus_spheres.map(s => getSphereName(s)).join(' и ')}
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  lineHeight: '1.6',
                  color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)',
                  marginTop: '8px'
                }}>
                  {report.focus_spheres.map(s => getSphereName(s)).join(' и ')} — это основа для процветающей жизни, 
                  которая позволяет развиваться, работать и наслаждаться ежедневными радостями.
                </p>
              </div>
            )}
            
            {/* Выросшие сферы */}
            {report.progress.grown_spheres.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
                }}>
                  Выросла
                </h3>
                {report.progress.grown_spheres.map(item => (
                  <div key={item.sphere} className="progress-item" style={{ marginBottom: '16px' }}>
                    <div className="progress-item-label" style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{getSphereName(item.sphere)}</span>
                    </div>
                    <div className="progress-slider">
                      <div 
                        className="progress-slider-fill progress-slider-fill-green" 
                        style={{ 
                          width: `${Math.min((item.growth / 10) * 100, 100)}%`,
                          backgroundColor: '#52c41a'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Просевшие сферы */}
            {report.progress.declined_spheres.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
                }}>
                  Просела
                </h3>
                {report.progress.declined_spheres.map(item => (
                  <div key={item.sphere} className="progress-item" style={{ marginBottom: '16px' }}>
                    <div className="progress-item-label" style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{getSphereName(item.sphere)}</span>
                    </div>
                    <div className="progress-slider">
                      <div 
                        className="progress-slider-fill progress-slider-fill-red" 
                        style={{ 
                          width: `${Math.min((item.decline / 10) * 100, 100)}%`,
                          backgroundColor: '#ff4d4f'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto', paddingTop: '24px' }}>
        <Button onClick={handleShare} type="primary" style={{ width: '100%' }}>
          Поделиться результатом
        </Button>
      </div>
    </div>
  )
}

export default MonthlyReport


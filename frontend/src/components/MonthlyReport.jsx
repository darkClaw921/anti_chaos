import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar } from 'react-chartjs-2'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import { prepareSpiderChartData, getSpiderChartOptions } from '../utils/chart'
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

  if (loading) {
    return (
      <div className="container">
        <div className="content">
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  const chartData = report ? prepareSpiderChartData(report.current_ratings, spheres.length > 0 ? spheres : null) : null

  return (
    <div className="container">
      <div className="content">
        <h2 className="text-title">Месячный отчёт</h2>
        
        {report && (
          <>
            {chartData && (
              <div className="spider-chart-container" style={{ marginTop: '36px', marginBottom: '36px' }}>
                <Radar data={chartData} options={getSpiderChartOptions(isDark)} />
              </div>
            )}
            
            <div style={{ marginBottom: '24px' }}>
              <h3>Активные сферы: {report.focus_spheres.map(s => getSphereName(s)).join(' и ')}</h3>
            </div>
            
            {report.progress.grown_spheres.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3>Выросла</h3>
                {report.progress.grown_spheres.map(item => (
                  <div key={item.sphere} className="progress-item">
                    <div className="progress-item-label">
                      <span>{getSphereName(item.sphere)}</span>
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
            
            {report.progress.declined_spheres.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3>Просела</h3>
                {report.progress.declined_spheres.map(item => (
                  <div key={item.sphere} className="progress-item">
                    <div className="progress-item-label">
                      <span>{getSphereName(item.sphere)}</span>
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
        <Button onClick={() => navigate('/menu')} type="primary">
          Продолжить
        </Button>
        <Button onClick={() => navigate('/progress')} type="secondary">
          Назад
        </Button>
      </div>
    </div>
  )
}

export default MonthlyReport


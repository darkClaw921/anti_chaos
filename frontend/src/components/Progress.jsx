import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar } from 'react-chartjs-2'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import { prepareSpiderChartData, getSpiderChartOptions } from '../utils/chart'
import { useTheme } from '../utils/useTheme'
import '../styles/main.css'
import '../styles/components.css'

const Progress = () => {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(null)
  const [spheres, setSpheres] = useState([])
  const [loading, setLoading] = useState(true)
  const isDark = useTheme()

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/menu'))
    loadProgress()
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

  const loadProgress = async () => {
    try {
      const data = await api.getProgress()
      setProgress(data)
    } catch (error) {
      console.error('Ошибка загрузки прогресса:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPeriodText = () => {
    if (!progress || !progress.period_days) {
      return 'Твоя динамика'
    }
    
    const days = progress.period_days
    if (days === 1) {
      return 'Твоя динамика за 1 день'
    } else if (days < 7) {
      return `Твоя динамика за ${days} дня`
    } else if (days < 30) {
      return `Твоя динамика за ${days} дней`
    } else {
      const months = Math.floor(days / 30)
      const remainingDays = days % 30
      if (remainingDays === 0) {
        return `Твоя динамика за ${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`
      } else {
        return `Твоя динамика за ${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'} и ${remainingDays} ${remainingDays === 1 ? 'день' : remainingDays < 5 ? 'дня' : 'дней'}`
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

  const chartData = progress ? prepareSpiderChartData(progress.current_ratings, spheres.length > 0 ? spheres : null) : null

  return (
    <div className="container">
      <div className="content">
        <h2 className="text-title">{getPeriodText()}</h2>
        
        {chartData && (
          <div className="spider-chart-container" style={{ marginTop: '36px' }}>
            <Radar data={chartData} options={getSpiderChartOptions(isDark)} />
          </div>
        )}
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button onClick={() => navigate('/monthly')} type="secondary">
          Месячный отчёт
        </Button>
        <Button onClick={() => navigate('/menu')} type="secondary">
          Меню
        </Button>
      </div>
    </div>
  )
}

export default Progress


import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar } from 'react-chartjs-2'
import Button from './Button'
import { initTelegramWebApp, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import { prepareSpiderChartData, getSpiderChartOptions } from '../utils/chart'
import { SPHERE_KEYS } from '../utils/constants'
import { useTheme } from '../utils/useTheme'
import '../styles/main.css'
import '../styles/components.css'

const SpiderChart = () => {
  const navigate = useNavigate()
  const [ratings, setRatings] = useState({})
  const [loading, setLoading] = useState(true)
  const isDark = useTheme()

  useEffect(() => {
    initTelegramWebApp()
    hideBackButton()
    loadRatings()
  }, [])

  const loadRatings = async (retryCount = 0) => {
    try {
      const data = await api.getSphereRatings()
      console.log('Загруженные оценки:', data)
      
      const ratingsMap = {}
      if (data && data.length > 0) {
        data.forEach(item => {
          ratingsMap[item.sphere] = item.rating
        })
      }
      
      console.log('Ratings map:', ratingsMap)
      
      // Проверяем, что есть оценки для всех сфер
      const allSpheresRated = SPHERE_KEYS.every(sphere => ratingsMap[sphere] !== undefined)
      
      // Если данных нет или не все сферы оценены, пробуем еще раз (максимум 3 попытки)
      if ((!data || data.length === 0 || !allSpheresRated) && retryCount < 3) {
        console.log(`Повторная попытка загрузки (${retryCount + 1}/3)`)
        setTimeout(() => {
          loadRatings(retryCount + 1)
        }, 500)
        return
      }
      
      setRatings(ratingsMap)
      setLoading(false)
    } catch (error) {
      console.error('Ошибка загрузки оценок:', error)
      // Если ошибка, пробуем загрузить еще раз через небольшую задержку (максимум 3 попытки)
      if (retryCount < 3) {
        setTimeout(() => {
          loadRatings(retryCount + 1)
        }, 1000)
      } else {
        setLoading(false)
      }
    }
  }

  const handleContinue = () => {
    navigate('/daily')
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

  // Проверяем, есть ли данные для отображения
  const hasData = Object.keys(ratings).length > 0 && Object.values(ratings).some(r => r > 0)

  const chartData = prepareSpiderChartData(ratings)
  const chartOptions = getSpiderChartOptions(isDark)

  return (
    <div className="container">
      <div className="content">
        <p style={{ marginBottom: '36px', whiteSpace: 'pre-wrap' }}>
          Вот твоя стартовая карта. Мы будем двигать её каждый день.
        </p>
        
        {hasData ? (
        <div className="spider-chart-container">
          <Radar data={chartData} options={chartOptions} />
        </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Загрузка данных...</p>
          </div>
        )}
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button onClick={handleContinue} type="primary">
          Продолжить
        </Button>
      </div>
    </div>
  )
}

export default SpiderChart


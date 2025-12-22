import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, hideBackButton } from '../services/telegram'
import '../styles/main.css'

const DailySummary = () => {
  const navigate = useNavigate()

  useEffect(() => {
    initTelegramWebApp()
    hideBackButton()
  }, [])

  const handleViewProgress = () => {
    navigate('/progress')
  }

  const handleContinue = () => {
    navigate('/menu')
  }

  return (
    <div className="container">
      <div className="content">
        <p style={{ whiteSpace: 'pre-wrap' }}>
          На сегодня всё. Хочешь посмотреть свой прогресс?
        </p>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button onClick={handleViewProgress} type="primary">
          Посмотреть прогресс
        </Button>
        <Button onClick={handleContinue} type="secondary">
          Продолжить
        </Button>
      </div>
    </div>
  )
}

export default DailySummary


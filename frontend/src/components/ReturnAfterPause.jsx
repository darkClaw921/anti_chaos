import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, hideBackButton } from '../services/telegram'
import '../styles/main.css'

const ReturnAfterPause = () => {
  const navigate = useNavigate()

  useEffect(() => {
    initTelegramWebApp()
    hideBackButton()
  }, [])

  const handleReturn = () => {
    navigate('/daily')
  }

  const handleSkip = () => {
    navigate('/menu')
  }

  return (
    <div className="container">
      <div className="content">
        <p style={{ whiteSpace: 'pre-wrap' }}>
          Я рядом. Хочешь вернуться с одного простого вопроса?
        </p>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button onClick={handleReturn} type="primary">
          Да, вернуться
        </Button>
        <Button onClick={handleSkip} type="secondary">
          Позже
        </Button>
      </div>
    </div>
  )
}

export default ReturnAfterPause


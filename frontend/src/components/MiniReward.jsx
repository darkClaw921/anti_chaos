import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, hideBackButton } from '../services/telegram'
import '../styles/main.css'

const MiniReward = () => {
  const navigate = useNavigate()

  useEffect(() => {
    initTelegramWebApp()
    hideBackButton()
  }, [])

  const handleContinue = () => {
    navigate('/summary')
  }

  return (
    <div className="container">
      <div className="content">
        <p style={{ whiteSpace: 'pre-wrap' }}>
          Ты стабильнее, чем 70% пользователей!
        </p>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button onClick={handleContinue} type="primary">
          Продолжить
        </Button>
      </div>
    </div>
  )
}

export default MiniReward


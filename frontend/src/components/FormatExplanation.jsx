import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import '../styles/main.css'

const FormatExplanation = () => {
  const navigate = useNavigate()

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/'))
    
    return () => {
      hideBackButton()
    }
  }, [navigate])

  const handleContinue = () => {
    navigate('/rating')
  }

  return (
    <div className="container">
      <div className="content">
        <p style={{ whiteSpace: 'pre-wrap' }}>
          Каждый день я задаю несколько вопросов важных о твоей жизни. Раз в месяц новая оценка всех сфер — покажу улучшения и слабые/сильные сферы.
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

export default FormatExplanation


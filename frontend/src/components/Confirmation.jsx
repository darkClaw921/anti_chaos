import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, hideBackButton } from '../services/telegram'
import { SPHERES } from '../utils/constants'
import '../styles/main.css'

const Confirmation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const sphere = location.state?.sphere || 'career'

  useEffect(() => {
    initTelegramWebApp()
    hideBackButton()
  }, [])

  const handleContinue = () => {
    navigate('/reward')
  }

  return (
    <div className="container">
      <div className="content">
        <p style={{ whiteSpace: 'pre-wrap' }}>
          Ответ принят! Ты сделал шаг в сфере "{SPHERES[sphere] || sphere}"
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

export default Confirmation


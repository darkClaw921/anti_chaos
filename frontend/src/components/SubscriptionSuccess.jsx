import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, hideBackButton } from '../services/telegram'
import { useTheme } from '../utils/useTheme'
import '../styles/main.css'
import '../styles/components.css'

const SubscriptionSuccess = () => {
  const navigate = useNavigate()
  const isDark = useTheme()

  useEffect(() => {
    initTelegramWebApp()
    hideBackButton()
  }, [])

  const handleExit = () => {
    // Выход - возврат на главный экран или закрытие приложения
    navigate('/daily')
  }

  const handleViewWeekly = () => {
    navigate('/situation-analysis')
  }

  return (
    <div className="container">
      <div className="content" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <h2 className="text-title" style={{ 
          marginBottom: '24px',
          fontSize: '24px',
          fontWeight: 'bold',
          color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
        }}>
          Подписка оформлена!
        </h2>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '24px',
          color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
          marginBottom: '48px',
          maxWidth: '343px'
        }}>
          Отлично теперь ты стал ещё ближе<br />
          на пути улучшения.
        </p>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto', paddingTop: '24px' }}>
        <Button 
          onClick={handleExit} 
          type="secondary" 
          style={{ width: '100%' }}
        >
          Выйти
        </Button>
        <Button 
          onClick={handleViewWeekly} 
          type="primary" 
          style={{ width: '100%' }}
        >
          Посмотреть итоги недели
        </Button>
      </div>
    </div>
  )
}

export default SubscriptionSuccess


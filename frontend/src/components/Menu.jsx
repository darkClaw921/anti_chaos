import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, hideBackButton } from '../services/telegram'
import '../styles/main.css'
import '../styles/components.css'

const Menu = () => {
  const navigate = useNavigate()

  useEffect(() => {
    initTelegramWebApp()
    hideBackButton()
  }, [])

  return (
    <div className="container">
      <div className="content">
        <h2 className="text-title">Меню</h2>
        
        <div style={{ marginTop: '36px' }}>
          <div className="menu-item" onClick={() => navigate('/progress')}>
            <span className="menu-icon">📊</span>
            <div className="menu-text">Прогресс</div>
          </div>
          <div className="menu-item" onClick={() => navigate('/account')}>
            <span className="menu-icon">👤</span>
            <div className="menu-text">Аккаунт</div>
          </div>
          <div className="menu-item" onClick={() => navigate('/settings')}>
            <span className="menu-icon">⚙️</span>
            <div className="menu-text">Настройки</div>
          </div>
          <div className="menu-item" onClick={() => navigate('/change-spheres')}>
            <span className="menu-icon">🎯</span>
            <div className="menu-text">Изменить фокус-сферы</div>
          </div>
          <div className="menu-item" onClick={() => navigate('/daily')}>
            <span className="menu-icon">❓</span>
            <div className="menu-text">Вопрос дня</div>
          </div>
        </div>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button onClick={() => navigate('/daily')} type="primary">
          Начать день
        </Button>
      </div>
    </div>
  )
}

export default Menu


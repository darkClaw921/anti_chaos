import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, hideBackButton } from '../services/telegram'
import { useTheme } from '../utils/useTheme'
import { api } from '../services/api'
import '../styles/main.css'
import '../styles/components.css'

const SubscriptionSuccess = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isDark = useTheme()
  const [checkingOnboarding, setCheckingOnboarding] = useState(false)

  useEffect(() => {
    initTelegramWebApp()
    hideBackButton()
    
    // Проверяем статус онбординга если выбрана платная подписка
    checkOnboardingAndRedirect()
  }, [])

  const checkOnboardingAndRedirect = async () => {
    try {
      // Получаем информацию о выбранной подписке из location.state
      const selectedPlan = location.state?.plan
      
      // Если выбрана платная подписка (не free), проверяем статус онбординга
      if (selectedPlan && selectedPlan !== 'free') {
        setCheckingOnboarding(true)
        
        // Небольшая задержка, чтобы пользователь увидел сообщение об успехе
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const onboardingStep = await api.getOnboardingStep()
        
        // Если онбординг не завершен, редиректим на соответствующий экран
        if (onboardingStep.step !== 'completed') {
          if (onboardingStep.step === 'rating') {
            navigate('/rating')
            return
          } else if (onboardingStep.step === 'selection') {
            navigate('/selection')
            return
          }
        }
      }
    } catch (error) {
      console.error('Ошибка проверки статуса онбординга:', error)
      // В случае ошибки продолжаем показывать экран успеха
    } finally {
      setCheckingOnboarding(false)
    }
  }

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
          {checkingOnboarding ? (
            'Проверяем статус...'
          ) : (
            <>
              Отлично теперь ты стал ещё ближе<br />
              на пути улучшения.
            </>
          )}
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


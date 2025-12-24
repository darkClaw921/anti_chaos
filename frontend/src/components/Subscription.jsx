import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { useTheme } from '../utils/useTheme'
import '../styles/main.css'
import '../styles/components.css'

const Subscription = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedTariff, setSelectedTariff] = useState(null)
  const [currentTariffIndex, setCurrentTariffIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const scrollContainerRef = React.useRef(null)
  const isDark = useTheme()

  useEffect(() => {
    initTelegramWebApp()
    // Если пришли с экрана пресейла, кнопка назад ведет туда, иначе на monthly
    const backPath = location.state?.from === 'presale' ? '/improvement-plan-presale' : '/monthly'
    setBackButton(() => navigate(backPath))
    
    return () => {
      hideBackButton()
    }
  }, [navigate, location])

  // Прокрутка к текущему тарифу при изменении индекса
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      // Ширина контейнера минус padding (32px = 16px с каждой стороны)
      const containerWidth = container.offsetWidth - 32
      const scrollPosition = currentTariffIndex * containerWidth
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      })
    }
  }, [currentTariffIndex])

  // Обработка свайпа
  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentTariffIndex < tariffs.length - 1) {
      setCurrentTariffIndex(currentTariffIndex + 1)
    }
    if (isRightSwipe && currentTariffIndex > 0) {
      setCurrentTariffIndex(currentTariffIndex - 1)
    }
  }

  const handleSelect = () => {
    if (selectedTariff) {
      // Здесь будет логика выбора тарифа и оплаты
      // После успешной оплаты переходим на экран подтверждения
      navigate('/subscription-success')
    }
  }

  const tariffs = [
    {
      id: 'free',
      title: 'FREE',
      subtitle: 'Доступ на 2 мес.',
      price: null,
      stars: null,
      features: [
        { text: '1 сфера фокуса', included: true },
        { text: '7 вопросов из 22', included: true },
        { text: 'Еженедельные отчёты', included: true }
      ],
      limitations: [
        { text: 'Паутинка сфер', included: false },
        { text: 'До 3-х сфер фокуса', included: false },
        { text: 'Без ИИ-рекомендаций', included: false }
      ],
      isFree: true
    },
    {
      id: 'pro',
      title: 'PRO',
      price: '299 Р/мес',
      stars: '300 Telegram Stars',
      features: [
        { text: 'До 3-х сфер в месяц', included: true },
        { text: 'Полная база вопросов', included: true },
        { text: 'ИИ рекомендации от нашего специального LLM Агента', included: true },
        { text: 'Приоритетная поддержка', included: true }
      ],
      limitations: [],
      isFree: false
    },
    {
      id: 'consultation',
      title: 'Личная консультация',
      price: '4999 P',
      stars: '8000 Telegram Stars',
      description: 'Личный звонок с основателем с ответами на вопросы по темам которые волнуют на 30 минут',
      features: [],
      limitations: [],
      isFree: false
    }
  ]

  return (
    <div className="container">
      <div className="content">
        <h2 className="text-title" style={{ 
          marginBottom: '36px', 
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          Выберете свой идеальный тариф
        </h2>
        
        <div 
          ref={scrollContainerRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '16px',
            marginBottom: '24px',
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingBottom: '8px',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            position: 'relative'
          }}
          className="tariff-scroll-container"
        >
          {tariffs.map((tariff, index) => (
            <div
              key={tariff.id}
              onClick={() => {
                setSelectedTariff(tariff.id)
                setCurrentTariffIndex(index)
              }}
              style={{
                backgroundColor: tariff.isFree 
                  ? '#1890ff' 
                  : (isDark ? '#1f1f1f' : '#ffffff'),
                border: selectedTariff === tariff.id 
                  ? '2px solid #1890ff' 
                  : `1px solid ${isDark ? '#434343' : '#d9d9d9'}`,
                borderRadius: '8px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minWidth: 'calc(100% - 32px)',
                width: 'calc(100% - 32px)',
                flexShrink: 0,
                scrollSnapAlign: 'start',
                boxShadow: selectedTariff === tariff.id 
                  ? '0 4px 12px rgba(24, 144, 255, 0.3)' 
                  : '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: tariff.isFree 
                      ? '#ffffff' 
                      : (isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'),
                    marginBottom: '4px'
                  }}>
                    {tariff.title}
                  </h3>
                  {tariff.subtitle && (
                    <p style={{
                      fontSize: '14px',
                      color: tariff.isFree 
                        ? 'rgba(255, 255, 255, 0.8)' 
                        : (isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)'),
                      marginBottom: '8px'
                    }}>
                      {tariff.subtitle}
                    </p>
                  )}
                  {tariff.price && (
                    <p style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: tariff.isFree 
                        ? '#ffffff' 
                        : (isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'),
                      marginBottom: '4px'
                    }}>
                      {tariff.price}
                    </p>
                  )}
                  {tariff.stars && (
                    <p style={{
                      fontSize: '14px',
                      color: tariff.isFree 
                        ? 'rgba(255, 255, 255, 0.8)' 
                        : (isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)'),
                      marginBottom: '8px'
                    }}>
                      {tariff.stars}
                    </p>
                  )}
                </div>

                {tariff.description && (
                  <p style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: tariff.isFree 
                      ? 'rgba(255, 255, 255, 0.9)' 
                      : (isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'),
                    marginTop: '8px'
                  }}>
                    {tariff.description}
                  </p>
                )}

                {tariff.features.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    {tariff.features.map((feature, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          color: '#52c41a',
                          fontSize: '16px',
                          lineHeight: '20px'
                        }}>✓</span>
                        <span style={{
                          fontSize: '14px',
                          lineHeight: '20px',
                          color: tariff.isFree 
                            ? 'rgba(255, 255, 255, 0.9)' 
                            : (isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)')
                        }}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {tariff.limitations.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    {tariff.limitations.map((limitation, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          color: '#ff4d4f',
                          fontSize: '16px',
                          lineHeight: '20px'
                        }}>✗</span>
                        <span style={{
                          fontSize: '14px',
                          lineHeight: '20px',
                          color: tariff.isFree 
                            ? 'rgba(255, 255, 255, 0.7)' 
                            : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)')
                        }}>
                          {limitation.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Точки пагинации */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '24px'
        }}>
          {tariffs.map((_, index) => (
            <div
              key={index}
              onClick={() => {
                setCurrentTariffIndex(index)
              }}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: index === currentTariffIndex 
                  ? '#1890ff' 
                  : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'),
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto', paddingTop: '24px' }}>
        <Button 
          onClick={() => {
            const backPath = location.state?.from === 'presale' 
              ? '/improvement-plan-presale' 
              : '/monthly'
            navigate(backPath)
          }} 
          type="secondary" 
          style={{ width: '100%' }}
        >
          Назад
        </Button>
        <Button 
          onClick={handleSelect} 
          type="primary" 
          style={{ width: '100%' }}
          disabled={!selectedTariff}
        >
          Выбрать
        </Button>
      </div>
    </div>
  )
}

export default Subscription


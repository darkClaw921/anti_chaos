import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import { SPHERES } from '../utils/constants'
import { useTheme } from '../utils/useTheme'
import '../styles/main.css'
import '../styles/components.css'

const SituationAnalysis = () => {
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [spheres, setSpheres] = useState([])
  const [focusSpheres, setFocusSpheres] = useState([])
  const [loading, setLoading] = useState(true)
  const isDark = useTheme()

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/subscription-success'))
    loadData()
    
    return () => {
      hideBackButton()
    }
  }, [navigate])

  const loadData = async () => {
    try {
      const [reportData, spheresData, focusSpheresData] = await Promise.all([
        api.getMonthlyReport(),
        api.getAllSpheres(),
        api.getFocusSpheres()
      ])
      
      setReport(reportData)
      setSpheres(spheresData)
      setFocusSpheres(focusSpheresData.map(s => s.sphere))
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSphereName = (sphereKey) => {
    const sphere = spheres.find(s => s.key === sphereKey)
    return sphere ? sphere.name : (SPHERES[sphereKey] || sphereKey)
  }

  const handleCopyInfo = async () => {
    const focusSphereList = report?.focus_spheres && report.focus_spheres.length > 0 
      ? report.focus_spheres 
      : (focusSpheres.length > 0 ? focusSpheres : [])
    const focusSphereForCopy = focusSphereList[0] || 'career'
    
    const planText = `АНАЛИЗ ТЕКУЩЕЙ СИТУАЦИИ

На основе твоих ${report?.answers_count || 20} ответов я составил персональный план на 30 дней:

Показатели сферы '${getSphereName(focusSphereForCopy)}'
Текущие: 4/10
Цель: 10/10

Выявленные паттерны:
• Низкая энергия → срывы в переговорах
• Нет системы работы с базой клиентов
• Реактивная работа (не проактивная)
• Отсутствие чётких метрик роста

Фаза 1: Фундамент (Недели 1-4)
Цель: Навести порядок в текущих процессах

Шаг 1: Аудит рабочего времени
Срок: до 20.01.2024
Времени: 3 часа (однократно)

1. Отследи 3 рабочих дня:
• Во что уходит время?
• Сколько реально на продажи?
• Сколько на администрирование?

2. Выдели:
✓ Что можно делегировать?
✓ Что можно автоматизировать?
✓ Что убрать совсем?

Почему это первый шаг?
Ты упомянул 'работаю много, результата мало' → Проблема не в объёме работы, а в её структуре.

Метрика успеха:
Найдено минимум 5 часов/неделю низкоценных задач`

    try {
      await navigator.clipboard.writeText(planText)
      alert('Информация скопирована в буфер обмена!')
    } catch (error) {
      console.error('Ошибка копирования:', error)
      alert('Не удалось скопировать информацию')
    }
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

  const answersCount = report?.answers_count || 20
  // Используем фокус-сферы из отчёта, если есть, иначе из отдельного запроса
  const focusSphereList = report?.focus_spheres && report.focus_spheres.length > 0 
    ? report.focus_spheres 
    : (focusSpheres.length > 0 ? focusSpheres : [])
  const focusSphere = focusSphereList[0] || 'career'
  const sphereName = getSphereName(focusSphere)
  const currentRating = report?.current_ratings?.[focusSphere] || 4
  const goalRating = 10

  const patterns = [
    'Низкая энергия → срывы в переговорах',
    'Нет системы работы с базой клиентов',
    'Реактивная работа (не проактивная)',
    'Отсутствие чётких метрик роста'
  ]

  return (
    <div className="container">
      <div className="content" style={{ paddingBottom: '24px' }}>
        <h2 style={{ 
          fontSize: '20px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          marginBottom: '24px',
          color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
          letterSpacing: '0.5px'
        }}>
          АНАЛИЗ ТЕКУЩЕЙ СИТУАЦИИ
        </h2>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '24px',
          color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
          marginBottom: '24px'
        }}>
          На основе твоих {answersCount} ответов я составил персональный план на 30 дней:
        </p>

        {/* Показатели сферы */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
          }}>
            Показатели сферы '{sphereName}'
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '14px',
              color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
            }}>
              <span>Текущие:</span>
              <span style={{ fontWeight: 'bold' }}>{currentRating}/10</span>
            </div>
            <div className="progress-slider">
              <div 
                className="progress-slider-fill progress-slider-fill-red" 
                style={{ 
                  width: `${(currentRating / 10) * 100}%`,
                  backgroundColor: '#ff4d4f'
                }}
              />
            </div>
          </div>

          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '14px',
              color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
            }}>
              <span>Цель:</span>
              <span style={{ fontWeight: 'bold' }}>{goalRating}/10</span>
            </div>
            <div className="progress-slider">
              <div 
                className="progress-slider-fill progress-slider-fill-green" 
                style={{ 
                  width: `${(goalRating / 10) * 100}%`,
                  backgroundColor: '#52c41a'
                }}
              />
            </div>
          </div>
        </div>

        {/* Выявленные паттерны */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
          }}>
            Выявленные паттерны:
          </h3>
          {patterns.map((pattern, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <span style={{
                color: '#ff4d4f',
                fontSize: '16px',
                lineHeight: '20px',
                fontWeight: 'bold'
              }}>!</span>
              <span style={{
                fontSize: '14px',
                lineHeight: '20px',
                color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
              }}>
                {pattern}
              </span>
            </div>
          ))}
        </div>

        {/* Фаза 1 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
          }}>
            Фаза 1: Фундамент (Недели 1-4)
          </h3>
          
          <p style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
          }}>
            Цель: Навести порядок в текущих процессах
          </p>

          {/* Шаг 1 */}
          <div style={{
            backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '18px' }}>🕐</span>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
              }}>
                Шаг 1: Аудит рабочего времени
              </h4>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontSize: '14px',
              color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)'
            }}>
              <span>📅</span>
              <span>Срок: до 20.01.2024</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)'
            }}>
              <span>⏱</span>
              <span>Времени: 3 часа (однократно)</span>
            </div>

            {/* Детальные задачи */}
            <div style={{ marginTop: '16px' }}>
              <p style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
              }}>
                1. Отследи 3 рабочих дня:
              </p>
              <ul style={{
                marginLeft: '20px',
                marginBottom: '16px',
                fontSize: '14px',
                lineHeight: '24px',
                color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
              }}>
                <li>Во что уходит время?</li>
                <li>Сколько реально на продажи?</li>
                <li>Сколько на администрирование?</li>
              </ul>

              <p style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
              }}>
                2. Выдели:
              </p>
              <ul style={{
                marginLeft: '20px',
                fontSize: '14px',
                lineHeight: '24px',
                color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
              }}>
                <li>✓ Что можно делегировать?</li>
                <li>✓ Что можно автоматизировать?</li>
                <li>✓ Что убрать совсем?</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Почему это первый шаг */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '12px',
            color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
          }}>
            Почему это первый шаг?
          </h3>
          <p style={{
            fontSize: '14px',
            lineHeight: '24px',
            color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
          }}>
            Ты упомянул 'работаю много, результата мало' → Проблема не в объёме работы, а в её структуре.
          </p>
        </div>

        {/* Метрика успеха */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '12px',
            color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
          }}>
            Метрика успеха:
          </h3>
          <p style={{
            fontSize: '14px',
            lineHeight: '24px',
            color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
          }}>
            Найдено минимум 5 часов/неделю низкоценных задач
          </p>
        </div>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto', paddingTop: '24px' }}>
        <Button 
          onClick={() => navigate('/subscription-success')} 
          type="secondary" 
          style={{ width: '100%' }}
        >
          Назад
        </Button>
        <Button 
          onClick={handleCopyInfo} 
          type="primary" 
          style={{ width: '100%' }}
        >
          Скопировать информацию
        </Button>
      </div>
    </div>
  )
}

export default SituationAnalysis


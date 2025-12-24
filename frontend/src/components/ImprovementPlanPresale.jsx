import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import { SPHERES } from '../utils/constants'
import { useTheme } from '../utils/useTheme'
import '../styles/main.css'
import '../styles/components.css'

const ImprovementPlanPresale = () => {
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [spheres, setSpheres] = useState([])
  const [loading, setLoading] = useState(true)
  const isDark = useTheme()

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/monthly'))
    loadReport()
    loadSpheres()
    
    return () => {
      hideBackButton()
    }
  }, [navigate])

  const loadSpheres = async () => {
    try {
      const data = await api.getAllSpheres()
      setSpheres(data)
    } catch (error) {
      console.error('Ошибка загрузки сфер:', error)
    }
  }

  const loadReport = async () => {
    try {
      const data = await api.getMonthlyReport()
      setReport(data)
    } catch (error) {
      console.error('Ошибка загрузки отчёта:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSphereName = (sphereKey) => {
    const sphere = spheres.find(s => s.key === sphereKey)
    return sphere ? sphere.name : (SPHERES[sphereKey] || sphereKey)
  }

  const getTitle = () => {
    if (report && report.focus_spheres && report.focus_spheres.length > 0) {
      const firstSphere = report.focus_spheres[0]
      const sphereName = getSphereName(firstSphere)
      return `Твой план по улучшению ${sphereName.toLowerCase()} готов!`
    }
    return 'Твой план по улучшению готов!'
  }

  const handleViewTariffs = () => {
    navigate('/subscription', { state: { from: 'presale' } })
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

  const answersCount = report?.answers_count || 0

  return (
    <div className="container">
      <div className="content">
        <h2 className="text-title" style={{ marginBottom: '36px', textAlign: 'center' }}>
          {getTitle()}
        </h2>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ 
            fontSize: '16px',
            lineHeight: '24px',
            color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
          }}>
            <p style={{ 
              fontWeight: 'bold',
              marginBottom: '12px'
            }}>
              {`На основе твоих ${answersCount} ответов я составил `}
              <br />
              персональный план на 30 дней:
            </p>
            <div style={{ 
              fontSize: '16px',
              lineHeight: '24px',
              marginTop: '12px'
            }}>
              <p style={{ marginBottom: '0' }}>✓ 20 конкретных шагов (с датами)</p>
              <p style={{ marginBottom: '0' }}>✓ Скрытые блоки, которые тебя останавливают</p>
              <p style={{ marginBottom: '0' }}>✓ Связь {report?.focus_spheres && report.focus_spheres.length > 0 
                ? getSphereName(report.focus_spheres[0]).toLowerCase() 
                : 'сферы'} с другими сферами</p>
              <p style={{ marginBottom: '0' }}>✓ Метрики прогресса (как отслеживать)</p>
              <p>✓ Micro-habits для каждого шага</p>
            </div>
          </div>
          
          {/* Разделительная линия */}
          <div style={{ 
            height: '1px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            margin: '12px 0'
          }}></div>
          
          {/* Информация о платной функции */}
          <div style={{ 
            fontSize: '16px',
            lineHeight: '24px',
            color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
          }}>
            <p style={{ 
              fontWeight: 'bold',
              marginBottom: '0'
            }}>
              🔒 Персональные планы — это платная функция
            </p>
            <p style={{ marginTop: '0' }}>
              Планы выстраиваются на основе всех твоих ответов. Это требует серьёзных вычислений и глубокого анализа паттернов.
            </p>
          </div>
          
          {/* Разделительная линия */}
          <div style={{ 
            height: '1px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            margin: '12px 0'
          }}></div>
          
          {/* Отзыв пользователя */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <p style={{ 
              fontSize: '16px',
              fontWeight: 'bold',
              lineHeight: '24px',
              color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
              marginBottom: '0'
            }}>
              Реальные истории пользователя:
            </p>
            <div style={{ 
              fontSize: '16px',
              fontStyle: 'italic',
              lineHeight: '24px',
              color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
              marginBottom: '8px'
            }}>
              <p style={{ marginBottom: '0' }}>
                «План показал то, чего я не смог увидеть сам. Через 1,5 месяца смог получить прибавку».
              </p>
            </div>
            <p style={{ 
              fontSize: '14px',
              fontWeight: 'bold',
              lineHeight: '22px',
              color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
              marginTop: '0'
            }}>
              Алексей, Product Manager, 29 лет
            </p>
          </div>
        </div>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto', paddingTop: '24px' }}>
        <Button onClick={() => navigate('/monthly')} type="secondary" style={{ width: '100%' }}>
          Назад
        </Button>
        <Button onClick={handleViewTariffs} type="primary" style={{ width: '100%' }}>
          Посмотреть тарифы
        </Button>
      </div>
    </div>
  )
}

export default ImprovementPlanPresale


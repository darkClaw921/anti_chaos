import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import { SPHERES } from '../utils/constants'
import '../styles/main.css'

const DailyQuestion = () => {
  const navigate = useNavigate()
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [skipCount, setSkipCount] = useState(0)
  const [notUnderstoodCount, setNotUnderstoodCount] = useState(0)
  const [focusSpheres, setFocusSpheres] = useState([])
  const [currentSphereIndex, setCurrentSphereIndex] = useState(0)

  useEffect(() => {
    initTelegramWebApp()
    hideBackButton()
    
    // Загружаем счетчики из localStorage
    const today = new Date().toDateString()
    const savedSkipCount = localStorage.getItem(`skip_count_${today}`)
    const savedNotUnderstoodCount = localStorage.getItem(`not_understood_count_${today}`)
    const savedCurrentSphereIndex = localStorage.getItem(`current_sphere_index_${today}`)
    
    if (savedSkipCount) setSkipCount(parseInt(savedSkipCount, 10))
    if (savedNotUnderstoodCount) setNotUnderstoodCount(parseInt(savedNotUnderstoodCount, 10))
    if (savedCurrentSphereIndex) setCurrentSphereIndex(parseInt(savedCurrentSphereIndex, 10))
    
    // Загружаем фокус-сферы, а затем вопрос
    loadFocusSpheres().then(() => {
      loadQuestion()
    })
  }, [])

  const loadFocusSpheres = async () => {
    try {
      const spheres = await api.getFocusSpheres()
      setFocusSpheres(spheres.map(s => s.sphere))
      // Определяем текущую сферу из localStorage или используем первую по умолчанию
      const today = new Date().toDateString()
      const savedCurrentSphereIndex = localStorage.getItem(`current_sphere_index_${today}`)
      if (savedCurrentSphereIndex !== null) {
        setCurrentSphereIndex(parseInt(savedCurrentSphereIndex, 10))
      } else {
      setCurrentSphereIndex(0)
      }
    } catch (error) {
      console.error('Ошибка загрузки фокус-сфер:', error)
    }
  }

  const loadQuestion = async (sphereIndex = null) => {
    setLoading(true)
    try {
      // Используем переданный индекс или текущий из state
      const targetIndex = sphereIndex !== null ? sphereIndex : currentSphereIndex
      // Определяем текущую сферу для запроса
      const currentSphere = focusSpheres.length > 0 && targetIndex < focusSpheres.length
        ? focusSpheres[targetIndex]
        : null
      const data = await api.getDailyQuestion(currentSphere)
      setQuestion(data)
      setAnswer('')
    } catch (error) {
      console.error('Ошибка загрузки вопроса:', error)
      if (error.message.includes('404') || error.message.includes('No question')) {
        setQuestion(null)
        // Когда вопросы закончились, предложить оценку сфер
        // Пока просто переходим на summary
      } else {
        alert('Не удалось загрузить вопрос. Попробуйте позже.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!answer.trim()) {
      alert('Пожалуйста, введите ответ')
      return
    }

    if (!question) return

    setSaving(true)
    try {
      await api.createAnswer(question.id, answer.trim())
      // Сбрасываем счетчики после успешного ответа
      const today = new Date().toDateString()
      localStorage.removeItem(`skip_count_${today}`)
      localStorage.removeItem(`not_understood_count_${today}`)
      localStorage.removeItem(`current_sphere_index_${today}`)
      setSkipCount(0)
      setNotUnderstoodCount(0)
      setCurrentSphereIndex(0)
      
      navigate('/confirmation', { 
        state: { 
          sphere: question.sphere,
          answer: answer.trim()
        } 
      })
    } catch (error) {
      alert('Ошибка при сохранении ответа: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    const today = new Date().toDateString()
    const newSkipCount = skipCount + 1
    setSkipCount(newSkipCount)
    localStorage.setItem(`skip_count_${today}`, newSkipCount.toString())
    
    // Если выбраны 2 сферы и это 2-е нажатие, переходим на 2-ю сферу
    let newSphereIndex = currentSphereIndex
    if (focusSpheres.length === 2 && newSkipCount >= 2 && currentSphereIndex === 0) {
      newSphereIndex = 1
      setCurrentSphereIndex(1)
      // Сохраняем текущую сферу в localStorage для сохранения состояния
      localStorage.setItem(`current_sphere_index_${today}`, '1')
    }
    
    // Если выбрана 1 сфера и это 2-е нажатие, больше не показываем кнопку "Пропустить"
    // Кнопка "Пропустить все вопросы сегодня" уже будет показана
    
    await loadQuestion(newSphereIndex)
  }

  const handleSkipAll = () => {
    navigate('/summary')
  }

  const handleNotUnderstood = async () => {
    const today = new Date().toDateString()
    const newNotUnderstoodCount = notUnderstoodCount + 1
    setNotUnderstoodCount(newNotUnderstoodCount)
    localStorage.setItem(`not_understood_count_${today}`, newNotUnderstoodCount.toString())
    
    // Если выбраны 2 сферы и это 2-е нажатие, переходим на 2-ю сферу
    let newSphereIndex = currentSphereIndex
    if (focusSpheres.length === 2 && newNotUnderstoodCount >= 2 && currentSphereIndex === 0) {
      newSphereIndex = 1
      setCurrentSphereIndex(1)
      // Сохраняем текущую сферу в localStorage для сохранения состояния
      localStorage.setItem(`current_sphere_index_${today}`, '1')
    }
    
    await loadQuestion(newSphereIndex)
  }

  if (loading) {
    return (
      <div className="container">
        <div className="content">
          <p>Загрузка вопроса...</p>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="container">
        <div className="content">
          <p>Вопросы на сегодня закончились</p>
          <p style={{ marginTop: '16px', fontSize: '14px', color: 'rgba(0, 0, 0, 0.65)' }}>
            Предлагаем оценить сферы жизни, с которыми вы работали
          </p>
        </div>
        <div className="btn-group" style={{ marginTop: 'auto' }}>
          <Button onClick={() => navigate('/summary')} type="primary">
            Перейти к итогам
          </Button>
        </div>
      </div>
    )
  }

  const showSkipAllButton = skipCount >= 2

  return (
    <div className="container">
      <div className="content">
        <h2 className="text-title" style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '24px',
          lineHeight: '1.4'
        }}>
          Сфера «{SPHERES[question.sphere] || question.sphere}»
        </h2>
        
        <p style={{ 
          whiteSpace: 'pre-wrap',
          fontSize: '16px',
          lineHeight: '1.5',
          marginBottom: '24px',
          color: 'rgba(0, 0, 0, 0.85)'
        }}>
          {question.text}
        </p>

        {/* Зона ответа */}
        <div style={{ marginBottom: '24px' }}>
          <div className="form-group">
            <textarea
              className="form-textarea"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Введите ваш ответ..."
              rows={8}
            />
          </div>
          <Button 
            onClick={handleSubmit} 
            type="primary"
            disabled={saving || !answer.trim()}
            style={{ width: '100%', marginTop: '12px' }}
          >
            {saving ? 'Сохранение...' : 'Отправить ответ'}
          </Button>
        </div>

        {/* Кнопки действий */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          marginTop: '24px'
        }}>
          {/* Кнопка Пропустить */}
          {/* Если выбрана 1 сфера: скрывается после 2 нажатий */}
          {/* Если выбраны 2 сферы: всегда видна, после 2 нажатий переходит на 2-ю сферу */}
          {(focusSpheres.length === 1 ? skipCount < 2 : true) && (
            <Button 
              onClick={handleSkip} 
              type="secondary"
              style={{ 
                width: '100%',
                backgroundColor: '#ffffff',
                borderColor: '#d9d9d9',
                color: 'rgba(0, 0, 0, 0.85)'
              }}
            >
              Пропустить
            </Button>
          )}
          
          {/* Кнопка Пропустить все вопросы сегодня (появляется дополнительно после 2 нажатий) */}
          {showSkipAllButton && (
            <Button 
              onClick={handleSkipAll} 
              type="secondary"
              style={{ 
                width: '100%',
                backgroundColor: '#ffffff',
                borderColor: '#d9d9d9',
                color: 'rgba(0, 0, 0, 0.85)'
              }}
            >
              Пропустить все вопросы сегодня
            </Button>
          )}
          
          {/* Кнопка Не понял вопроса (максимум 2 раза) */}
          {notUnderstoodCount < 2 && (
            <Button 
              onClick={handleNotUnderstood} 
              type="secondary"
              style={{ 
                width: '100%',
                backgroundColor: '#ffffff',
                borderColor: '#d9d9d9',
                color: 'rgba(0, 0, 0, 0.85)'
              }}
            >
              Не понял вопроса
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DailyQuestion

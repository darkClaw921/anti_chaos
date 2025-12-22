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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initTelegramWebApp()
    hideBackButton()
    loadQuestion()
  }, [])

  const loadQuestion = async () => {
    setLoading(true)
    try {
      const data = await api.getDailyQuestion()
      setQuestion(data)
    } catch (error) {
      console.error('Ошибка загрузки вопроса:', error)
      if (error.message.includes('404') || error.message.includes('No question')) {
        setQuestion(null)
      } else {
        alert('Не удалось загрузить вопрос. Попробуйте позже.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = () => {
    if (question) {
      navigate(`/answer/${question.id}`)
    }
  }

  const handleSkipAll = () => {
    navigate('/summary')
  }

  const handleNotUnderstood = async () => {
    await loadQuestion()
  }

  const handleNextQuestion = async () => {
    await loadQuestion()
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
        </div>
        <div className="btn-group" style={{ marginTop: 'auto' }}>
          <Button onClick={() => navigate('/summary')} type="primary">
            Перейти к итогам
          </Button>
        </div>
      </div>
    )
  }

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
          marginBottom: '36px',
          color: 'rgba(0, 0, 0, 0.85)'
        }}>
          {question.text}
        </p>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          marginTop: '24px'
        }}>
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
          
          <Button 
            onClick={handleNextQuestion} 
            type="secondary"
            style={{ 
              width: '100%',
              backgroundColor: '#ffffff',
              borderColor: '#d9d9d9',
              color: 'rgba(0, 0, 0, 0.85)'
            }}
          >
            Перейти к следующему вопросу
          </Button>
          
          <Button 
            onClick={handleAnswer} 
            type="primary"
            style={{ 
              width: '100%',
              marginTop: '8px'
            }}
          >
            Написать ответ
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DailyQuestion


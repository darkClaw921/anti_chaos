import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import '../styles/main.css'

const SimpleQuestion = () => {
  const navigate = useNavigate()
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initTelegramWebApp()
    hideBackButton()
    loadQuestion()
  }, [])

  const loadQuestion = async () => {
    try {
      const data = await api.getSimpleQuestion()
      setQuestion(data)
    } catch (error) {
      console.error('Ошибка загрузки вопроса:', error)
      alert('Не удалось загрузить вопрос')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = () => {
    if (question) {
      navigate(`/answer/${question.id}`)
    }
  }

  const handleSkip = () => {
    navigate('/summary')
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
        <p style={{ whiteSpace: 'pre-wrap', marginBottom: '36px' }}>
          Сегодня коротко: очень простой вопрос
        </p>
        <p style={{ whiteSpace: 'pre-wrap' }}>
          {question.text}
        </p>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button onClick={handleAnswer} type="primary">
          Ответить
        </Button>
        <Button onClick={handleSkip} type="secondary">
          Пропустить
        </Button>
      </div>
    </div>
  )
}

export default SimpleQuestion


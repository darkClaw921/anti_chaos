import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import '../styles/main.css'

const AnswerForm = () => {
  const navigate = useNavigate()
  const { questionId } = useParams()
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/daily'))
    loadQuestion()
    
    return () => {
      hideBackButton()
    }
  }, [questionId, navigate])

  const loadQuestion = async () => {
    try {
      const data = await api.getQuestion(parseInt(questionId))
      setQuestion(data)
    } catch (error) {
      console.error('Ошибка загрузки вопроса:', error)
      alert('Не удалось загрузить вопрос')
      navigate('/daily')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!answer.trim()) {
      alert('Пожалуйста, введите ответ')
      return
    }

    setSaving(true)
    try {
      await api.createAnswer(parseInt(questionId), answer.trim())
      navigate('/confirmation', { 
        state: { 
          sphere: question?.sphere,
          answer: answer.trim()
        } 
      })
    } catch (error) {
      alert('Ошибка при сохранении ответа: ' + error.message)
    } finally {
      setSaving(false)
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

  return (
    <div className="container">
      <div className="content">
        <h2 style={{ marginBottom: '24px' }}>Ответ на вопрос</h2>
        <p style={{ marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
          {question?.text}
        </p>
        
        <div className="form-group">
          <textarea
            className="form-textarea"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Введите ваш ответ..."
            rows={10}
          />
        </div>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button 
          onClick={handleSubmit} 
          type="primary"
          disabled={saving || !answer.trim()}
        >
          {saving ? 'Сохранение...' : 'Отправить'}
        </Button>
        <Button 
          onClick={() => navigate('/daily')} 
          type="secondary"
          disabled={saving}
        >
          Отмена
        </Button>
      </div>
    </div>
  )
}

export default AnswerForm


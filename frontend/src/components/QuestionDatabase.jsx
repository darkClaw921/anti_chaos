import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import { SPHERES, SPHERE_KEYS } from '../utils/constants'
import '../styles/main.css'

const QuestionDatabase = () => {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [spheres, setSpheres] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSphere, setSelectedSphere] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [formData, setFormData] = useState({
    sphere: '',
    text: '',
    type: 'text',
    is_active: true
  })

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/settings'))
    loadQuestions()
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
      // Используем константы как fallback
      const fallbackSpheres = SPHERE_KEYS.map(key => ({
        key,
        name: SPHERES[key]
      }))
      setSpheres(fallbackSpheres)
    }
  }

  const loadQuestions = async () => {
    try {
      const data = await api.getAllQuestions(false)
      setQuestions(data)
    } catch (error) {
      console.error('Ошибка загрузки вопросов:', error)
      alert('Не удалось загрузить вопросы: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setFormData({
      sphere: '',
      text: '',
      type: 'text',
      is_active: true
    })
    setEditingQuestion(null)
    setShowAddForm(true)
  }

  const handleEdit = (question) => {
    setFormData({
      sphere: question.sphere,
      text: question.text,
      type: question.type,
      is_active: question.is_active !== undefined ? question.is_active : true
    })
    setEditingQuestion(question)
    setShowAddForm(true)
  }

  const handleDelete = async (questionId) => {
    if (!confirm('Вы уверены, что хотите удалить этот вопрос?')) {
      return
    }
    
    try {
      await api.deleteQuestion(questionId)
      await loadQuestions()
      alert('Вопрос удален')
    } catch (error) {
      alert('Ошибка при удалении вопроса: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingQuestion) {
        await api.updateQuestion(editingQuestion.id, formData)
        alert('Вопрос обновлен')
      } else {
        await api.createQuestion(formData)
        alert('Вопрос добавлен')
      }
      setShowAddForm(false)
      setEditingQuestion(null)
      await loadQuestions()
    } catch (error) {
      alert('Ошибка при сохранении вопроса: ' + error.message)
    }
  }

  const filteredQuestions = selectedSphere === 'all' 
    ? questions 
    : questions.filter(q => q.sphere === selectedSphere)

  if (loading) {
    return (
      <div className="container">
        <div className="content">
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  if (showAddForm) {
    return (
      <div className="container">
        <div className="content">
          <h2 className="text-title">
            {editingQuestion ? 'Редактировать вопрос' : 'Добавить вопрос'}
          </h2>
          
          <form onSubmit={handleSubmit} style={{ marginTop: '36px' }}>
            <div className="form-group">
              <label className="form-label">Сфера</label>
              <select
                className="form-input"
                value={formData.sphere}
                onChange={(e) => setFormData({ ...formData, sphere: e.target.value })}
                required
              >
                <option value="">Выберите сферу</option>
                {spheres.map(sphere => (
                  <option key={sphere.key} value={sphere.key}>{sphere.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Текст вопроса</label>
              <textarea
                className="form-input"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                rows="4"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Тип</label>
              <select
                className="form-input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="text">Текст</option>
                <option value="short_answer">Краткий ответ</option>
              </select>
            </div>
            
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                Активен
              </label>
            </div>
            
            <div className="btn-group" style={{ marginTop: '24px' }}>
              <Button type="primary" onClick={handleSubmit}>
                Сохранить
              </Button>
              <Button type="secondary" onClick={() => {
                setShowAddForm(false)
                setEditingQuestion(null)
              }}>
                Отмена
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="content">
        <h2 className="text-title">База вопросов</h2>
        
        <div style={{ marginTop: '24px' }}>
          <div className="form-group">
            <label className="form-label">Фильтр по сфере</label>
            <select
              className="form-input"
              value={selectedSphere}
              onChange={(e) => setSelectedSphere(e.target.value)}
            >
              <option value="all">Все сферы</option>
              {spheres.map(sphere => (
                <option key={sphere.key} value={sphere.key}>{sphere.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div style={{ marginTop: '24px' }}>
          <Button type="primary" onClick={handleAdd}>
            Добавить вопрос
          </Button>
        </div>
        
        <div style={{ marginTop: '24px' }}>
          {filteredQuestions.length === 0 ? (
            <p>Вопросы не найдены</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredQuestions.map(question => (
                <div
                  key={question.id}
                  style={{
                    padding: '16px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    backgroundColor: question.is_active === false ? '#f5f5f5' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div>
                      <strong style={{ color: '#1890ff' }}>
                        {spheres.find(s => s.key === question.sphere)?.name || question.sphere}
                      </strong>
                      {question.is_active === false && (
                        <span style={{ marginLeft: '8px', color: '#999', fontSize: '12px' }}>
                          (неактивен)
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(question)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          border: '1px solid #1890ff',
                          backgroundColor: 'white',
                          color: '#1890ff',
                          borderRadius: '2px',
                          cursor: 'pointer'
                        }}
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(question.id)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          border: '1px solid #ff4d4f',
                          backgroundColor: 'white',
                          color: '#ff4d4f',
                          borderRadius: '2px',
                          cursor: 'pointer'
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{question.text}</p>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                    Тип: {question.type === 'short_answer' ? 'Краткий ответ' : 'Текст'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button onClick={() => navigate('/settings')} type="secondary">
          Назад
        </Button>
      </div>
    </div>
  )
}

export default QuestionDatabase


import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import '../styles/main.css'
import '../styles/components.css'

const SphereManagement = () => {
  const navigate = useNavigate()
  const [spheres, setSpheres] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSphere, setEditingSphere] = useState(null)
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    color: '#52c41a'
  })

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/settings'))
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
      alert('Не удалось загрузить сферы: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setFormData({
      key: '',
      name: '',
      color: '#52c41a'
    })
    setEditingSphere(null)
    setShowAddForm(true)
  }

  const handleEdit = (sphere) => {
    setFormData({
      key: sphere.key,
      name: sphere.name,
      color: sphere.color
    })
    setEditingSphere(sphere)
    setShowAddForm(true)
  }

  const handleDelete = async (sphereId) => {
    if (!confirm('Вы уверены, что хотите удалить эту сферу? Это может повлиять на данные пользователей.')) {
      return
    }
    
    try {
      await api.deleteSphere(sphereId)
      await loadSpheres()
      alert('Сфера удалена')
    } catch (error) {
      alert('Ошибка при удалении сферы: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Валидация ключа (только латинские буквы, цифры и подчеркивания)
    if (!/^[a-z0-9_]+$/.test(formData.key)) {
      alert('Ключ может содержать только строчные латинские буквы, цифры и подчеркивания')
      return
    }
    
    // Валидация цвета (hex формат)
    if (!/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      alert('Цвет должен быть в формате HEX (#RRGGBB)')
      return
    }
    
    try {
      if (editingSphere) {
        await api.updateSphere(editingSphere.id, {
          name: formData.name,
          color: formData.color
        })
        alert('Сфера обновлена')
      } else {
        await api.createSphere(formData)
        alert('Сфера добавлена')
      }
      setShowAddForm(false)
      setEditingSphere(null)
      await loadSpheres()
    } catch (error) {
      alert('Ошибка при сохранении сферы: ' + error.message)
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

  if (showAddForm) {
    return (
      <div className="container">
        <div className="content">
          <h2 className="text-title">
            {editingSphere ? 'Редактировать сферу' : 'Добавить сферу'}
          </h2>
          
          <form onSubmit={handleSubmit} style={{ marginTop: '36px' }}>
            <div className="form-group">
              <label className="form-label">Ключ сферы</label>
              <input
                type="text"
                className="form-input"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase() })}
                placeholder="health, relationships, money..."
                disabled={!!editingSphere}
                required
                pattern="[a-z0-9_]+"
                title="Только строчные латинские буквы, цифры и подчеркивания"
              />
              {editingSphere && (
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  Ключ нельзя изменить после создания
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Название</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Здоровье, Отношения..."
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Цвет (HEX)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{ width: '60px', height: '40px', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#52c41a"
                  pattern="#[0-9A-Fa-f]{6}"
                  style={{ flex: 1 }}
                  required
                />
              </div>
            </div>
            
            <div className="btn-group" style={{ marginTop: '24px' }}>
              <Button type="primary" onClick={handleSubmit}>
                Сохранить
              </Button>
              <Button type="secondary" onClick={() => {
                setShowAddForm(false)
                setEditingSphere(null)
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
        <h2 className="text-title">Управление сферами</h2>
        
        <div style={{ marginTop: '24px' }}>
          <Button type="primary" onClick={handleAdd}>
            Добавить сферу
          </Button>
        </div>
        
        <div style={{ marginTop: '24px' }}>
          {spheres.length === 0 ? (
            <p>Сферы не найдены</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {spheres.map(sphere => (
                <div
                  key={sphere.id}
                  style={{
                    padding: '16px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    backgroundColor: 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          backgroundColor: sphere.color,
                          border: '1px solid #d9d9d9'
                        }}
                      />
                      <div>
                        <strong style={{ color: '#1890ff', fontSize: '16px' }}>
                          {sphere.name}
                        </strong>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                          Ключ: <code>{sphere.key}</code>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(sphere)}
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
                        onClick={() => handleDelete(sphere.id)}
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
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                    Цвет: <code>{sphere.color}</code>
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

export default SphereManagement


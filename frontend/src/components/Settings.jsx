import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp, setBackButton, hideBackButton } from '../services/telegram'
import { api } from '../services/api'
import { applyTheme } from '../utils/theme'
import '../styles/main.css'
import '../styles/components.css'

const Settings = () => {
  const navigate = useNavigate()
  const [settings, setSettings] = useState({ 
    notification_time: '', 
    language: 'ru', 
    is_paused: false,
    weekly_report_frequency: 'weekly',
    reminder_frequency: 'weekly',
    dark_theme: false,
    admin_test_notifications: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    initTelegramWebApp()
    setBackButton(() => navigate('/menu'))
    loadSettings()
    checkAdmin()
    
    return () => {
      hideBackButton()
    }
  }, [navigate])
  
  const checkAdmin = async () => {
    try {
      const data = await api.checkIsAdmin()
      setIsAdmin(data.is_admin || false)
    } catch (error) {
      console.error('Ошибка проверки админа:', error)
      setIsAdmin(false)
    }
  }

  const loadSettings = async () => {
    try {
      const data = await api.getSettings()
      const darkTheme = data.dark_theme || false
      setSettings({
        notification_time: data.notification_time || '',
        language: data.language || 'ru',
        is_paused: data.is_paused || false,
        weekly_report_frequency: data.weekly_report_frequency || 'weekly',
        reminder_frequency: data.reminder_frequency || 'weekly',
        dark_theme: darkTheme,
        admin_test_notifications: data.admin_test_notifications || false
      })
      // Применяем тему при загрузке
      applyTheme(darkTheme)
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateSettings(settings)
      // Применяем тему сразу после сохранения
      applyTheme(settings.dark_theme)
      alert('Настройки сохранены')
    } catch (error) {
      alert('Ошибка при сохранении настроек: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleThemeToggle = (checked) => {
    const newSettings = { ...settings, dark_theme: checked }
    setSettings(newSettings)
    // Применяем тему сразу при переключении
    applyTheme(checked)
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
        <h2 className="text-title">Настройки</h2>
        
        <div style={{ marginTop: '36px' }}>
          <div className="form-group">
            <label className="form-label">Время уведомлений</label>
            <input 
              type="time"
              className="form-input" 
              value={settings.notification_time || ''}
              onChange={(e) => setSettings({ ...settings, notification_time: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Частота недельных отчётов</label>
            <select 
              className="form-input"
              value={settings.weekly_report_frequency}
              onChange={(e) => setSettings({ ...settings, weekly_report_frequency: e.target.value })}
            >
              <option value="weekly">Раз в неделю</option>
              <option value="biweekly">Раз в две недели</option>
              <option value="monthly">Раз в месяц</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Частота напоминаний</label>
            <select 
              className="form-input"
              value={settings.reminder_frequency}
              onChange={(e) => setSettings({ ...settings, reminder_frequency: e.target.value })}
            >
              <option value="daily">Ежедневно</option>
              <option value="weekly">Раз в неделю</option>
              <option value="biweekly">Раз в две недели</option>
            </select>
          </div>
          
          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <label className="form-label" style={{ margin: 0 }}>Тёмная тема</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.dark_theme}
                onChange={(e) => handleThemeToggle(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          {isAdmin && (
            <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Тестовые уведомления (каждую минуту)
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  Для тестирования системы уведомлений
                </div>
              </label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.admin_test_notifications}
                  onChange={(e) => setSettings({ ...settings, admin_test_notifications: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          )}
          
          <div 
            className="form-group" 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px 0',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/change-spheres')}
          >
            <label className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Изменить сферу</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🎯</span>
              <span style={{ color: '#999' }}>›</span>
            </div>
          </div>
          
          <div 
            className="form-group" 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px 0',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/edit-sphere-rating')}
          >
            <label className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Изменить оценку сфер</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>⭐</span>
              <span style={{ color: '#999' }}>›</span>
            </div>
          </div>
        </div>
        
        {isAdmin && (
          <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid #d9d9d9' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Админ-панель</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button 
                onClick={() => navigate('/questions-database')} 
                type="primary"
              >
                База вопросов
              </Button>
              <Button 
                onClick={() => navigate('/sphere-management')} 
                type="primary"
              >
                Управление сферами
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button onClick={handleSave} type="primary" disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
        <Button onClick={() => navigate('/menu')} type="secondary">
          Назад
        </Button>
      </div>
    </div>
  )
}

export default Settings


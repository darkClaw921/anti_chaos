import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { initTelegramWebApp } from '../services/telegram'
import { api } from '../services/api'
import '../styles/main.css'

const WelcomeScreen = () => {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    setMounted(true)
    initTelegramWebApp()
    checkOnboarding()
  }, [])

  const checkOnboarding = async () => {
    try {
      const status = await api.checkOnboardingStatus()
      if (status.onboarding_completed) {
        // Если онбординг завершен, редиректим на экран вопроса дня
        navigate('/daily')
        return
      }
    } catch (error) {
      console.error('Ошибка проверки статуса онбординга:', error)
      // В случае ошибки продолжаем показывать экран приветствия
    } finally {
      setChecking(false)
    }
  }
  
  if (!mounted || checking) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Загрузка...</p>
      </div>
    )
  }

  const handleStart = () => {
    navigate('/format')
  }

  const handleAbout = () => {
    // Можно добавить модальное окно или отдельный экран
    alert('АнтиChaos — бот, который приносит ясность через 1 вопрос в день')
  }

  return (
    <div className="container">
      <div className="content">
        <div className="text-center">
          <h1 className="text-title" style={{ marginBottom: 0 }}>
            Привет!
          </h1>
          <p style={{ marginTop: '36px', whiteSpace: 'pre-wrap' }}>
            Я АнтиChaos — бот, который приносит ясность через 1 вопрос в день
          </p>
        </div>
      </div>
      
      <div className="btn-group" style={{ marginTop: 'auto' }}>
        <Button onClick={handleStart} type="primary">
          Начать
        </Button>
        <Button onClick={handleAbout} type="secondary">
          О боте
        </Button>
      </div>
    </div>
  )
}

export default WelcomeScreen


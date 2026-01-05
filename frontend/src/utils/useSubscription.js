import { useState, useEffect } from 'react'
import { api } from '../services/api'

/**
 * Хук для проверки подписки пользователя
 * @returns {Object} { subscription, isLoading, hasPaidPlan }
 * - subscription: объект подписки { plan, is_active, expires_at }
 * - isLoading: флаг загрузки
 * - hasPaidPlan: true если план не 'free' и подписка активна
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      setIsLoading(true)
      const data = await api.getSubscription()
      setSubscription(data)
    } catch (error) {
      console.error('Ошибка загрузки подписки:', error)
      // В случае ошибки считаем, что подписка free
      setSubscription({ plan: 'free', is_active: false })
    } finally {
      setIsLoading(false)
    }
  }

  // Проверяем, есть ли платная подписка (не free и активна)
  const hasPaidPlan = subscription && 
    subscription.plan !== 'free' && 
    subscription.is_active === true

  return {
    subscription,
    isLoading,
    hasPaidPlan,
    refreshSubscription: loadSubscription
  }
}

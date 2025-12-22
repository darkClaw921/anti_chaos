/**
 * Утилиты для управления темной темой
 */

import { api } from '../services/api'

const THEME_STORAGE_KEY = 'dark_theme_enabled'

export const applyTheme = (isDark) => {
  const root = document.documentElement
  const body = document.body
  const rootElement = document.getElementById('root')
  
  if (isDark) {
    root.classList.add('dark-theme')
    body.classList.add('dark-theme')
    if (rootElement) {
      rootElement.classList.add('dark-theme')
    }
    localStorage.setItem(THEME_STORAGE_KEY, 'true')
  } else {
    root.classList.remove('dark-theme')
    body.classList.remove('dark-theme')
    if (rootElement) {
      rootElement.classList.remove('dark-theme')
    }
    localStorage.setItem(THEME_STORAGE_KEY, 'false')
  }
}

export const loadTheme = () => {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  if (saved === 'true') {
    applyTheme(true)
    return true
  }
  applyTheme(false)
  return false
}

export const initTheme = async () => {
  // Сначала загружаем из localStorage
  const savedTheme = loadTheme()
  
  // Затем проверяем настройки пользователя с сервера
  try {
    const settings = await api.getSettings()
    
    // Проверяем, что settings является объектом
    if (settings && typeof settings === 'object' && settings.dark_theme !== undefined && settings.dark_theme !== null) {
      // Преобразуем в булево значение, если пришло как строка
      const isDark = typeof settings.dark_theme === 'boolean' 
        ? settings.dark_theme 
        : settings.dark_theme === 'true' || settings.dark_theme === true
      applyTheme(isDark)
    }
  } catch (error) {
    // Игнорируем ошибки авторизации и другие ошибки - используем тему из localStorage
    // Не логируем ошибку, если это ошибка авторизации (пользователь еще не авторизован)
    if (error.message && !error.message.includes('401') && !error.message.includes('403')) {
      console.error('Ошибка загрузки темы из настроек:', error)
    }
    // Используем сохраненную тему из localStorage
  }
}


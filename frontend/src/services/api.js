/**
 * HTTP клиент для работы с backend API
 */

// Определяем базовый URL API
// В production: используем относительный путь (если пусто) или указанный URL
// В development: используем прокси (/api) или указанный URL
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  const useProxy = import.meta.env.VITE_USE_PROXY === 'true'
  
  // Проверяем, находимся ли мы в production окружении (по протоколу и домену)
  const isProduction = window.location.protocol === 'https:' || 
                       (!window.location.hostname.includes('localhost') &&
                        !window.location.hostname.includes('127.0.0.1'))
  
  // В production всегда используем относительный путь, если не указан явный HTTPS URL
  if (isProduction) {
    // Если указан явный HTTPS URL, используем его
    if (envUrl && envUrl.startsWith('https://')) {
      return envUrl
    }
    // Иначе используем относительный путь
    return ''
  }
  
  // В development: если используется прокси, используем относительный путь
  if (useProxy) {
    return ''
  }
  
  // Если URL пустой или начинается с /, используем относительный путь
  if (!envUrl || envUrl.startsWith('/')) {
    return ''
  }
  
  // Иначе используем указанный URL или дефолт для development
  return envUrl || 'http://localhost:8000'
}

const API_URL = getApiUrl()

// Вспомогательная функция для формирования URL с правильной обработкой пустого API_URL
const buildApiUrl = (path) => {
  // Убираем начальный слэш из path, если он есть
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  if (!API_URL) {
    // Если API_URL пустой, используем относительный путь
    return `/${cleanPath}`
  }
  
  // Убираем завершающий слэш из API_URL, если он есть
  const cleanApiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
  
  return `${cleanApiUrl}/${cleanPath}`
}

// Управление guest user ID в localStorage
const getGuestUserId = () => {
  const stored = localStorage.getItem('guest_user_id')
  if (stored) {
    return parseInt(stored, 10)
  }
  return null
}

const setGuestUserId = (userId) => {
  localStorage.setItem('guest_user_id', userId.toString())
}

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  }
  
  // Получаем initData из Telegram Web App
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
    headers['X-Telegram-Init-Data'] = window.Telegram.WebApp.initData
  } else {
    // Если нет Telegram, используем guest user ID
    const guestUserId = getGuestUserId()
    if (guestUserId) {
      headers['X-Guest-User-Id'] = guestUserId.toString()
    }
  }
  
  return headers
}

// Сохраняем user ID после первого запроса для guest режима
const saveGuestUserId = (user) => {
  if (user && user.id && !window.Telegram?.WebApp?.initData) {
    setGuestUserId(user.id)
  }
}

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`
    const contentType = response.headers.get('content-type')
    
    try {
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json()
        errorMessage = error.detail || error.message || errorMessage
      } else {
        // Если не JSON, читаем как текст
        const text = await response.text()
        if (text) {
          errorMessage = text.substring(0, 200) // Ограничиваем длину
        }
      }
    } catch (e) {
      // Если не удалось прочитать ответ, используем статус
      console.error('[API] Error parsing error response:', e, { status: response.status, url: response.url })
    }
    throw new Error(errorMessage)
  }
  
  // Проверяем Content-Type перед парсингом JSON
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text()
    console.error('[API] Response is not JSON:', { contentType, text: text.substring(0, 200), url: response.url })
    throw new Error(`Ожидался JSON, но получен ${contentType || 'неизвестный тип'}`)
  }
  
  try {
    return await response.json()
  } catch (error) {
    console.error('[API] JSON parse error:', error, { url: response.url, status: response.status })
    throw new Error(`Ошибка парсинга JSON: ${error.message}`)
  }
}

export const api = {
  // Users
  getCurrentUser: async () => {
    const response = await fetch(buildApiUrl('api/users/me'), {
      headers: getHeaders()
    })
    const user = await handleResponse(response)
    saveGuestUserId(user)
    return user
  },
  
  checkOnboardingStatus: async () => {
    const response = await fetch(buildApiUrl('api/users/onboarding-status'), {
      headers: getHeaders()
    })
    return handleResponse(response)
  },
  
  updateProfile: async (profileData) => {
    const response = await fetch(buildApiUrl('api/users/me/profile'), {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    })
    return handleResponse(response)
  },
  
  exportUserData: async () => {
    const response = await fetch(buildApiUrl('api/users/me/export'), {
      headers: getHeaders()
    })
    return handleResponse(response)
  },
  
  deleteAccount: async () => {
    const response = await fetch(buildApiUrl('api/users/me'), {
      method: 'DELETE',
      headers: getHeaders()
    })
    return handleResponse(response)
  },
  
  // Questions
  getDailyQuestion: async () => {
    const response = await fetch(buildApiUrl('api/questions/daily'), {
      headers: getHeaders()
    })
    return handleResponse(response)
  },
  
  getSimpleQuestion: async () => {
    const response = await fetch(buildApiUrl('api/questions/simple'), {
      headers: getHeaders()
    })
    return handleResponse(response)
  },
  
  getQuestion: async (questionId) => {
    const response = await fetch(buildApiUrl(`api/questions/${questionId}`), {
      headers: getHeaders()
    })
    return handleResponse(response)
  },
  
  // Answers
  createAnswer: async (questionId, answer) => {
    const response = await fetch(buildApiUrl('api/answers/'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ question_id: questionId, answer })
    })
    return handleResponse(response)
  },
  
  getAnswers: async (days = null) => {
    const url = days 
      ? buildApiUrl(`api/answers/?days=${days}`)
      : buildApiUrl('api/answers/')
    const response = await fetch(url, {
      headers: getHeaders()
    })
    return handleResponse(response)
  },
  
  // Spheres
  createSphereRatings: async (ratings) => {
    try {
      const url = buildApiUrl('api/spheres/ratings')
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ratings })
      })
      return handleResponse(response)
    } catch (error) {
      // Обработка сетевых ошибок (CORS, таймаут, недоступность сервера)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Не удалось подключиться к серверу. Проверьте, что backend запущен на ${API_URL || 'текущем домене'}`)
      }
      throw error
    }
  },
  
  getSphereRatings: async () => {
    try {
      const url = buildApiUrl('api/spheres/ratings')
      const response = await fetch(url, {
        headers: getHeaders()
      })
      if (!response.ok) {
        console.error(`[API] getSphereRatings failed: ${response.status} ${response.statusText}`, { url, responseUrl: response.url })
      }
      return handleResponse(response)
    } catch (error) {
      console.error('[API] getSphereRatings error:', error, { 
        url: buildApiUrl('api/spheres/ratings'), 
        API_URL,
        errorName: error.name,
        errorMessage: error.message
      })
      // Обработка сетевых ошибок (CORS, таймаут, недоступность сервера)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Не удалось подключиться к серверу. Проверьте, что backend запущен на ${API_URL || 'текущем домене'}`)
      }
      throw error
    }
  },
  
  updateFocusSpheres: async (spheres) => {
    const response = await fetch(buildApiUrl('api/spheres/focus'), {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ spheres })
    })
    return handleResponse(response)
  },
  
  getFocusSpheres: async () => {
    const response = await fetch(buildApiUrl('api/spheres/focus'), {
      headers: getHeaders()
    })
    return handleResponse(response)
  },
  
  // Progress
  getProgress: async (days = 7) => {
    const response = await fetch(buildApiUrl(`api/progress/?days=${days}`), {
      headers: getHeaders()
    })
    return handleResponse(response)
  },
  
  getWeeklySummary: async () => {
    const response = await fetch(buildApiUrl('api/progress/weekly'), {
      headers: getHeaders()
    })
    return handleResponse(response)
  },
  
  getMonthlyReport: async () => {
    const response = await fetch(buildApiUrl('api/progress/monthly'), {
      headers: getHeaders()
    })
    return handleResponse(response)
  },
  
  // Settings
  getSettings: async () => {
    try {
      const url = buildApiUrl('api/settings/')
      const response = await fetch(url, {
        headers: getHeaders()
      })
      return handleResponse(response)
    } catch (error) {
      console.error('[API] getSettings error:', error, { url: buildApiUrl('api/settings/'), API_URL })
      throw error
    }
  },
  
  updateSettings: async (settings) => {
    const response = await fetch(buildApiUrl('api/settings/'), {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings)
    })
    return handleResponse(response)
  },
  
  // Admin
  checkIsAdmin: async () => {
    const response = await fetch(buildApiUrl('api/users/is-admin'), {
      headers: getHeaders()
    })
    return handleResponse(response)
  },
  
  // Admin Questions
  getAllQuestions: async (activeOnly = false) => {
    const url = buildApiUrl(`api/questions/admin/all?active_only=${activeOnly}`)
    const response = await fetch(url, {
      headers: getHeaders()
    })
    return handleResponse(response)
  },
  
  createQuestion: async (questionData) => {
    const response = await fetch(buildApiUrl('api/questions/admin/'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(questionData)
    })
    return handleResponse(response)
  },
  
  updateQuestion: async (questionId, questionData) => {
    const response = await fetch(buildApiUrl(`api/questions/admin/${questionId}`), {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(questionData)
    })
    return handleResponse(response)
  },
  
  deleteQuestion: async (questionId) => {
    const response = await fetch(buildApiUrl(`api/questions/admin/${questionId}`), {
      method: 'DELETE',
      headers: getHeaders()
    })
    return handleResponse(response)
  },
  
  // Admin Spheres
  getAllSpheres: async () => {
    const response = await fetch(buildApiUrl('api/spheres/admin/all'), {
      headers: getHeaders()
    })
    return handleResponse(response)
  },
  
  createSphere: async (sphereData) => {
    const response = await fetch(buildApiUrl('api/spheres/admin/'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(sphereData)
    })
    return handleResponse(response)
  },
  
  updateSphere: async (sphereId, sphereData) => {
    const response = await fetch(buildApiUrl(`api/spheres/admin/${sphereId}`), {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(sphereData)
    })
    return handleResponse(response)
  },
  
  deleteSphere: async (sphereId) => {
    const response = await fetch(buildApiUrl(`api/spheres/admin/${sphereId}`), {
      method: 'DELETE',
      headers: getHeaders()
    })
    return handleResponse(response)
  }
}


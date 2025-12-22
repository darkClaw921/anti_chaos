import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initTheme } from './utils/theme'
import './styles/main.css'

// Регистрация Chart.js один раз для всего приложения
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

// Инициализация Telegram Web App
if (window.Telegram && window.Telegram.WebApp) {
  try {
    window.Telegram.WebApp.ready()
    window.Telegram.WebApp.expand()
  } catch (error) {
    console.error('Telegram Web App initialization error:', error)
  }
}

// Инициализация темы
initTheme()

// Обработка ошибок React
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

const root = ReactDOM.createRoot(rootElement)

// Обработчик ошибок React
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} catch (error) {
  console.error('React render error:', error)
  root.render(
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>Ошибка загрузки приложения</h1>
      <p>{error.message}</p>
      <p style={{ fontSize: '12px', color: '#999', marginTop: '20px' }}>
        Проверьте консоль для подробностей
      </p>
      <pre style={{ textAlign: 'left', fontSize: '10px', overflow: 'auto' }}>
        {error.stack}
      </pre>
    </div>
  )
}


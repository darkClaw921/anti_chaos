import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения из корневого .env
  const env = loadEnv(mode, __dirname, '')
  
  const isProduction = mode === 'production'
  
  // Определяем API URL:
  // - В production: используем VITE_API_URL если указан, иначе относительный путь (пустая строка)
  // - В development: используем VITE_API_URL или BACKEND_URL или дефолт localhost:8000
  let apiUrl
  if (isProduction) {
    // В production по умолчанию используем относительный путь
    apiUrl = env.VITE_API_URL || ''
  } else {
    // В development используем указанный URL или localhost
    apiUrl = env.VITE_API_URL || env.BACKEND_URL || 'http://localhost:8100'
  }
  
  // Используем прокси только в development для localhost
  const useProxy = !isProduction && apiUrl.startsWith('http://localhost')
  
  const config = {
  plugins: [react()],
  root: resolve(__dirname, 'frontend'),
  publicDir: resolve(__dirname, 'frontend/public'),
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: [
      '12cujb-2605-e440-2--2-1d4.ru.tuna.am',
      '0447a403af29.ngrok-free.app',
      'anit-chaos.alteran-industries.store',
      'frontend.anti-chaos.orb.local',
      '.ngrok-free.app',
      '.ngrok.io',
      '.tuna.am',
      'localhost'
    ]
  },
  build: {
    outDir: resolve(__dirname, 'frontend/dist'),
    sourcemap: true,
    emptyOutDir: true
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      'import.meta.env.VITE_USE_PROXY': JSON.stringify(useProxy)
    }
  }
  
  // Настраиваем прокси для development
  if (useProxy) {
    config.server.proxy = {
      '/api': {
        target: apiUrl,
        changeOrigin: true,
        secure: false
      }
    }
  }
  
  return config
})


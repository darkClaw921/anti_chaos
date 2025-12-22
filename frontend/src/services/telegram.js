/**
 * Сервис для работы с Telegram Web App API
 */

let isInitialized = false

export const initTelegramWebApp = () => {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp
    
    // Готовим приложение только один раз
    if (!isInitialized) {
      tg.ready()
      tg.expand()
      isInitialized = true
    }
    
    return tg
  }
  return null
}

export const getTelegramUser = () => {
  const tg = initTelegramWebApp()
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    return tg.initDataUnsafe.user
  }
  return null
}

export const getInitData = () => {
  const tg = initTelegramWebApp()
  if (tg && tg.initData) {
    return tg.initData
  }
  return null
}

export const showTelegramAlert = (message) => {
  const tg = initTelegramWebApp()
  if (tg) {
    tg.showAlert(message)
  } else {
    alert(message)
  }
}

export const showTelegramConfirm = (message) => {
  const tg = initTelegramWebApp()
  if (tg) {
    return new Promise((resolve) => {
      tg.showConfirm(message, (confirmed) => {
        resolve(confirmed)
      })
    })
  } else {
    return Promise.resolve(confirm(message))
  }
}

export const setMainButton = (text, onClick) => {
  const tg = initTelegramWebApp()
  if (tg && tg.MainButton) {
    tg.MainButton.setText(text)
    tg.MainButton.onClick(onClick)
    tg.MainButton.show()
  }
}

export const hideMainButton = () => {
  const tg = initTelegramWebApp()
  if (tg && tg.MainButton) {
    tg.MainButton.hide()
  }
}

// Проверка поддержки BackButton (доступен с версии 6.1+)
const isBackButtonSupported = () => {
  const tg = initTelegramWebApp()
  if (!tg || !tg.version) {
    return false
  }
  // BackButton доступен с версии 6.1+
  const version = tg.version.split('.').map(Number)
  return version[0] > 6 || (version[0] === 6 && version[1] >= 1)
}

export const setBackButton = (onClick) => {
  const tg = initTelegramWebApp()
  if (tg && tg.BackButton && isBackButtonSupported()) {
    tg.BackButton.onClick(onClick)
    tg.BackButton.show()
  }
}

export const hideBackButton = () => {
  const tg = initTelegramWebApp()
  if (tg && tg.BackButton && isBackButtonSupported()) {
    tg.BackButton.hide()
  }
}


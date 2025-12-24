import { useState, useEffect } from 'react'

/**
 * Хук для отслеживания текущей темы
 */
export const useTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    return document.body.classList.contains('dark-theme')
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark-theme'))
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  return isDark
}




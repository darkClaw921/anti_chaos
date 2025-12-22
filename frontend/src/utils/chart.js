/**
 * Утилиты для работы с графиками паутинки
 */

import { SPHERES, SPHERE_KEYS, SPHERE_COLORS } from './constants'

export const prepareSpiderChartData = (ratings, spheres = null) => {
  // Если передан список сфер из API, используем его, иначе используем константы
  const sphereKeys = spheres ? spheres.map(s => s.key) : SPHERE_KEYS
  const sphereNames = spheres ? spheres.reduce((acc, s) => {
    acc[s.key] = s.name
    return acc
  }, {}) : SPHERES
  
  const labels = sphereKeys.map(key => sphereNames[key] || key)
  const data = sphereKeys.map(key => {
    const value = ratings[key]
    console.log(`Сфера ${key} (${sphereNames[key] || key}): rating = ${value}`)
    return value !== undefined && value !== null ? value : 0
  })
  
  console.log('Chart data:', { labels, data, ratings })
  
  return {
    labels,
    datasets: [{
      label: 'Оценка',
      data,
      backgroundColor: 'rgba(24, 144, 255, 0.2)',
      borderColor: '#1890ff',
      borderWidth: 2,
      pointBackgroundColor: '#1890ff',
      pointBorderColor: '#ffffff',
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: '#1890ff',
    }]
  }
}

export const getSpiderChartOptions = (isDarkTheme = false) => {
  const textColor = isDarkTheme ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
  const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0'
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 10,
        min: 0,
        ticks: {
          stepSize: 2,
          font: {
            size: 12
          },
          color: textColor,
          backdropColor: isDarkTheme ? '#141414' : '#ffffff'
        },
        pointLabels: {
          font: {
            size: 14,
            family: "'Roboto', sans-serif"
          },
          color: textColor
        },
        grid: {
          color: gridColor
        },
        angleLines: {
          color: gridColor
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  }
}


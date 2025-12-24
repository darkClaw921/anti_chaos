/**
 * Утилиты для работы с графиками паутинки
 */

import { SPHERES, SPHERE_KEYS, SPHERE_COLORS } from './constants'

export const prepareSpiderChartData = (ratings, spheres = null) => {
  // Если передан список сфер из API, используем его, иначе используем константы
  const allSphereKeys = spheres ? spheres.map(s => s.key) : SPHERE_KEYS
  const sphereNames = spheres ? spheres.reduce((acc, s) => {
    acc[s.key] = s.name
    return acc
  }, {}) : SPHERES
  
  // Фильтруем сферы: исключаем платные сферы без оценок
  const sphereKeys = allSphereKeys.filter(key => {
    const sphereName = sphereNames[key] || key
    const isPaid = sphereName.includes('(платно)')
    const hasRating = ratings[key] !== undefined && ratings[key] !== null
    
    // Если это платная сфера и нет оценки, исключаем её
    if (isPaid && !hasRating) {
      return false
    }
    
    return true
  })
  
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

export const prepareSpiderChartDataComparison = (initialRatings, currentRatings, spheres = null) => {
  // Если передан список сфер из API, используем его, иначе используем константы
  const allSphereKeys = spheres ? spheres.map(s => s.key) : SPHERE_KEYS
  const sphereNames = spheres ? spheres.reduce((acc, s) => {
    acc[s.key] = s.name
    return acc
  }, {}) : SPHERES
  
  // Фильтруем сферы: исключаем платные сферы без оценок (проверяем оба набора оценок)
  const sphereKeys = allSphereKeys.filter(key => {
    const sphereName = sphereNames[key] || key
    const isPaid = sphereName.includes('(платно)')
    const hasInitialRating = initialRatings[key] !== undefined && initialRatings[key] !== null
    const hasCurrentRating = currentRatings[key] !== undefined && currentRatings[key] !== null
    
    // Если это платная сфера и нет оценок ни в начальных, ни в текущих, исключаем её
    if (isPaid && !hasInitialRating && !hasCurrentRating) {
      return false
    }
    
    return true
  })
  
  const labels = sphereKeys.map(key => sphereNames[key] || key)
  const initialData = sphereKeys.map(key => {
    const value = initialRatings[key]
    return value !== undefined && value !== null ? value : 0
  })
  const currentData = sphereKeys.map(key => {
    const value = currentRatings[key]
    return value !== undefined && value !== null ? value : 0
  })
  
  return {
    labels,
    datasets: [
      {
        label: 'Было',
        data: initialData,
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        borderColor: '#1890ff',
        borderWidth: 2,
        pointBackgroundColor: '#1890ff',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#1890ff',
      },
      {
        label: 'Стало',
        data: currentData,
        backgroundColor: 'rgba(82, 196, 26, 0.1)',
        borderColor: '#52c41a',
        borderWidth: 2,
        pointBackgroundColor: '#52c41a',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#52c41a',
      }
    ]
  }
}

export const getSpiderChartOptions = (isDarkTheme = false, showLegend = false) => {
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
        display: showLegend,
        position: 'bottom',
        labels: {
          usePointStyle: false,
          padding: 20,
          font: {
            size: 14
          },
          color: textColor,
          boxWidth: 0,
          boxHeight: 0,
          generateLabels: function(chart) {
            const datasets = chart.data.datasets
            return datasets.map((dataset, i) => ({
              text: dataset.label,
              fillStyle: 'transparent',
              strokeStyle: dataset.borderColor,
              lineWidth: 2,
              hidden: false,
              index: i,
              fontColor: textColor
            }))
          }
        }
      }
    }
  }
}


/**
 * Константы приложения
 */

export const SPHERES = {
  health: 'Здоровье',
  relationships: 'Отношения',
  money: 'Деньги',
  energy: 'Энергия',
  career: 'Карьера',
  other: 'Другое'
}

export const SPHERE_KEYS = Object.keys(SPHERES)

export const SPHERE_COLORS = {
  health: '#52c41a',
  relationships: '#1890ff',
  money: '#faad14',
  energy: '#fa8c16',
  career: '#722ed1',
  other: '#eb2f96'
}

export const RATING_SCALE = Array.from({ length: 10 }, (_, i) => i + 1)


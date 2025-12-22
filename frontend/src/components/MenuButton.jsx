import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/components.css'

const MenuButton = () => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/menu')
  }

  return (
    <button
      className="menu-button"
      onClick={handleClick}
      aria-label="Открыть меню"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  )
}

export default MenuButton


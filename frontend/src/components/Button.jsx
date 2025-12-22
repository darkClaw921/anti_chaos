import React from 'react'
import './Button.css'

const Button = ({ 
  children, 
  onClick, 
  type = 'primary', 
  disabled = false,
  className = '' 
}) => {
  const buttonClass = `btn btn-${type} ${className}`.trim()
  
  return (
    <button 
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default Button


import React from 'react'
import { Outlet } from 'react-router-dom'
import MenuButton from './MenuButton'

const Layout = () => {
  return (
    <>
      <MenuButton />
      <Outlet />
    </>
  )
}

export default Layout


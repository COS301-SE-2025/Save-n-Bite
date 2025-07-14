import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import HelpMenu from '../help/HelpMenu'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} />
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      {/* Help Menu Component */}
      <HelpMenu />
    </div>
  )
}

export default Layout

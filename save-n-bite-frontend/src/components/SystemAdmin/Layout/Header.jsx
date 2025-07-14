import React from 'react'
import { MenuIcon, BellIcon, UserIcon } from 'lucide-react'

const Header = ({ toggleSidebar }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            aria-label="Toggle sidebar"
          >
            <MenuIcon size={20} />
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <button
            className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none relative"
            aria-label="Notifications"
          >
            <BellIcon size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <UserIcon size={16} />
            </div>
            <span className="hidden md:block font-medium text-gray-700">
              Admin User
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

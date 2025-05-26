import React from 'react'
import PropTypes from 'prop-types'
import {
  LayoutDashboardIcon,
  PlusCircleIcon,
  ListIcon,
  PackageIcon,
  ShoppingCartIcon,
  SettingsIcon,
} from 'lucide-react'

const navigationItems = [
  {
    name: 'Dashboard',
    icon: LayoutDashboardIcon,
    route: 'dashboard',
  },
  {
    name: 'Create Listing',
    icon: PlusCircleIcon,
    route: 'create-listing',
  },
  {
    name: 'My Listings',
    icon: ListIcon,
    route: 'my-listings',
  },
  {
    name: 'Pickups',
    icon: PackageIcon,
    route: 'pickups',
  },
  {
    name: 'Orders/Feedback',
    icon: ShoppingCartIcon,
    route: 'orders',
  },
  {
    name: 'Settings',
    icon: SettingsIcon,
    route: 'settings',
  },
]

const sideBar = ({ onNavigate, currentPage }) => {
  return (
    <div className="w-64 bg-blue-900 text-white flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <h1 className="text-xl font-bold">Save n Bite</h1>
        <p className="text-blue-200 text-sm mt-1">Provider Portal</p>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.route
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

sideBar.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  currentPage: PropTypes.string.isRequired,
}

export default sideBar

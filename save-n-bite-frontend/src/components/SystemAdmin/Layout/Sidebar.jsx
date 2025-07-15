import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboardIcon,
  UsersIcon,
  ClipboardCheckIcon,
  ListIcon,
  CreditCardIcon,
  BellIcon,
  BarChartIcon,
  ClipboardListIcon,
  AlertTriangleIcon,
  SettingsIcon,
  LogOutIcon,
  MessageSquareIcon,
} from 'lucide-react'

// Mock data for pending verification requests
const pendingVerifications = 5

const Sidebar = ({ isOpen }) => {
  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col h-screen fixed`}
    >
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        {isOpen ? (
          <h1 className="text-xl font-bold text-green-600">Save 'n Bite</h1>
        ) : (
          <h1 className="text-xl font-bold text-green-600">S'nB</h1>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          <NavItem
            to="/admin-dashboard"
            icon={<LayoutDashboardIcon size={20} />}
            label="Dashboard"
            isOpen={isOpen}
          />
          <NavItem
            to="/users"
            icon={<UsersIcon size={20} />}
            label="Users"
            isOpen={isOpen}
          />
          <NavItem
            to="/verifications"
            icon={<ClipboardCheckIcon size={20} />}
            label="Verifications"
            isOpen={isOpen}
            badge={pendingVerifications}
          />
          <NavItem
            to="/listings"
            icon={<ListIcon size={20} />}
            label="Listings"
            isOpen={isOpen}
          />
          <NavItem
            to="/admin-reviews"
            icon={<MessageSquareIcon size={20} />}
            label="Review Moderation"
            isOpen={isOpen}
          />
          <NavItem
            to="/transactions"
            icon={<CreditCardIcon size={20} />}
            label="Transactions"
            isOpen={isOpen}
          />
          <NavItem
            to="/admin-notifications"
            icon={<BellIcon size={20} />}
            label="Notifications"
            isOpen={isOpen}
          />
          <NavItem
            to="/admin-analytics"
            icon={<BarChartIcon size={20} />}
            label="Analytics"
            isOpen={isOpen}
          />
          <NavItem
            to="/audit-logs"
            icon={<ClipboardListIcon size={20} />}
            label="Audit Logs"
            isOpen={isOpen}
          />
          <NavItem
            to="/system-logs"
            icon={<AlertTriangleIcon size={20} />}
            label="System Logs"
            isOpen={isOpen}
          />
          <NavItem
            to="/settings"
            icon={<SettingsIcon size={20} />}
            label="Settings"
            isOpen={isOpen}
          />
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button
          className={`flex items-center ${
            isOpen ? 'justify-start' : 'justify-center'
          } w-full px-4 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50`}
        >
          <LogOutIcon size={20} />
          {isOpen && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </aside>
  )
}

const NavItem = ({ to, icon, label, isOpen, badge }) => {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center ${
            isOpen ? 'justify-start' : 'justify-center'
          } px-4 py-3 text-sm font-medium rounded-md relative ${
            isActive
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-100'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={`${
                isActive ? 'text-blue-600' : 'text-gray-500'
              } relative`}
            >
              {icon}
              {badge && badge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {badge}
                </span>
              )}
            </span>
            {isOpen ? (
              <div className="ml-3 flex items-center">
                <span>{label}</span>
                {badge && badge > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    {badge}
                  </span>
                )}
              </div>
            ) : (
              <div className="group">
                {/* Tooltip that appears on hover when sidebar is collapsed */}
                <div className="fixed left-20 ml-1 scale-0 rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100 z-20 whitespace-nowrap">
                  {label}
                  {badge && badge > 0 && (
                    <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
                      {badge}
                    </span>
                  )}
                  <div className="absolute left-0 top-1/2 -ml-2 -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                </div>
              </div>
            )}
          </>
        )}
      </NavLink>
    </li>
  )
}

export default Sidebar

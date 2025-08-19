import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
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
import logo from '../../../assets/images/SnB_leaf_icon.png'
import { Link } from 'react-router-dom'
import AdminAPI from '../../../services/AdminAPI'
import { apiClient } from '../../../services/FoodAPI.js'

const Sidebar = ({ isOpen }) => {
  // State for dynamic sidebar data
  const [sidebarData, setSidebarData] = useState({
    pendingVerifications: 0,
    openSystemLogs: 0,
    unreadAuditLogs: 0,        // Added for future audit log notifications
    unreadNotifications: 0,
    loading: true
  })
  
  const navigate = useNavigate()

  // Fetch sidebar data on component mount
  useEffect(() => {
    fetchSidebarData()
  }, [])

  const fetchSidebarData = async () => {
    try {
      // Ensure authentication is set up
      const token = localStorage.getItem('adminToken')
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      // Fetch dashboard data (contains verification counts)
      const dashboardResponse = await AdminAPI.getDashboard()
      
      if (dashboardResponse.success) {
        const dashboard = dashboardResponse.data.dashboard
        
        setSidebarData(prev => ({
          ...prev,
          pendingVerifications: dashboard?.verifications?.pending_total || 0,
          openSystemLogs: dashboard?.system_health?.open_issues || 0,
          unreadAuditLogs: 0, // Could be populated from dashboard if you add this data
          loading: false
        }))
      } else {
        // If dashboard fails, just show zeros but don't break the sidebar
        setSidebarData(prev => ({
          ...prev,
          loading: false
        }))
      }
    } catch (error) {
      console.error('Error fetching sidebar data:', error)
      // Don't break the sidebar if data fetch fails
      setSidebarData(prev => ({
        ...prev,
        loading: false
      }))
    }
  }

  const handleLogout = () => {
    // Clear admin session data
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    localStorage.removeItem('userEmail')
    
    // Clear API authorization header
    delete apiClient.defaults.headers.common['Authorization']
    
    // Redirect to admin login
    navigate('/login')
  }

  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col h-screen fixed`}
    >
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        {isOpen ? (
          <Link to="/admin-dashboard" className="flex items-baseline gap-2">
            <img src={logo} alt="Logo" className="w-15 h-9 self-center" />
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
              Save n Bite
            </span>
          </Link>
        ) : (
          <Link to="/admin-dashboard">
            <img src={logo} alt="Logo" className="w-15 h-9 self-center" />
          </Link>
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
            badge={sidebarData.pendingVerifications > 0 ? sidebarData.pendingVerifications : null}
            loading={sidebarData.loading}
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
            badge={sidebarData.unreadAuditLogs > 0 ? sidebarData.unreadAuditLogs : null}
            loading={sidebarData.loading}
          />
          <NavItem
            to="/system-logs"
            icon={<AlertTriangleIcon size={20} />}
            label="System Logs"
            isOpen={isOpen}
            badge={sidebarData.openSystemLogs > 0 ? sidebarData.openSystemLogs : null}
            loading={sidebarData.loading}
          />
          <NavItem
            to="/admin-settings"
            icon={<SettingsIcon size={20} />}
            label="Settings"
            isOpen={isOpen}
          />
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`flex items-center ${
            isOpen ? 'justify-start' : 'justify-center'
          } w-full px-4 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors duration-200`}
        >
          <LogOutIcon size={20} />
          {isOpen && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </aside>
  )
}

const NavItem = ({ to, icon, label, isOpen, badge, loading }) => {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center ${
            isOpen ? 'justify-start' : 'justify-center'
          } px-4 py-3 text-sm font-medium rounded-md relative transition-colors duration-200 ${
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
              {/* Show badge only if we have a count > 0 and not loading */}
              {!loading && badge && badge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              {/* Show loading indicator only for items that should have badges */}
              {loading && (badge !== undefined && badge !== null) && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-300">
                  <div className="h-2 w-2 bg-gray-500 rounded-full animate-pulse"></div>
                </span>
              )}
            </span>
            {isOpen ? (
              <div className="ml-3 flex items-center">
                <span>{label}</span>
                {!loading && badge && badge > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                {loading && (badge !== undefined && badge !== null) && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    <div className="h-2 w-6 bg-gray-300 rounded animate-pulse"></div>
                  </span>
                )}
              </div>
            ) : (
              <div className="group">
                {/* Tooltip that appears on hover when sidebar is collapsed */}
                <div className="fixed left-20 ml-1 scale-0 rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100 z-20 whitespace-nowrap">
                  {label}
                  {!loading && badge && badge > 0 && (
                    <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
                      {badge > 99 ? '99+' : badge}
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
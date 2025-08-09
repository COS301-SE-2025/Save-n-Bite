import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  LayoutDashboardIcon,
  PlusCircleIcon,
  ListIcon,
  PackageIcon,
  ShoppingCartIcon,
  SettingsIcon,
  HeartHandshakeIcon ,
  HelpCircle as HelpIcon,

  User as ProfileIcon,

} from 'lucide-react'
import logo from '../../assets/images/SnB_leaf_icon.png';
import { useNavigate } from 'react-router-dom';
import { OnboardingProvider } from './OnboardingWalkthrough/OnboardingContext'
import { Onboarding } from './OnboardingWalkthrough/Onboarding'
import { HelpMenu } from './HelpMenu'



const navigationItems = [
  {
    name: 'Dashboard',
    icon: LayoutDashboardIcon,
    route: 'dashboard',
    path: '/dashboard' 
  },
  {
    name: 'Create Listing',
    icon: PlusCircleIcon,
    route: 'CreateListing',
    path: '/create-listing'
  },
  {
    name: 'My Listings',
    icon: ListIcon,
    route: 'ListingOverview',
    path: '/listings-overview'
  },
  {
    name: 'Pickups',
    icon: PackageIcon,
    route: 'pickup-coordination',
    path: '/pickup-coordination'
  },
  {
    name: 'Orders/Feedback',
    icon: ShoppingCartIcon,
    route: 'orders-and-feedback',
    path: '/orders-and-feedback'
  },
  {
  name: 'Manage Donations',
  icon: HeartHandshakeIcon, 
  route: 'donations',
  path: '/donations'
},


{
    name: 'Profile',
    icon: ProfileIcon, 
    route: 'foodprovider-profile',
    path: '/foodprovider-profile',
  },


  {
    name: 'Settings',
    icon: SettingsIcon,
    route: 'settings',
    path: '/settings'
  },
]

const SideBar = ({ currentPage, pendingCount }) => { 
  const navigate = useNavigate(); 
 
  SideBar.propTypes = {
  currentPage: PropTypes.string.isRequired,
  pendingCount: PropTypes.number,
}

const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path); 
    console.log(`Navigating to: ${path}`);
  };

  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const toggleHelp = () => {
    setIsHelpOpen(!isHelpOpen)
  }

  return (
    <OnboardingProvider>
      {/* Sidebar: use a slightly lighter/different dark shade than the page */}
      <div className="w-64 bg-blue-900 dark:bg-gray-800/90 text-white flex flex-col min-h-screen transition-colors duration-300 border-r border-blue-800 dark:border-gray-700">
        <div className="p-6 border-b border-blue-800 dark:border-gray-700 flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-12 h-8" />
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white dark:text-gray-100">Save n Bite</span>
            <span className="text-blue-200 dark:text-gray-400 text-sm">Provider Portal</span>
          </div>
        </div>
        <nav className="flex-1 p-4 flex flex-col justify-between h-[calc(100vh-104px)]">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.route}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                      currentPage === item.route
                        ? 'bg-blue-700 dark:bg-blue-900 text-white dark:text-gray-100'
                        : 'text-blue-200 dark:text-gray-400 hover:bg-blue-800 dark:hover:bg-blue-900 hover:text-white dark:hover:text-gray-100'
                    }`}
                    data-onboarding={`nav-${item.route.toLowerCase()}`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.name === 'Manage Donations' && pendingCount > 0 && (
                      <span className="ml-auto bg-green-500 dark:bg-green-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-4">
            <button
              onClick={toggleHelp}
              className="w-full flex items-center px-4 py-3 rounded-lg text-blue-200 dark:text-gray-400 hover:bg-blue-800 dark:hover:bg-blue-900 hover:text-white dark:hover:text-gray-100 transition-colors"
              aria-label="Help"
              data-onboarding="help-button"
            >
              <HelpIcon className="w-5 h-5 mr-3" />
              Help Center
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex justify-center items-center px-4 py-3 rounded-lg bg-red-600 dark:bg-red-700 text-white hover:bg-red-800 dark:hover:bg-red-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </nav>
      </div>
      {isHelpOpen && <HelpMenu onClose={() => setIsHelpOpen(false)} />}
      <Onboarding />
    </OnboardingProvider>
  )
}

SideBar.propTypes = {
  currentPage: PropTypes.string.isRequired,
}

export default SideBar
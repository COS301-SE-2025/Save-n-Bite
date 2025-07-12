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
    name: 'Settings',
    icon: SettingsIcon,
    route: 'settings',
    path: '/settings'
  },
]

const SideBar = ({ currentPage }) => { 
  const navigate = useNavigate(); 
 
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
      <div className="w-64 bg-blue-900 text-white flex flex-col min-h-screen">
        <div className="p-6 border-b border-blue-800 flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-12 h-8" />
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white">Save n Bite</span>
            <span className="text-blue-200 text-sm">Provider Portal</span>
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
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                    }`}
                    data-onboarding={`nav-${item.route.toLowerCase()}`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-4">
            <button
              onClick={toggleHelp}
              className="w-full flex items-center px-4 py-3 rounded-lg text-blue-200 hover:bg-blue-800 hover:text-white transition-colors"
              aria-label="Help"
              data-onboarding="help-button"
            >
              <HelpIcon className="w-5 h-5 mr-3" />
              Help Center
            </button>
            
            <button
          onClick={handleLogout}
          className="w-full flex justify-center items-center px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-800 transition-colors"
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
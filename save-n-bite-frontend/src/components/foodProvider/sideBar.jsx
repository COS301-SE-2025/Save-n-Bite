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
import logo from '../../assets/images/SnB_leaf_icon.png';
import { useNavigate } from 'react-router-dom';

const navigationItems = [
  {
    name: 'Dashboard',
    icon: LayoutDashboardIcon,
    route: 'dashboard',
    path: '/' 
  },
  {
    name: 'Create Listing',
    icon: PlusCircleIcon,
    route: 'CreateListing',
    path: '/createListing'
  },
  {
    name: 'My Listings',
    icon: ListIcon,
    route: 'ListingOverview',
    path: '/ListingOverview'
  },
  {
    name: 'Pickups',
    icon: PackageIcon,
    route: 'pickups',
    path: '/pickups'
  },
  {
    name: 'Orders/Feedback',
    icon: ShoppingCartIcon,
    route: 'orders',
    path: '/orders'
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

  const handleNavigation = (path) => {
    navigate(path); 
    console.log(`Navigating to: ${path}`);
  };

  return (
    <div className="w-64 bg-blue-900 text-white flex flex-col">
      <div className="p-6 border-b border-blue-800 flex items-center gap-3">
        <img 
          src={logo} 
          alt="Logo"
          className="w-12 h-8"  
        />
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-white">
            Save n Bite
          </span>
          <span className="text-blue-200 text-sm">Provider Portal</span>
        </div>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.route}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    currentPage === item.route
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

SideBar.propTypes = {
  currentPage: PropTypes.string.isRequired,
}

export default SideBar;
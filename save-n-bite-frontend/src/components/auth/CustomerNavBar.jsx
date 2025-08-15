import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MenuIcon,
  XIcon,
  HelpCircleIcon,
  LogOutIcon,
} from 'lucide-react';
import logo from '../../assets/images/SnB_leaf_icon.png';
import NotificationBell from './NotificationBell';
import HelpMenu from '../../components/auth/Help/HelpMenu';

const CustomerNavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Add this hook

  // Add this helper function to determine if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm py-3 sm:py-4 px-4 sm:px-6 md:px-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-8 h-8 sm:w-12 sm:h-9 self-center" />
          <span className="hidden sm:block text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-500">
            Save n Bite
          </span>
        </Link>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          {/* <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500 focus:outline-none"
          >
            {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button> */}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <Link
            to="/food-listing"
            className={`nav-link text-sm lg:text-base ${isActive('/food-listing')
                ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500'
              }`}
          >
            Browse Food
          </Link>
          <Link
            to="/providers"
            className={`nav-link text-sm lg:text-base ${isActive('/providers')
                ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500'
              }`}
          >
            Browse Food Providers
          </Link>
          <Link
            to="/cart"
            className={`nav-link text-sm lg:text-base ${isActive('/cart')
                ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500'
              }`}
          >
            My Cart
          </Link>
          <Link
            to="/orders"
            className={`nav-link text-sm lg:text-base ${isActive('/orders')
                ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500'
              }`}
          >
            Order History
          </Link>
          <Link
            to="/profile"
            className={`nav-link text-sm lg:text-base ${isActive('/profile')
                ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500'
              }`}
          >
            My Profile
          </Link>
          <Link
            to="/customer-settings"
            className={`nav-link text-sm lg:text-base ${isActive('/customer-settings')
                ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500'
              }`}
          >
            Settings
          </Link>

          <NotificationBell />

          <button
            onClick={() => setIsHelpOpen(true)}
            className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 touch-target"
            aria-label="Help"
          >
            <HelpCircleIcon size={20} className="sm:w-6 sm:h-6" />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm lg:text-base touch-target dark:hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Mobile Navigation Icons */}
        <div className="md:hidden flex items-center space-x-3">
          <NotificationBell />
          <button
            onClick={() => setIsHelpOpen(true)}
            className="text-gray-500 hover:text-emerald-600 focus:outline-none touch-target"
            aria-label="Help"
          >
            <HelpCircleIcon size={20} />
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-500 hover:text-emerald-600 focus:outline-none touch-target"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Links */}
      {isMenuOpen && (
        <div className="md:hidden mt-3 pb-4 px-4 border-t border-gray-200 bg-white dark:bg-gray-800">
          <div className="flex flex-col space-y-2 pt-4">
            <Link
              to="/food-listing"
              className={`mobile-nav-link ${isActive('/food-listing')
                  ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                  : 'dark:text-gray-300 dark:hover:text-emerald-500'
                }`}
            >
              Browse Food
            </Link>
            <Link
              to="/providers"
              className={`mobile-nav-link ${isActive('/providers')
                  ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                  : 'dark:text-gray-300 dark:hover:text-emerald-500'
                }`}
            >
              Browse Food Providers
            </Link>
            <Link
              to="/cart"
              className={`mobile-nav-link ${isActive('/cart')
                  ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                  : 'dark:text-gray-300 dark:hover:text-emerald-500'
                }`}
            >
              My Cart
            </Link>
            <Link
              to="/orders"
              className={`mobile-nav-link ${isActive('/orders')
                  ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                  : 'dark:text-gray-300 dark:hover:text-emerald-500'
                }`}
            >
              Order History
            </Link>
            <Link
              to="/profile"
              className={`mobile-nav-link ${isActive('/profile')
                  ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                  : 'dark:text-gray-300 dark:hover:text-emerald-500'
                }`}
            >
              My Profile
            </Link>
            <Link
              to="/customer-settings"
              className={`mobile-nav-link ${isActive('/customer-settings')
                  ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                  : 'dark:text-gray-300 dark:hover:text-emerald-500'
                }`}
            >
              Settings
            </Link>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full text-center py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium touch-target dark:hover:bg-red-800"
              >
                Logout
              </button>
            </div>

            <button
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center mobile-nav-link dark:text-gray-300 dark:hover:text-emerald-500"
            >
              <HelpCircleIcon size={18} className="mr-3" />
              Help
            </button>
          </div>
        </div>
      )}

      {/* Help Menu Modal */}
      <HelpMenu isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </nav>
  );
};

export default CustomerNavBar;
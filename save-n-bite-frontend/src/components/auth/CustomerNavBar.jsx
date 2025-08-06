import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6 md:px-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-15 h-9 self-center" />
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
            Save n Bite
          </span>
        </Link>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500 focus:outline-none"
          >
            {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            to="/food-listing"
            className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500"
          >
            Browse Food
          </Link>
          <Link
            to="/providers"
            className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500"
          >
            Browse Food Providers
          </Link>
          <Link
            to="/cart"
            className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500"
          >
            My Cart
          </Link>
          <Link
            to="/orders"
            className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500"
          >
            Order History
          </Link>
          <Link
            to="/profile"
            className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500"
          >
            My Profile
          </Link>
          <Link
            to="/customer-settings"
            className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500"
          >
            Settings
          </Link>

          {/* Notifications */}
          <NotificationBell />

          {/* Help */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500"
            aria-label="Help"
          >
            <HelpCircleIcon size={24} />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
          >
            <LogOutIcon size={20} className="mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu Links */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 pb-4 px-4">
          <div className="flex flex-col space-y-4">
            <Link
              to="/food-listing"
              className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 py-2"
            >
              Browse Food
            </Link>
            <Link
              to="/providers"
              className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 py-2"
            >
              Browse Food Providers
            </Link>
            <Link
              to="/cart"
              className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 py-2"
            >
              My Cart
            </Link>
            <Link
              to="/orders"
              className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 py-2"
            >
              Order History
            </Link>
            <Link
              to="/profile"
              className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 py-2"
            >
              My Profile
            </Link>
            <Link
              to="/customer-settings"
              className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 py-2"
            >
              Settings
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 py-2 w-full text-left"
            >
              <LogOutIcon size={20} className="mr-2" />
              Logout
            </button>
            <button
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 py-2"
            >
              <HelpCircleIcon size={20} className="mr-2" />
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

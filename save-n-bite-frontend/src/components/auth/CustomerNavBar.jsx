import React, { useState, useEffect } from 'react';
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
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-hide navbar functionality
  useEffect(() => {
    let timeoutId;

    const handleMouseMove = (e) => {
      const currentScrollY = window.scrollY;
      
      // Only show navbar on hover if we're scrolled down (navbar is hidden)
      if (currentScrollY > 100 && e.clientY <= 80) {
        setIsNavVisible(true);
        // Clear any existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      } 
      // Hide navbar when mouse moves away from top and we're scrolled down
      else if (currentScrollY > 100 && e.clientY > 120 && !isMenuOpen && !isHelpOpen) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          setIsNavVisible(false);
        }, 1500);
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show navbar when at the top of the page
      if (currentScrollY <= 100) {
        setIsNavVisible(true);
        // Clear any hide timeout when at top
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      } 
      // Hide navbar when scrolling down past 100px
      else if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        if (!isMenuOpen && !isHelpOpen) {
          setIsNavVisible(false);
        }
      }
      // Show navbar when scrolling up (regardless of position)
      else if (currentScrollY < lastScrollY) {
        setIsNavVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Always show navbar when menus are open
    if (isMenuOpen || isHelpOpen) {
      setIsNavVisible(true);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isMenuOpen, isHelpOpen, lastScrollY]);

  // Helper function to determine if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  return (
    <>
      {/* Trigger zone - invisible area at the top for hover detection when scrolled */}
      <div 
        className="fixed top-0 left-0 w-full h-20 z-40 pointer-events-auto"
        style={{ 
          background: 'transparent',
          // Only active when scrolled down and navbar is hidden
          pointerEvents: (window.scrollY > 100 && !isNavVisible) ? 'auto' : 'none'
        }}
        onMouseEnter={() => {
          if (window.scrollY > 100) {
            setIsNavVisible(true);
          }
        }}
      />
      
      <nav 
        className={`fixed top-0 left-0 w-full bg-white dark:bg-gray-800 shadow-sm py-3 sm:py-4 px-4 sm:px-6 md:px-12 transition-all duration-300 ease-in-out z-50 ${
          isNavVisible 
            ? 'transform translate-y-0 opacity-100' 
            : 'transform -translate-y-full opacity-0'
        }`}
        onMouseEnter={() => setIsNavVisible(true)}
        onMouseLeave={(e) => {
          // Only start hide timer if mouse leaves the navbar area and we're scrolled down
          const currentScrollY = window.scrollY;
          if (e.clientY > 120 && currentScrollY > 100 && !isMenuOpen && !isHelpOpen) {
            setTimeout(() => {
              setIsNavVisible(false);
            }, 1000);
          }
        }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="w-8 h-8 sm:w-12 sm:h-9 self-center" />
            <span className="hidden sm:block text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-500">
              Save n Bite
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link
              to="/food-listing"
              className={`nav-link text-sm lg:text-base transition-colors duration-200 ${isActive('/food-listing')
                  ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500'
                }`}
            >
              Browse Food
            </Link>
            <Link
              to="/providers"
              className={`nav-link text-sm lg:text-base transition-colors duration-200 ${isActive('/providers')
                  ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500'
                }`}
            >
              Browse Food Providers
            </Link>
            <Link
              to="/cart"
              className={`nav-link text-sm lg:text-base transition-colors duration-200 ${isActive('/cart')
                  ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500'
                }`}
            >
              My Cart
            </Link>
            <Link
              to="/orders"
              className={`nav-link text-sm lg:text-base transition-colors duration-200 ${isActive('/orders')
                  ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500'
                }`}
            >
              Order History
            </Link>
            <Link
              to="/profile"
              className={`nav-link text-sm lg:text-base transition-colors duration-200 ${isActive('/profile')
                  ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500'
                }`}
            >
              My Profile
            </Link>
            <Link
              to="/customer-settings"
              className={`nav-link text-sm lg:text-base transition-colors duration-200 ${isActive('/customer-settings')
                  ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500'
                }`}
            >
              Settings
            </Link>

            <NotificationBell />

            <button
              onClick={() => setIsHelpOpen(true)}
              className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 touch-target transition-colors duration-200"
              aria-label="Help"
            >
              <HelpCircleIcon size={20} className="sm:w-6 sm:h-6" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm lg:text-base touch-target dark:hover:bg-red-700 transition-colors duration-200"
            >
              Logout
            </button>
          </div>

          {/* Mobile Navigation Icons */}
          <div className="md:hidden flex items-center space-x-3">
            <NotificationBell />
            <button
              onClick={() => setIsHelpOpen(true)}
              className="text-gray-500 hover:text-emerald-600 focus:outline-none touch-target transition-colors duration-200"
              aria-label="Help"
            >
              <HelpCircleIcon size={20} />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-emerald-600 focus:outline-none touch-target transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Links */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 pb-4 px-4 border-t border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col space-y-2 pt-4">
              <Link
                to="/food-listing"
                className={`mobile-nav-link transition-colors duration-200 ${isActive('/food-listing')
                    ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                    : 'dark:text-gray-300 dark:hover:text-emerald-500'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Browse Food
              </Link>
              <Link
                to="/providers"
                className={`mobile-nav-link transition-colors duration-200 ${isActive('/providers')
                    ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                    : 'dark:text-gray-300 dark:hover:text-emerald-500'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Browse Food Providers
              </Link>
              <Link
                to="/cart"
                className={`mobile-nav-link transition-colors duration-200 ${isActive('/cart')
                    ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                    : 'dark:text-gray-300 dark:hover:text-emerald-500'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                My Cart
              </Link>
              <Link
                to="/orders"
                className={`mobile-nav-link transition-colors duration-200 ${isActive('/orders')
                    ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                    : 'dark:text-gray-300 dark:hover:text-emerald-500'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Order History
              </Link>
              <Link
                to="/profile"
                className={`mobile-nav-link transition-colors duration-200 ${isActive('/profile')
                    ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                    : 'dark:text-gray-300 dark:hover:text-emerald-500'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                My Profile
              </Link>
              <Link
                to="/customer-settings"
                className={`mobile-nav-link transition-colors duration-200 ${isActive('/customer-settings')
                    ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                    : 'dark:text-gray-300 dark:hover:text-emerald-500'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Settings
              </Link>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="w-full text-center py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium touch-target dark:hover:bg-red-800 transition-colors duration-200"
                >
                  Logout
                </button>
              </div>

              <button
                onClick={() => {
                  setIsHelpOpen(true);
                  setIsMenuOpen(false);
                }}
                className="flex items-center mobile-nav-link dark:text-gray-300 dark:hover:text-emerald-500 transition-colors duration-200"
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

      {/* Spacer to prevent content from being hidden under fixed navbar when at top */}
      <div className={`transition-all duration-300 ${window.scrollY <= 100 ? 'h-16 sm:h-20' : 'h-0'}`} />
    </>
  );
};

export default CustomerNavBar;
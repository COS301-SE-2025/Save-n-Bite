import React, { useState, useEffect, useRef } from 'react';

import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MenuIcon,
  XIcon,
  HelpCircleIcon,
  LogOutIcon,
  TreePineIcon, // Garden icon - you can also use Sprout or Flower
} from 'lucide-react';
import logo from '../../assets/images/SnB_leaf_icon.png';
import NotificationBell from './NotificationBell';
import HelpMenu from '../../components/auth/Help/HelpMenu';

const CustomerNavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollYRef = useRef(0);
  const hideTimeoutRef = useRef(null);
  const tickingRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Auto-hide navbar functionality (refined to avoid glitches)
  useEffect(() => {
    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        const last = lastScrollYRef.current;

        // Update top state (used for spacer decision if needed)
        const atTopNow = y <= 100;
        if (atTopNow !== isAtTop) setIsAtTop(atTopNow);

        // Always show when at top
        if (atTopNow) {
          if (!isNavVisible) setIsNavVisible(true);
        } else if (y > last && y > 100) {
          // Scrolling down
          if (!isMenuOpen && !isHelpOpen) {
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
              hideTimeoutRef.current = null;
            }
            if (isNavVisible) setIsNavVisible(false);
          }
        } else if (y < last) {
          // Scrolling up
          if (!isNavVisible) setIsNavVisible(true);
        }

        lastScrollYRef.current = y;
        tickingRef.current = false;
      });
    };

    const onMouseMove = (e) => {
      const y = window.scrollY || 0;
      if (y > 100) {
        // If user moves near top edge, reveal quickly
        if (e.clientY <= 80 && !isNavVisible) {
          setIsNavVisible(true);
        }
        // If user moves away from top and menus are closed, schedule hide
        if (e.clientY > 140 && !isMenuOpen && !isHelpOpen) {
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = setTimeout(() => {
            setIsNavVisible(false);
          }, 800);
        }
      }
    };

    // Always show when menus are open
    if (isMenuOpen || isHelpOpen) {
      if (!isNavVisible) setIsNavVisible(true);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mousemove', onMouseMove);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isMenuOpen, isHelpOpen, isNavVisible, isAtTop]);

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
      <nav
        className={`fixed top-0 left-0 w-full bg-white dark:bg-gray-800 shadow-sm py-3 sm:py-4 px-4 sm:px-6 md:px-12 transition-transform duration-200 ease-out z-50 ${
          isNavVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        onMouseEnter={() => setIsNavVisible(true)}
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
            
            {/* NEW: Digital Garden Link */}
            <Link
              to="/garden"
              className={`nav-link text-sm lg:text-base transition-colors duration-200 flex items-center gap-1 ${isActive('/garden')
                  ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500'
                }`}
            >
              <TreePineIcon size={16} className="inline" />
              <span className="hidden lg:inline">My Garden</span>
              <span className="lg:hidden">Garden</span>
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
            
            {/* NEW: Mobile Garden Quick Access */}
            <Link
              to="/garden"
              className={`touch-target transition-colors duration-200 ${isActive('/garden')
                  ? 'text-emerald-600'
                  : 'text-gray-500 hover:text-emerald-600'
                }`}
              aria-label="My Garden"
            >
              <TreePineIcon size={20} />
            </Link>
            
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

                {/* NEW: Mobile Garden Link */}
              <Link
                to="/garden"
                className={`mobile-nav-link flex items-center transition-colors duration-200 ${isActive('/garden')
                    ? 'text-emerald-600 dark:text-emerald-500 font-medium'
                    : 'dark:text-gray-300 dark:hover:text-emerald-500'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
              My Digital Garden
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

      {/* Constant spacer to prevent content jump and flicker */}
      <div className="h-16 sm:h-20" />
    </>
  );
};

export default CustomerNavBar;
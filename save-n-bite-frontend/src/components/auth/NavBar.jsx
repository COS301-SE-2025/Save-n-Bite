import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MenuIcon, XIcon } from 'lucide-react';
import logo from '../../assets/images/SnB_leaf_icon.png';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    const userDataStr = localStorage.getItem('userData');
    setIsAuthenticated(!!token);
    if (userDataStr) {
      setUserData(JSON.parse(userDataStr));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setIsAuthenticated(false);
    setUserData(null);
    navigate('/login');
  };

  return <nav className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6 md:px-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex justify-between items-center">

        <Link to="/" className="flex items-baseline gap-2"> 
        <img 
            src={logo} 
            alt="Logo"
            className="w-15 h-9 self-center"  
        />
        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
            Save n Bite
        </span>
        </Link>
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500 focus:outline-none">
            {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500">
            About
          </Link>
          <Link to="/browse" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500">
            Browse Food
          </Link>
          <Link to="/how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500">
            How It Works
          </Link>
          
          {isAuthenticated ? (
            <>
              {userData?.user_type === 'provider' && (
                <Link to="/create-listing" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500">
                  Create Listing
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500">
                Sign Up
              </Link>
              <Link to="/login" className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                Login
              </Link>
            </>
          )}
        </div>
      </div>
      {isMenuOpen && <div className="md:hidden mt-4 pb-4 px-4">
          <div className="flex flex-col space-y-4">
            <Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 py-2">
              About
            </Link>
            
            <Link to="/how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 py-2">
              How It Works
            </Link>
            
            {isAuthenticated ? (
              <>
                {userData?.user_type === 'provider' && (
                  <Link to="/create-listing" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 py-2">
                    Create Listing
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-center py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 py-2">
                  Sign Up
                </Link>
                <Link to="/login" className="text-center py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>}
    </nav>;
};
export default Navigation;
// NavigationPrivate.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MenuIcon, XIcon } from 'lucide-react';
import logo from '../../assets/images/SnB_leaf_icon.png';

const CustomerNavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6 md:px-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="flex items-baseline gap-2">
          <img src={logo} alt="Logo" className="w-15 h-9 self-center" />
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
            Save n Bite
          </span>
        </Link>

        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500 focus:outline-none"
          >
            {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <Link to="/food-listing" className="nav-link">Browse Food</Link>
          <Link to="/cart" className="nav-link">My Cart</Link>
          <Link to="/orders" className="nav-link">Order History</Link>
          <Link to="/profile" className="nav-link">Profile</Link>
          {/* <Link to="/how-it-works" className="nav-link">How It Works</Link>
          <Link to="/about" className="nav-link">About</Link> */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden mt-4 pb-4 px-4">
          <div className="flex flex-col space-y-4">
            <Link to="/food-listing" className="nav-link">Browse Food</Link>
          <Link to="/cart" className="nav-link">My Cart</Link>
          <Link to="/orders" className="nav-link">Order History</Link>
          <Link to="/profile" className="nav-link">Profile</Link>
          {/* <Link to="/how-it-works" className="nav-link">How It Works</Link>
          <Link to="/about" className="nav-link">About</Link> */}
            <button
              onClick={handleLogout}
              className="text-center py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default CustomerNavBar;

import React from 'react';
import { Link } from 'react-router-dom';
import { FacebookIcon, InstagramIcon, TwitterIcon, MailIcon, PhoneIcon, MapPinIcon } from 'lucide-react';

const Footer = () => {
  return <footer className="bg-gray-50 dark:bg-gray-900 pt-12 pb-8 px-6 md:px-12 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-emerald-600">
              Save n Bite
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Reducing food waste while helping you save money and the planet.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                <FacebookIcon size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                <InstagramIcon size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                <TwitterIcon size={20} />
              </a>
            </div>
          </div>
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">
                  About Us
                </Link>
              </li>
              
              <li>
                <Link to="/how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>
          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
              Contact Us
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <MailIcon size={16} className="mr-2 text-emerald-600" />
                <span className="text-gray-600 dark:text-gray-300">info@savenbite.co.za</span>
              </li>
              <li className="flex items-center">
                <PhoneIcon size={16} className="mr-2 text-emerald-600" />
                <span className="text-gray-600 dark:text-gray-300">+27 12 345 6789</span>
              </li>
              <li className="flex items-center">
                <MapPinIcon size={16} className="mr-2 text-emerald-600" />
                <span className="text-gray-600 dark:text-gray-300">123 Hilda Street, Hatfield, Pretoria, 0083</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-6">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            © {new Date().getFullYear()} Save n Bite. All rights reserved.
          </p>
        </div>
      </div>
    </footer>;
};

export default Footer;
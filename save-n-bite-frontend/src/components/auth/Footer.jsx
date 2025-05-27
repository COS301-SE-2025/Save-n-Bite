import React from 'react';
import { Link } from 'react-router-dom';
import { FacebookIcon, InstagramIcon, TwitterIcon, MailIcon, PhoneIcon, MapPinIcon } from 'lucide-react';

const Footer = () => {
  return <footer className="bg-gray-50 pt-12 pb-8 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-emerald-600">
              Save n Bite
            </h3>
            <p className="text-gray-600 mb-4">
              Reducing food waste while helping you save money and the planet.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-emerald-600">
                <FacebookIcon size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-600">
                <InstagramIcon size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-600">
                <TwitterIcon size={20} />
              </a>
            </div>
          </div>
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-emerald-600">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-600 hover:text-emerald-600">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/browse" className="text-gray-600 hover:text-emerald-600">
                  Browse Food
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-gray-600 hover:text-emerald-600">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>
          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-gray-600 hover:text-emerald-600">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-emerald-600">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-emerald-600">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-emerald-600">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Contact Us
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <MailIcon size={16} className="mr-2 text-emerald-600" />
                <span className="text-gray-600">info@savenbite.co.za</span>
              </li>
              <li className="flex items-center">
                <PhoneIcon size={16} className="mr-2 text-emerald-600" />
                <span className="text-gray-600">+27 12 345 6789</span>
              </li>
              <li className="flex items-center">
                <MapPinIcon size={16} className="mr-2 text-emerald-600" />
                <span className="text-gray-600">123 Hilda Street, Hatfield, Pretoria, 0083</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-6">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Save n Bite. All rights reserved.
          </p>
        </div>
      </div>
    </footer>;
};

export default Footer;
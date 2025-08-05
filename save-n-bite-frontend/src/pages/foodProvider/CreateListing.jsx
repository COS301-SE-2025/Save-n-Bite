import React, { useState } from 'react';
import { ListingForm } from '../../components/foodProvider/ListingsForm';
import SideBar from '../../components/foodProvider/SideBar';
import { Menu, X } from 'lucide-react';

const CreateListing = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar - Hidden on mobile (md:flex = show on medium screens and up) */}
      <div className="hidden md:flex">
        <SideBar onNavigate={() => {}} currentPage="create-listing" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={toggleMobileSidebar}
          />
          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-64 z-50">
            <SideBar onNavigate={() => setIsMobileSidebarOpen(false)} currentPage="create-listing" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile Header with Menu Button */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={toggleMobileSidebar}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Create Listing</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto p-4 md:p-8 w-full">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <div>
              {/* Hide main title on mobile since it's in the header */}
              <h1 className="hidden md:block text-3xl font-bold text-gray-900">Create New Listing</h1>
              <h2 className="md:hidden text-xl font-bold text-gray-900">New Listing</h2>
              <p className="text-gray-600 mt-2 text-sm md:text-base">
                List your surplus food items for sale or donation
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <ListingForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateListing;
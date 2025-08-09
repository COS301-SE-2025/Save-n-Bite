import React, { useContext } from 'react';
import { ListingForm } from '../../components/foodProvider/ListingsForm';
import SideBar from '../../components/foodProvider/SideBar';
import { ThemeContext } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const CreateListing = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <SideBar onNavigate={() => {}} currentPage="create-listing" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8 w-full">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Listing</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                List your surplus food items for sale or donation
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors duration-300">
            <ListingForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateListing;
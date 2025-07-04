import React from 'react';
import { ListingForm } from '../../components/foodProvider/ListingsForm';
import SideBar from '../../components/foodProvider/SideBar';
import { useNavigate } from 'react-router-dom';

const CreateListing = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50"> 
      <SideBar onNavigate={() => {}} currentPage="create-listing" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8 w-full">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Listing</h1>
              <p className="text-gray-600 mt-2">
                List your surplus food items for sale or donation
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ListingForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateListing;
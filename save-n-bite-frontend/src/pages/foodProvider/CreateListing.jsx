import React from 'react';
import { ListingForm } from '../../components/foodProvider/ListingsForm';
import SideBar from '../../components/foodProvider/sideBar';

const CreateListing = () => {
  return (
    <div className="flex h-screen bg-gray-50"> {/* Flex container in row direction */}
      <SideBar onNavigate={() => {}} currentPage="create-listing" />
      <div className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Listing</h1>
          <p className="text-gray-600 mt-2">
            List your surplus food items for sale or donation
          </p>
        </div>
        <ListingForm />
      </div>
    </div>
  );
};

export default CreateListing;

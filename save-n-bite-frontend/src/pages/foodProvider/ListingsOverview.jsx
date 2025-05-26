import React, { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/foodProvider/StatusBadge';
import SideBar from '../../components/foodProvider/SideBar';
import EditListingModal from '../../components/foodProvider/EditListing';

const ListingsOverview = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [listingToDelete, setListingToDelete] = useState(null);

  const navigate = useNavigate();

  // Sample listing data
  const sampleListing = {
    id: '1',
    foodName: 'Fresh Bread Loaves',
    description: 'Artisanal sourdough',
    quantity: '10 loaves',
    price: '25',
    type: 'For Sale',
    expirationDate: '2023-12-31',
    status: 'active'
  };

  const handleEditListing = (listing) => {
    setSelectedListing(listing);
    setIsEditModalOpen(true);
  };

  const handleSaveListing = (updatedListing) => {
    console.log('Saved listing:', updatedListing);
    // Here you would typically update your state or make an API call
    setIsEditModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SideBar onNavigate={() => {}} currentPage="listings-overview" />

      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
              <p className="text-gray-600 mt-2">
                Manage and track your food listings
              </p>
            </div>
             <button
              onClick={() => navigate('/createListing')} 
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Listing
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Search listings..."
              className="flex-1 p-2 border border-gray-300 rounded-lg"
            />
            <select className="p-2 border border-gray-300 rounded-lg">
              <option>All Status</option>
              <option>Active</option>
              <option>Expiring Soon</option>
              <option>Expired</option>
            </select>
            <select className="p-2 border border-gray-300 rounded-lg">
              <option>All Types</option>
              <option>For Sale</option>
              <option>Donation</option>
            </select>
          </div>

          {/* Listings Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Food Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiration Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-gray-200 mr-3"></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {sampleListing.foodName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sampleListing.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sampleListing.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={sampleListing.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sampleListing.expirationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sampleListing.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleEditListing(sampleListing)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setListingToDelete(sampleListing);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>

                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <EditListingModal
      listing={selectedListing}  
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      onSave={handleSaveListing}
    />

    {isDeleteModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
      <p className="mb-6">Are you sure you want to delete <strong>{listingToDelete?.foodName}</strong>?</p>
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => setIsDeleteModalOpen(false)}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            console.log("Deleting:", listingToDelete);
            // TODO: Add actual delete logic (e.g. API call or state update)
            setIsDeleteModalOpen(false);
          }}
          className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

    </div>
    
  );
};

export default ListingsOverview;
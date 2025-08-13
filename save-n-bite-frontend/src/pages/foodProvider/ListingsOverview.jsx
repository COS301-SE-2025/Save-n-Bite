import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Plus, Edit, Trash2 } from 'lucide-react';
import SideBar from '../../components/foodProvider/SideBar';
import foodListingsAPI from '../../services/foodListingsAPI';

export default function ListingsOverview() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      const response = await foodListingsAPI.getProviderListings();
      console.log('ListingsOverview received response:', response);
      
      if (response.success) {
        console.log('Setting listings:', response.data);
        setListings(response.data);
      } else {
        console.error('Error in response:', response.error);
        setError(response.error);
      }
    } catch (error) {
      console.error('Error in fetchListings:', error);
      setError('Failed to fetch listings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };
const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      try {
        setError(null); // Clear any previous errors
        const response = await foodListingsAPI.deleteListing(id);
        
        if (response.success) {
          // Remove the listing from the state
          setListings(listings.filter(listing => listing.id !== id));
          
          // Show success message
          alert(response.message || 'Listing deleted successfully!');
        } else {
          console.error('Delete failed:', response.error);
          setError(response.error || 'Failed to delete listing');
        }
      } catch (error) {
        console.error('Delete error:', error);
        setError('Failed to delete listing. Please try again.');
      }
    }
  };

  return (
<div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
  {/* Desktop Sidebar - Hidden on mobile */}
  <div className="hidden md:flex">
    <SideBar currentPage="ListingOverview" />
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
        <SideBar 
          currentPage="ListingOverview"
          onNavigate={() => setIsMobileSidebarOpen(false)}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      </div>
    </div>
  )}

  <div className="flex-1 overflow-auto">
    {/* Mobile Header */}
    <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
      <button
        onClick={toggleMobileSidebar}
        className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Listings</h1>
      <button
        onClick={() => navigate('/create-listing')}
        className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg"
        aria-label="Create listing"
      >
        <Plus size={24} />
      </button>
    </div>

    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-6">
        <div>
          <h1 className="hidden md:block text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">Your Listings</h1>
          <h2 className="md:hidden text-xl font-semibold text-gray-800 dark:text-gray-100">Listings</h2>
        </div>
        <button
          onClick={() => navigate('/create-listing')}
          className="hidden md:flex px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 items-center gap-2"
        >
              <Plus size={18} />
              Create New Listing
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading listings...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchListings}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You haven't created any listings yet.</p>
              <button
                onClick={() => navigate('/create-listing')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Listing
              </button>
            </div>
          ) : (
          <>
  {/* Desktop Table View - Hidden on mobile */}
  <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-300">
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-800">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Food Item
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Type
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Price
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Quantity
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Expiry Date
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {listings.map((listing) => (
          <tr key={listing.id}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                {listing.image && (
                  <img
                    src={listing.image}
                    alt={listing.name}
                    className="h-10 w-10 rounded-full object-cover mr-3"
                  />
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{listing.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-300">{listing.description}</div>
                </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            listing.type === 'donation' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {listing.type === 'donation' ? 'Donation' : 'Sale'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {listing.type === 'donation' ? 'Free' : `R${listing.discountedPrice}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {listing.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {listing.expiryDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {listing.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => navigate(`/edit-listing/${listing.id}`)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(listing.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View - Visible only on mobile */}
              <div className="md:hidden space-y-4">
                {listings.map((listing) => (
                  <div key={listing.id} className="bg-white rounded-lg shadow-md p-4">
                    {/* Header with image and name */}
                    <div className="flex items-start mb-3">
                      {listing.image && (
                        <img
                          src={listing.image}
                          alt={listing.name}
                          className="h-12 w-12 rounded-lg object-cover mr-3 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{listing.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{listing.description}</p>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <span className="text-xs text-gray-500 block">Type</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          listing.type === 'donation' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {listing.type === 'donation' ? 'Donation' : 'Sale'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Price</span>
                        <span className="text-sm font-medium text-gray-900">
                          {listing.type === 'donation' ? 'Free' : `R${listing.discountedPrice}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Quantity</span>
                        <span className="text-sm font-medium text-gray-900">{listing.quantity}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Status</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {listing.status}
                        </span>
                      </div>
                    </div>

                    {/* Expiry date */}
                    <div className="mb-4">
                      <span className="text-xs text-gray-500 block">Expires</span>
                      <span className="text-sm font-medium text-gray-900">{listing.expiryDate}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/edit-listing/${listing.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
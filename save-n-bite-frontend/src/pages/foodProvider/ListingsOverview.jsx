import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Plus, Edit, Trash2 } from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import SideBar from '../../components/foodProvider/SideBar';
import foodListingsAPI from '../../services/foodListingsAPI';

export default function ListingsOverview() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await foodListingsAPI.getProviderListings();

      if (response.success) {
        // Filter out removed listings
        const activeListings = response.data.filter(listing => listing.status !== 'removed');
        setListings(activeListings);
      } else {
        console.error('ListingsOverview received response:', response);
        setError(response.error || 'Failed to fetch listings');
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to load listings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleDelete = async (listing) => {
    setListingToDelete(listing);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!listingToDelete) return;

    try {
      setError(null);
      const response = await foodListingsAPI.deleteListing(listingToDelete.id);

      if (response.success) {
        setListings(listings.filter(listing => listing.id !== listingToDelete.id));
        showToast('Listing deleted successfully!', 'success');
      } else {
        console.error('Delete failed:', response.error);
        showToast(response.error || 'Failed to delete listing', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete listing. Please try again.', 'error');
    } finally {
      setShowConfirmDelete(false);
      setListingToDelete(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <SideBar isMobileOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} currentPage="ListingOverview" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          {/* Mobile Header */}
          <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between transition-colors duration-300">
            <button
              onClick={toggleMobileSidebar}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Listings Table/Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 dark:text-red-400">{error}</p>
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
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${listing.type === 'donation' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
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
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                              onClick={() => handleDelete(listing)}
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${listing.type === 'donation' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                          onClick={() => handleDelete(listing)}
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
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => {
          setShowConfirmDelete(false);
          setListingToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Listing"
        message={`Are you sure you want to delete "${listingToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="No, Keep It"
      />
    </div>
  );
}
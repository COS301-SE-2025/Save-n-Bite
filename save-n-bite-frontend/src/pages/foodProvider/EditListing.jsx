import React, { useState, useEffect } from 'react';
import { ListingForm } from '../../components/foodProvider/ListingsForm';
import SideBar from '../../components/foodProvider/SideBar';
import { Menu, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import foodListingsAPI from '../../services/foodListingsAPI';

const EditListing = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { listingId } = useParams();

  useEffect(() => {
    if (listingId) {
      fetchListingForEdit();
    }
  }, [listingId]);

  // const fetchListingForEdit = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await foodListingsAPI.getListingForEdit(listingId);
      
  //     if (response.success) {
  //       setListing(response.data);
  //     } else {
  //       setError(response.error || 'Failed to load listing');
  //     }
  //   } catch (err) {
  //     setError('Failed to load listing');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchListingForEdit = async () => {
    try {
      setLoading(true);
      const response = await foodListingsAPI.getListingForEdit(listingId);
      console.log('Fetched listing for edit:', response);
      
      if (response.success) {
        // Transform the listing data to match the form structure
        const listingData = response.data;
        
        // Parse pickup window if it exists
        let pickup_start_time = '';
        let pickup_end_time = '';
        if (listingData.pickup_window) {
          const [start, end] = listingData.pickup_window.split('-');
          pickup_start_time = start;
          pickup_end_time = end;
        }

        // Format the listing data for the form
        const formattedListing = {
          ...listingData,
          pickup_start_time,
          pickup_end_time,
          // Ensure these fields exist even if empty
          pickup_address: listingData.pickup_address || '',
          pickup_instructions: listingData.pickup_instructions || 'Collect at the main counter',
          pickup_contact_person: listingData.pickup_contact_person || '',
          pickup_contact_phone: listingData.pickup_contact_phone || '',
          pickup_latitude: listingData.pickup_latitude || '',
          pickup_longitude: listingData.pickup_longitude || '',
          total_slots: listingData.total_slots || '4',
          max_orders_per_slot: listingData.max_orders_per_slot || '2',
          slot_buffer_minutes: listingData.slot_buffer_minutes || '10'
        };

        setListing(formattedListing);
      } else {
        setError(response.error || 'Failed to load listing');
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };


  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <div className="hidden md:flex">
          <SideBar currentPage="ListingOverview" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading listing...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <div className="hidden md:flex">
          <SideBar currentPage="ListingOverview" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => navigate('/listings-overview')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Listings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <SideBar onNavigate={() => {}} currentPage="ListingOverview" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={toggleMobileSidebar}
          />
          <div className="fixed left-0 top-0 h-full w-64 z-50">
            <SideBar onNavigate={() => setIsMobileSidebarOpen(false)} currentPage="ListingOverview" />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <button
            onClick={toggleMobileSidebar}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Listing</h1>
          <button
            onClick={() => navigate('/listings-overview')}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            aria-label="Back to listings"
          >
            <ArrowLeft size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto p-4 md:p-8 w-full">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <div>
              <h1 className="hidden md:block text-3xl font-bold text-gray-900 dark:text-gray-100">
                Edit Listing
              </h1>
              <h2 className="md:hidden text-xl font-bold text-gray-900 dark:text-gray-100">
                Edit Listing
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm md:text-base">
                Update your food listing details
              </p>
            </div>
            <button
              onClick={() => navigate('/listings-overview')}
              className="hidden md:flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Listings
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6 transition-colors duration-300">
            <ListingForm 
              editMode={true} 
              initialData={listing}
              listingId={listingId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditListing;
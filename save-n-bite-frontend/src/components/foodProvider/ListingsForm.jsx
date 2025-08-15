import React, { useState, useEffect } from 'react';
import { CalendarIcon, ImageIcon, ClockIcon, MapPinIcon, PhoneIcon, UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import foodListingsAPI from '../../services/foodListingsAPI';
import schedulingAPI from '../../services/schedulingAPI';

export function ListingForm({ editMode = false, initialData = null, listingId = null }) {
  const navigate = useNavigate();
  const [isDonation, setIsDonation] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState(null);

  // Initialize form data with defaults or initial data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    original_price: '',
    discounted_price: '',
    expiry_date: '',
    pickup_start_time: '',
    pickup_end_time: '',
    image: null,
    pickup_address: '',
    pickup_instructions: 'Collect at the main counter',
    pickup_contact_person: '',
    pickup_contact_phone: '',
    pickup_latitude: '',
    pickup_longitude: '',
    total_slots: '4',
    max_orders_per_slot: '2',
    slot_buffer_minutes: '10'
  });

  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    // Load user data
    const storedUserData = localStorage.getItem('userData') || localStorage.getItem('user');
    if (storedUserData) {
      try {
        const user = JSON.parse(storedUserData);
        setUserData(user);
        
        // Pre-populate pickup location fields with user data (only if not in edit mode)
        if (!editMode) {
          setFormData(prev => ({
            ...prev,
            pickup_address: user.profile?.business_address || user.business_address || '',
            pickup_contact_person: user.profile?.business_name || user.business_name || '',
            pickup_contact_phone: user.profile?.phone || user.profile?.contact_phone || user.phone || ''
          }));
        }
      } catch (parseError) {
        console.error('Error parsing user data:', parseError);
      }
    }

    // If in edit mode and we have initial data, populate the form
    if (editMode && initialData) {
      populateFormWithInitialData(initialData);
    }
  }, [editMode, initialData]);

  const populateFormWithInitialData = (data) => {
    console.log('Populating form with data:', data);
    
    // Parse pickup window if it exists
    let startTime = '';
    let endTime = '';
    if (data.pickup_window) {
      const [start, end] = data.pickup_window.split('-');
      startTime = start?.trim() || '';
      endTime = end?.trim() || '';
    }

    // Format date for input field (YYYY-MM-DD)
    let formattedDate = '';
    if (data.expiry_date) {
      const date = new Date(data.expiry_date);
      formattedDate = date.toISOString().split('T')[0];
    }

    // Check if it's a donation (price is 0 or null)
    const isItemDonation = !data.discounted_price || parseFloat(data.discounted_price) === 0;
    setIsDonation(isItemDonation);

    // Set image preview if image exists
    if (data.imageUrl || data.image) {
      setImagePreview(data.imageUrl || data.image);
    }

    setFormData(prev => ({
      ...prev,
      name: data.name || '',
      description: data.description || '',
      quantity: data.quantity?.toString() || '',
      original_price: data.original_price?.toString() || '',
      discounted_price: data.discounted_price?.toString() || '',
      expiry_date: formattedDate,
      pickup_start_time: startTime,
      pickup_end_time: endTime,
      // Keep existing pickup location data or use from initial data if available
      pickup_address: data.pickup_address || prev.pickup_address,
      pickup_instructions: data.pickup_instructions || prev.pickup_instructions,
      pickup_contact_person: data.pickup_contact_person || prev.pickup_contact_person,
      pickup_contact_phone: data.pickup_contact_phone || prev.pickup_contact_phone,
      pickup_latitude: data.pickup_latitude || prev.pickup_latitude,
      pickup_longitude: data.pickup_longitude || prev.pickup_longitude,
    }));
  };

  const validateField = (name, value) => {
    if (!value && !['pickup_latitude', 'pickup_longitude'].includes(name)) {
      setErrors(prev => ({
        ...prev,
        [name]: 'This field is required'
      }));
      return false;
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
      return true;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    validateField(name, value);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          image: 'Please select an image file'
        }));
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Image size should be less than 5MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Clear any previous image errors
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.image;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(`=== ${editMode ? 'UPDATE' : 'CREATE'} SUBMIT STARTED ===`);
    setIsSubmitting(true);

    try {
      // Clear previous errors
      setErrors({});

      // Validate user permissions
      if (!userData || userData.user_type !== 'provider') {
        throw new Error('Only verified providers can create/edit listings.');
      }

      if (userData.profile?.status === 'pending_verification') {
        throw new Error('Your provider account is pending verification.');
      }

      // Validate required fields
      const requiredFields = [
        'name', 'description', 'quantity', 'expiry_date', 'pickup_start_time', 'pickup_end_time'
      ];

      // For create mode, require pickup location fields
      if (!editMode) {
        requiredFields.push('pickup_address', 'pickup_contact_person', 'pickup_contact_phone');
      }

      // If not donation, validate price fields
      if (!isDonation) {
        requiredFields.push('original_price', 'discounted_price');
      }

      const validationErrors = {};
      requiredFields.forEach(field => {
        if (!formData[field] || formData[field].toString().trim() === '') {
          validationErrors[field] = 'This field is required';
        }
      });

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error('Please fill in all required fields');
      }

      // Validate pickup time range
      if (formData.pickup_start_time >= formData.pickup_end_time) {
        setErrors(prev => ({
          ...prev,
          pickup_end_time: 'End time must be after start time'
        }));
        throw new Error('Invalid pickup time range');
      }

      console.log('=== VALIDATION PASSED ===');

      // Create pickup_window from start and end times
      const pickup_window = `${formData.pickup_start_time}-${formData.pickup_end_time}`;

      // Format the date to YYYY-MM-DD
      const expiryDate = new Date(formData.expiry_date);
      const formattedDate = expiryDate.toISOString().split('T')[0];

      // Format the data according to the API's expected structure
      const listingData = {
        name: formData.name,
        description: formData.description,
        food_type: 'ready_to_eat',
        original_price: isDonation ? 0 : parseFloat(formData.original_price) || 0,
        discounted_price: isDonation ? 0 : parseFloat(formData.discounted_price) || 0,
        quantity: parseInt(formData.quantity),
        expiry_date: formattedDate,
        pickup_window: pickup_window,
        allergens: [],
        dietary_info: [],
        is_available: true,
        status: 'active'
      };

      console.log(`=== ${editMode ? 'UPDATING' : 'CREATING'} LISTING ===`, listingData);

      // Process the listing data
      let finalListingData = { ...listingData };

      // If there's an image, convert it to base64 (only if it's a new file)
      if (formData.image && formData.image instanceof File) {
        try {
          const base64data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(formData.image);
          });
          finalListingData.imageUrl = base64data;
        } catch (imageError) {
          console.error('Error processing image:', imageError);
          // Continue without image if image processing fails
        }
      }

      // Create or update the listing
      let response;
      if (editMode) {
        response = await foodListingsAPI.updateListing(listingId, finalListingData);
      } else {
        response = await foodListingsAPI.createListing(finalListingData);
      }

      console.log(`=== ${editMode ? 'UPDATE' : 'CREATE'} API RESPONSE ===`, response);
      
      if (!response.success) {
        throw new Error(response.error || `Failed to ${editMode ? 'update' : 'create'} listing`);
      }

      // Success message and redirect
      alert(`Listing ${editMode ? 'updated' : 'created'} successfully!`);
      navigate('/listings-overview');

    } catch (error) {
      console.error(`=== ${editMode ? 'UPDATE' : 'CREATE'} ERROR ===`, error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || `Failed to ${editMode ? 'update' : 'create'} listing. Please try again.`
      }));
    } finally {
      console.log(`=== ${editMode ? 'UPDATE' : 'CREATE'} FINISHED ===`);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{errors.submit}</p>
        </div>
      )}
      
      {/* Food Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Food Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={`w-full p-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
          placeholder="e.g., Fresh Baked Bread"
          required
        />
        {errors.name && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className={`w-full p-2 border rounded-lg ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
          placeholder="Describe your food item..."
          rows="3"
          required
        />
        {errors.description && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Quantity and Price/Donation Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Quantity *
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded-lg ${errors.quantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
            placeholder="Number of items"
            min="1"
            required
          />
          {errors.quantity && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.quantity}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Price Setting
          </label>
          <div className="flex items-center space-x-4 mt-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isDonation}
                onChange={e => setIsDonation(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                Mark as Donation
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Price Fields */}
      {!isDonation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Original Price (R) *
            </label>
            <input
              type="number"
              name="original_price"
              value={formData.original_price}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-lg ${errors.original_price ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
              placeholder="0.00"
              step="0.01"
              min="0"
              required={!isDonation}
            />
            {errors.original_price && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.original_price}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Discounted Price (R) *
            </label>
            <input
              type="number"
              name="discounted_price"
              value={formData.discounted_price}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-lg ${errors.discounted_price ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
              placeholder="0.00"
              step="0.01"
              min="0"
              required={!isDonation}
            />
            {errors.discounted_price && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.discounted_price}</p>}
          </div>
        </div>
      )}

      {/* Expiration Date and Pickup Time Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Expiration Date *
          </label>
          <input
            type="date"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded-lg ${errors.expiry_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
            min={new Date().toISOString().split('T')[0]}
            required
          />
          {errors.expiry_date && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.expiry_date}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Pickup Time Range *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              name="pickup_start_time"
              value={formData.pickup_start_time}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-lg ${errors.pickup_start_time ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
              required
            />
            <input
              type="time"
              name="pickup_end_time"
              value={formData.pickup_end_time}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-lg ${errors.pickup_end_time ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
              required
            />
          </div>
          {formData.pickup_start_time && formData.pickup_end_time && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Pickup window: {formData.pickup_start_time}-{formData.pickup_end_time}
            </p>
          )}
          {(errors.pickup_start_time || errors.pickup_end_time) && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">
              {errors.pickup_start_time || errors.pickup_end_time}
            </p>
          )}
        </div>
      </div>

      {/* Pickup Location Section - Only show in create mode */}
      {!editMode && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <MapPinIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Pickup Location Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Pickup Address *
              </label>
              <input
                type="text"
                name="pickup_address"
                value={formData.pickup_address}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg ${errors.pickup_address ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
                placeholder="Complete pickup address"
                required
              />
              {errors.pickup_address && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.pickup_address}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Pickup Instructions
              </label>
              <textarea
                name="pickup_instructions"
                value={formData.pickup_instructions}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Special instructions for pickup (e.g., 'Use back entrance', 'Ask at counter')"
                rows="2"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Contact Person *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="pickup_contact_person"
                    value={formData.pickup_contact_person}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-lg ${errors.pickup_contact_person ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
                    placeholder="Contact person name"
                    required
                  />
                  <UserIcon className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                {errors.pickup_contact_person && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.pickup_contact_person}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Contact Phone *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="pickup_contact_phone"
                    value={formData.pickup_contact_phone}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-lg ${errors.pickup_contact_phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
                    placeholder="+27123456789"
                    required
                  />
                  <PhoneIcon className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                {errors.pickup_contact_phone && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.pickup_contact_phone}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduling Section - Only show in create mode */}
      {!editMode && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <ClockIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Scheduling Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Total Time Slots
              </label>
              <select
                name="total_slots"
                value={formData.total_slots}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="2">2 slots</option>
                <option value="3">3 slots</option>
                <option value="4">4 slots</option>
                <option value="5">5 slots</option>
                <option value="6">6 slots</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Max Orders per Slot
              </label>
              <select
                name="max_orders_per_slot"
                value={formData.max_orders_per_slot}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="1">1 order</option>
                <option value="2">2 orders</option>
                <option value="3">3 orders</option>
                <option value="5">5 orders</option>
                <option value="10">10 orders</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Buffer Time (minutes)
              </label>
              <select
                name="slot_buffer_minutes"
                value={formData.slot_buffer_minutes}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="20">20 minutes</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          {editMode ? 'Update Image (Optional)' : 'Upload Image (Optional)'}
        </label>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center bg-white dark:bg-gray-900 transition-colors duration-300">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center cursor-pointer"
          >
            {imagePreview ? (
              <div className="relative w-full max-w-xs">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setImagePreview(null);
                    setFormData(prev => ({ ...prev, image: null }));
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 dark:hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Drag and drop an image, or{' '}
                  <span className="text-blue-600 dark:text-blue-400">browse</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 5MB</p>
              </>
            )}
          </label>
          {errors.image && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.image}</p>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => navigate('/listings-overview')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {editMode ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            editMode ? 'Update Listing' : 'Publish Listing'
          )}
        </button>
      </div>
    </form>
  );
}
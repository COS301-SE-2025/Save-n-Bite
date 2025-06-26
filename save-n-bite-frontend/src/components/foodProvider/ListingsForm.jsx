import React, { useState, useEffect } from 'react';
import { CalendarIcon, ImageIcon, ClockIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import foodListingsAPI from '../../services/foodListingsAPI';
import schedulingAPI from '../../services/schedulingAPI';

export function ListingForm() {
  const navigate = useNavigate();
  const [isDonation, setIsDonation] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Check if user is a verified provider
    const storedUserData = localStorage.getItem('userData');
    console.log('Stored user data:', storedUserData); // Debug log
    if (storedUserData) {
      const user = JSON.parse(storedUserData);
      setUserData(user);
      
      // Check provider status
      if (user.user_type !== 'provider') {
        setErrors(prev => ({
          ...prev,
          submit: 'Only verified providers can create listings. Please contact support if you believe this is an error.'
        }));
      } else if (user.profile?.status === 'pending_verification') {
        setErrors(prev => ({
          ...prev,
          submit: 'Your provider account is pending verification. You will be able to create listings once your account is verified.'
        }));
      }
    } else {
      setErrors(prev => ({
        ...prev,
        submit: 'Please log in as a provider to create listings.'
      }));
    }
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    original_price: '',
    discounted_price: '',
    expiry_date: '',
    pickup_window: '',
    image: null
  });

  const [imagePreview, setImagePreview] = useState(null);

  const validateField = (name, value) => {
    if (!value) {
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
    console.log('Input changed:', name, value); // Debug log
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
    console.log('Form submitted'); // Debug log
    console.log('Form data:', formData); // Debug log
    console.log('User data:', userData); // Debug log
    
    setIsSubmitting(true);

    // Check if user is a verified provider
    if (!userData || userData.user_type !== 'provider') {
      console.log('User is not a provider'); // Debug log
      setErrors(prev => ({
        ...prev,
        submit: 'Only verified providers can create listings. Please contact support if you believe this is an error.'
      }));
      setIsSubmitting(false);
      return;
    }

    // Check provider verification status
    if (userData.profile?.status === 'pending_verification') {
      setErrors(prev => ({
        ...prev,
        submit: 'Your provider account is pending verification. You will be able to create listings once your account is verified.'
      }));
      setIsSubmitting(false);
      return;
    }

    // Validate all required fields
    const requiredFields = ['name', 'description', 'quantity', 'expiry_date', 'pickup_window'];
    const isValid = requiredFields.every(field => validateField(field, formData[field]));
    console.log('Form validation:', isValid); // Debug log

    if (!isValid) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Format the date to YYYY-MM-DD
      const expiryDate = new Date(formData.expiry_date);
      const formattedDate = expiryDate.toISOString().split('T')[0];

      // Format the data according to the API's expected structure
      const listingData = {
        name: formData.name,
        description: formData.description,
        food_type: 'ready_to_eat',
        original_price: isDonation ? 0 : parseFloat(formData.original_price),
        discounted_price: isDonation ? 0 : parseFloat(formData.discounted_price),
        quantity: parseInt(formData.quantity),
        expiry_date: formattedDate,
        pickup_window: formData.pickup_window,
        allergens: [],
        dietary_info: [],
        is_available: true,
        status: 'active'
      };

      // If there's an image, convert it to base64
      if (formData.image) {
        const reader = new FileReader();
        reader.readAsDataURL(formData.image);
        reader.onloadend = async () => {
          const base64data = reader.result;
          listingData.imageUrl = base64data;
          
          console.log('Sending listing data:', listingData); // Debug log
          const response = await foodListingsAPI.createListing(listingData);
          console.log('API response:', response); // Debug log
          
          if (response.success) {
            // Create pickup location after listing is created
            const locationData = {
              name: `${formData.name} Pickup Location`,
              address: userData?.profile?.business_address || 'Unknown Address',
              instructions: 'Collect at the main counter',
              contact_person: userData?.profile?.business_name || 'Business Staff',
              contact_phone: '+27123456789', // Mocked phone
              latitude: '-26.2041', // Mocked latitude
              longitude: '28.0473' // Mocked longitude
            };
            try {
              const locationResponse = await schedulingAPI.createPickupLocation(locationData);
              console.log('Pickup location creation response:', locationResponse);
            } catch (err) {
              console.error('Failed to create pickup location:', err);
            }
            navigate('/listings-overview');
          } else {
            setErrors(prev => ({
              ...prev,
              submit: response.error || 'Failed to create listing. Please try again.'
            }));
          }
          setIsSubmitting(false);
        };
      } else {
        console.log('Sending listing data:', listingData); // Debug log
        const response = await foodListingsAPI.createListing(listingData);
        console.log('API response:', response); // Debug log
        
        if (response.success) {
          // Create pickup location after listing is created
          const locationData = {
            name: `${formData.name} Pickup Location`,
            address: userData?.profile?.business_address || 'Unknown Address',
            instructions: 'Collect at the main counter',
            contact_person: userData?.profile?.business_name || 'Business Staff',
            contact_phone: '+27123456789', // Mocked phone
            latitude: '-26.2041', // Mocked latitude
            longitude: '28.0473' // Mocked longitude
          };
          try {
            const locationResponse = await schedulingAPI.createPickupLocation(locationData);
            console.log('Pickup location creation response:', locationResponse);
          } catch (err) {
            console.error('Failed to create pickup location:', err);
          }
          navigate('/listings-overview');
        } else {
          setErrors(prev => ({
            ...prev,
            submit: response.error || 'Failed to create listing. Please try again.'
          }));
        }
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.response?.data?.message || 'Failed to create listing. Please try again.'
      }));
      setIsSubmitting(false);
    }
  };

  // Format price to display with R symbol
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'R0.00';
    return `R${parseFloat(price).toFixed(2)}`;
  };

  // Format date to display in South African format
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-3xl">
      {errors.submit && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{errors.submit}</p>
        </div>
      )}
      <div className="space-y-6">
        {/* Food Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Food Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="e.g., Fresh Baked Bread"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded-lg ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Describe your food item..."
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Quantity and Price/Donation Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-lg ${errors.quantity ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Number of items"
            />
            {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Setting
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isDonation}
                  onChange={e => setIsDonation(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Mark as Donation
                </span>
              </label>
              {!isDonation && (
                <input
                  type="number"
                  name="original_price"
                  value={formData.original_price}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-lg ${errors.original_price ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="0.00"
                  step="0.00"
                  min="0"
                />
              )}
            </div>
          </div>
        </div>

        {/* Price Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Price (R)
            </label>
            <input
              type="number"
              name="original_price"
              value={formData.original_price}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-lg ${errors.original_price ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="0.00"
              step="0.01"
              min="0"
              disabled={isDonation}
            />
            {errors.original_price && <p className="text-red-500 text-sm mt-1">{errors.original_price}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discounted Price (R)
            </label>
            <input
              type="number"
              name="discounted_price"
              value={formData.discounted_price}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-lg ${errors.discounted_price ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="0.00"
              step="0.01"
              min="0"
              disabled={isDonation}
            />
            {errors.discounted_price && <p className="text-red-500 text-sm mt-1">{errors.discounted_price}</p>}
          </div>
        </div>

        {/* Expiration Date and Pickup Time Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date
            </label>
            <div className="relative">
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg ${errors.expiry_date ? 'border-red-500' : 'border-gray-300'}`}
                min={new Date().toISOString().split('T')[0]} // Set minimum date to today
              />
              <CalendarIcon className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
            {errors.expiry_date && <p className="text-red-500 text-sm mt-1">{errors.expiry_date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Time Range
            </label>
            <div className="relative">
              <input
                type="text"
                name="pickup_window"
                value={formData.pickup_window}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg ${errors.pickup_window ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., 9:00 AM - 12:00 PM"
              />
              <ClockIcon className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
            {errors.pickup_window && <p className="text-red-500 text-sm mt-1">{errors.pickup_window}</p>}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Image
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Drag and drop an image, or{' '}
                    <span className="text-blue-600">browse</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                </>
              )}
            </label>
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Publish Listing'}
          </button>
        </div>
      </div>
    </form>
  );
}

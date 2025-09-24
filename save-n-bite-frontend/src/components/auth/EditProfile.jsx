import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  SaveIcon,
  UserIcon,
  CheckCircleIcon,
  XIcon,
  BuildingIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CustomerNavBar from './CustomerNavBar';
import ProfileAPI from '../../services/ProfileAPI';

// Placeholder image for users without profile pictures
const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user: authUser, updateUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Load user profile data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        const profileAPI = new ProfileAPI();
        const result = await profileAPI.getMyProfile();

        if (result.success && result.data) {
          const userDetails = result.data.user_details;
          
          // Format data based on user type
          let formattedData = {
            id: userDetails.id,
            email: userDetails.email,
            phone_number: userDetails.phone_number || '',
            user_type: userDetails.user_type,
          };

          if (userDetails.user_type === 'customer') {
            formattedData = {
              ...formattedData,
              full_name: userDetails.full_name || '',
              profile_image: userDetails.profile_image,
            };
          } else if (userDetails.user_type === 'ngo') {
            formattedData = {
              ...formattedData,
              representative_name: userDetails.full_name || '',
              organisation_name: userDetails.organisation_name || '',
              organisation_contact: userDetails.organisation_contact || '',
              organisation_email: userDetails.organisation_email || '',
              organisation_logo: userDetails.organisation_logo,
            };
          } else if (userDetails.user_type === 'provider') {
            formattedData = {
              ...formattedData,
              business_name: userDetails.business_name || '',
              business_email: userDetails.business_email || '',
              business_contact: userDetails.business_contact || '',
              business_address: userDetails.business_address || '',
              logo: userDetails.logo,
            };
          }

          setUserData(formattedData);
          setOriginalData(formattedData);
          setAvatarPreview(getProfileImageUrl(formattedData));
          setLoadError(null);
        } else {
          setLoadError(result.error || 'Failed to load profile data');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setLoadError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser) {
      loadProfileData();
    }
  }, [authUser]);

  // Helper function to get profile image URL based on user type
  const getProfileImageUrl = (data) => {
    if (!data) return PLACEHOLDER_AVATAR;
    
    if (data.user_type === 'customer' && data.profile_image) {
      return data.profile_image;
    } else if (data.user_type === 'ngo' && data.organisation_logo) {
      return data.organisation_logo;
    } else if (data.user_type === 'provider' && data.logo) {
      return data.logo;
    }
    return PLACEHOLDER_AVATAR;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, avatar: 'Image must be less than 5MB' }));
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, avatar: 'Please select a valid image file' }));
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear avatar error
      if (errors.avatar) {
        setErrors(prev => ({ ...prev, avatar: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Common validations
    if (!userData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // User type specific validations
    if (userData.user_type === 'customer') {
      if (!userData.full_name?.trim()) newErrors.full_name = 'Full name is required';
    } else if (userData.user_type === 'ngo') {
      if (!userData.representative_name?.trim()) newErrors.representative_name = 'Representative name is required';
      if (!userData.organisation_name?.trim()) newErrors.organisation_name = 'Organization name is required';
      if (!userData.organisation_email?.trim()) {
        newErrors.organisation_email = 'Organization email is required';
      } else if (!/\S+@\S+\.\S+/.test(userData.organisation_email)) {
        newErrors.organisation_email = 'Organization email is invalid';
      }
      if (!userData.organisation_contact?.trim()) newErrors.organisation_contact = 'Organization contact is required';
    } else if (userData.user_type === 'provider') {
      if (!userData.business_name?.trim()) newErrors.business_name = 'Business name is required';
      if (!userData.business_email?.trim()) {
        newErrors.business_email = 'Business email is required';
      } else if (!/\S+@\S+\.\S+/.test(userData.business_email)) {
        newErrors.business_email = 'Business email is invalid';
      }
      if (!userData.business_contact?.trim()) newErrors.business_contact = 'Business contact is required';
      if (!userData.business_address?.trim()) newErrors.business_address = 'Business address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const profileAPI = new ProfileAPI();
      
      // Prepare update data
      let updateData = {
        email: userData.email,
        phone_number: userData.phone_number,
        // Important: include user_type so ProfileAPI can attach the correct fields
        user_type: userData.user_type,
      };

      // Add user type specific fields
      if (userData.user_type === 'customer') {
        updateData.full_name = userData.full_name;
        if (avatarFile) {
          updateData.profile_image = await convertFileToBase64(avatarFile);
        }
      } else if (userData.user_type === 'ngo') {
        updateData.representative_name = userData.representative_name;
        updateData.organisation_contact = userData.organisation_contact;
        updateData.organisation_email = userData.organisation_email;
        if (avatarFile) {
          updateData.organisation_logo = await convertFileToBase64(avatarFile);
        }
        // Note: organization_name might not be editable after registration for verification reasons
      } else if (userData.user_type === 'provider') {
        updateData.business_name = userData.business_name;
        updateData.business_email = userData.business_email;
        updateData.business_contact = userData.business_contact;
        updateData.business_address = userData.business_address;
        if (avatarFile) {
          updateData.logo = await convertFileToBase64(avatarFile);
        }
      }

      const result = await profileAPI.updateMyProfile(updateData);

      if (result.success) {
        // Update auth context
        if (updateUser && result.data?.user) {
          updateUser(result.data.user);
        }
        
        setShowSuccessModal(true);
      } else {
        setErrors({ submit: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ submit: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const closeModalAndNavigate = () => {
    setShowSuccessModal(false);
    navigate('/profile');
  };

  const renderFormFields = () => {
    if (!userData) return null;

    switch (userData.user_type) {
      case 'customer':
        return (
          <>
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={userData.full_name || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${
                  errors.full_name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400`}
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={userData.email || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${
                  errors.email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone_number"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Phone Number
              </label>
              <input
                type="text"
                id="phone_number"
                name="phone_number"
                value={userData.phone_number || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
                placeholder="Optional"
              />
            </div>
          </>
        );

      case 'ngo':
        return (
          <>
            <div>
              <label
                htmlFor="representative_name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Representative Name
              </label>
              <input
                type="text"
                id="representative_name"
                name="representative_name"
                value={userData.representative_name || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${
                  errors.representative_name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400`}
              />
              {errors.representative_name && (
                <p className="mt-1 text-sm text-red-500">{errors.representative_name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="organisation_name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center"
              >
                <BuildingIcon className="h-4 w-4 mr-2" />
                Organization Name
              </label>
              <input
                type="text"
                id="organisation_name"
                name="organisation_name"
                value={userData.organisation_name || ''}
                onChange={handleChange}
                disabled // Usually can't change org name after registration
                className={`w-full px-4 py-2 bg-gray-100 dark:bg-gray-600 border ${
                  errors.organisation_name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } text-gray-900 dark:text-white rounded-md cursor-not-allowed`}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Organization name cannot be changed after registration
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center"
              >
                <MailIcon className="h-4 w-4 mr-2" />
                Personal Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={userData.email || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${
                  errors.email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="organisation_email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center"
              >
                <MailIcon className="h-4 w-4 mr-2" />
                Organization Email
              </label>
              <input
                type="email"
                id="organisation_email"
                name="organisation_email"
                value={userData.organisation_email || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${
                  errors.organisation_email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400`}
              />
              {errors.organisation_email && (
                <p className="mt-1 text-sm text-red-500">{errors.organisation_email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="organisation_contact"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center"
              >
                <PhoneIcon className="h-4 w-4 mr-2" />
                Organization Contact
              </label>
              <input
                type="text"
                id="organisation_contact"
                name="organisation_contact"
                value={userData.organisation_contact || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${
                  errors.organisation_contact
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400`}
              />
              {errors.organisation_contact && (
                <p className="mt-1 text-sm text-red-500">{errors.organisation_contact}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone_number"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center"
              >
                <PhoneIcon className="h-4 w-4 mr-2" />
                Personal Phone Number
              </label>
              <input
                type="text"
                id="phone_number"
                name="phone_number"
                value={userData.phone_number || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
                placeholder="Optional"
              />
            </div>
          </>
        );

      case 'provider':
        return (
          <>
            <div>
              <label
                htmlFor="business_name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center"
              >
                <BuildingIcon className="h-4 w-4 mr-2" />
                Business Name
              </label>
              <input
                type="text"
                id="business_name"
                name="business_name"
                value={userData.business_name || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${
                  errors.business_name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400`}
              />
              {errors.business_name && (
                <p className="mt-1 text-sm text-red-500">{errors.business_name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center"
              >
                <MailIcon className="h-4 w-4 mr-2" />
                Personal Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={userData.email || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${
                  errors.email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="business_email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center"
              >
                <MailIcon className="h-4 w-4 mr-2" />
                Business Email
              </label>
              <input
                type="email"
                id="business_email"
                name="business_email"
                value={userData.business_email || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${
                  errors.business_email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400`}
              />
              {errors.business_email && (
                <p className="mt-1 text-sm text-red-500">{errors.business_email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="business_contact"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center"
              >
                <PhoneIcon className="h-4 w-4 mr-2" />
                Business Contact
              </label>
              <input
                type="text"
                id="business_contact"
                name="business_contact"
                value={userData.business_contact || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${
                  errors.business_contact
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400`}
              />
              {errors.business_contact && (
                <p className="mt-1 text-sm text-red-500">{errors.business_contact}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="business_address"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center"
              >
                <MapPinIcon className="h-4 w-4 mr-2" />
                Business Address
              </label>
              <textarea
                id="business_address"
                name="business_address"
                rows={3}
                value={userData.business_address || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${
                  errors.business_address
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400`}
              />
              {errors.business_address && (
                <p className="mt-1 text-sm text-red-500">{errors.business_address}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone_number"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center"
              >
                <PhoneIcon className="h-4 w-4 mr-2" />
                Personal Phone Number
              </label>
              <input
                type="text"
                id="phone_number"
                name="phone_number"
                value={userData.phone_number || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
                placeholder="Optional"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full py-8 transition-colors duration-200">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-200">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full py-8 transition-colors duration-200">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full py-8 transition-colors duration-200">
      <CustomerNavBar />
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/profile')}
            className="mr-4 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            <ArrowLeftIcon size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Edit Profile
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={handleSubmit}>
            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-sm">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                      <UserIcon
                        size={48}
                        className="text-gray-400 dark:text-gray-500"
                      />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-emerald-600 dark:bg-emerald-500 text-white p-2 rounded-full cursor-pointer hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
                >
                  <UserIcon size={16} />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Click the icon to upload a new {userData?.user_type === 'customer' ? 'profile picture' : 'logo'} (max 5MB)
              </p>
              {errors.avatar && (
                <p className="mt-2 text-sm text-red-500">{errors.avatar}</p>
              )}
            </div>

            {/* User Type Indicator */}
            <div className="text-center mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                {userData?.user_type === 'customer' && (
                  <>
                    <UserIcon className="h-4 w-4 mr-2" />
                    Individual Consumer
                  </>
                )}
                {userData?.user_type === 'ngo' && (
                  <>
                    <BuildingIcon className="h-4 w-4 mr-2" />
                    Non-Profit Organization
                  </>
                )}
                {userData?.user_type === 'provider' && (
                  <>
                    <BuildingIcon className="h-4 w-4 mr-2" />
                    Food Provider
                  </>
                )}
              </span>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {renderFormFields()}

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isSaving ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon size={18} className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 animate-fade-in-up relative">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <CheckCircleIcon className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Profile Updated Successfully!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your profile information has been updated.
              </p>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={closeModalAndNavigate}
                  className="px-6 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
                >
                  Continue to Profile
                </button>
              </div>
            </div>
            <button
              onClick={closeModalAndNavigate}
              className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfilePage;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  SaveIcon,
  UserIcon,
  CheckCircleIcon,
  XIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';


const initialUserData = {
  name: 'Sarah Johnson',
  email: 'sarah@example.com',
  phone: '072 123 4567',
  address: '123 Green Street, Eco City, EC 12345',
  avatar:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
  userType: 'customer',
  bio: 'Passionate about reducing food waste and supporting local businesses.',
};

const EditProfilePage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(initialUserData);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(initialUserData.avatar);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { updateUser } = useAuth();
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!userData.name.trim()) newErrors.name = 'Name is required';
    if (!userData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!userData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!userData.address.trim()) newErrors.address = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const updatedProfile = {
        ...userData,
        avatar: avatarPreview,
      };

      updateUser(updatedProfile);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const closeModalAndNavigate = () => {
    setShowSuccessModal(false);
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full py-8 transition-colors duration-200">
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
                Click the icon to upload a new profile picture
              </p>
            </div>

            {/* Personal Info */}
            <div className="space-y-6">
              {['name', 'email', 'phone', 'address'].map((field) => (
                <div key={field}>
                  <label
                    htmlFor={field}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {field === 'name'
                      ? 'Full Name'
                      : field === 'email'
                      ? 'Email Address'
                      : field === 'phone'
                      ? 'Phone Number'
                      : 'Address'}
                  </label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    id={field}
                    name={field}
                    value={userData[field]}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${
                      errors[field]
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    } text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400`}
                  />
                  {errors[field] && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors[field]}
                    </p>
                  )}
                </div>
              ))}
              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Bio (Optional)
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={userData.bio}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
                  placeholder="Tell us a bit about yourself..."
                />
              </div>

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
                  disabled={isLoading}
                  className="px-6 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors flex items-center"
                >
                  {isLoading ? (
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

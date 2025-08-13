
import React, { useState, useContext } from 'react'
import { AlertCircleIcon, CheckIcon, XIcon, InfoIcon, EyeIcon, EyeOffIcon, Menu } from 'lucide-react'

import { useNavigate } from 'react-router-dom'
import SideBar from '../../components/foodProvider/SideBar';
import { ThemeContext } from '../../context/ThemeContext' // <-- Import ThemeContext

function SettingsPage() {
const { theme, toggleTheme } = useContext(ThemeContext)
const darkMode = theme === 'dark'
  const navigate = useNavigate()
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    newOrders: true,
    pickupConfirmations: true,
    donationRequests: true,
    allInApp: true,
  })


  const [communicationPrefs, setCommunicationPrefs] = useState({
    platformAnnouncements: true,
    appFeedback: true,
  })

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData({
      ...passwordData,
      [name]: value,
    })
    // Clear errors when user starts typing
    if (name === 'newPassword' || name === 'confirmPassword') {
      setPasswordErrors({
        ...passwordErrors,
        [name]: '',
      })
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    })
  }

  const validatePassword = () => {
    let isValid = true
    const newErrors = {
      newPassword: '',
      confirmPassword: '',
    }
    // Password strength regex: at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(passwordData.newPassword)) {
      newErrors.newPassword =
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
      isValid = false
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
      isValid = false
    }
    setPasswordErrors(newErrors)
    return isValid
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    // Validate password
    if (!validatePassword()) {
      return
    }
    //  call an API to change the password
    setSuccessMessage('Password changed successfully')
    setShowSuccessModal(true)
    // Reset form after successful submission
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  }

  const toggleNotification = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    })
  }

  const toggleAllNotifications = () => {
    const newValue = !notificationSettings.allInApp
    setNotificationSettings({
      newOrders: newValue,
      pickupConfirmations: newValue,
      donationRequests: newValue,
      allInApp: newValue,
    })
  }

  const toggleCommunicationPref = (pref) => {
    setCommunicationPrefs({
      ...communicationPrefs,
      [pref]: !communicationPrefs[pref],
    })
  }

  const handleDeactivateAccount = () => {
    setShowDeleteModal(false)
    setShowDeactivatedModal(true)
    // call an API to deactivate the account
   
    setTimeout(() => {
      navigate('/login') 
    }, 3000)
  }

  

  return (
    <div className={`w-full flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:flex">
        <SideBar onNavigate={() => {}} currentPage="settings" />
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
              onNavigate={() => setIsMobileSidebarOpen(false)} 
              currentPage="settings"
              onClose={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between transition-colors duration-300">
          <button
            onClick={toggleMobileSidebar}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-300"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
          <div className="w-10" />
        </div>

        <div className="max-w-3xl mx-auto p-4 sm:p-6">
          {/* General Settings Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6 sm:mb-8 transition-colors duration-300">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">General Settings</h2>
              {/* Change Password Form */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-medium mb-4 text-gray-800 dark:text-gray-100">Change Password</h3>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.currentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-700 rounded-md pr-10 text-sm sm:text-base bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('currentPassword')}
                        className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showPasswords.currentPassword ? (
                          <EyeOffIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.newPassword ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        className={`w-full p-2 sm:p-3 border rounded-md pr-10 text-sm sm:text-base ${passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('newPassword')}
                        className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showPasswords.newPassword ? (
                          <EyeOffIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Password must be at least 8 characters and include uppercase,
                      lowercase, number, and special character.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        className={`w-full p-2 sm:p-3 border rounded-md pr-10 text-sm sm:text-base ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirmPassword')}
                        className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showPasswords.confirmPassword ? (
                          <EyeOffIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm sm:text-base"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Notification Preferences Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6 sm:mb-8 transition-colors duration-300">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                Notification Preferences
              </h2>
              <div className="space-y-4">
                <div className="flex items-start sm:items-center justify-between">
                  <div className="flex-1 mr-4">
                    <h3 className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-100">New Orders</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                      Get notified when you receive a new order
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={notificationSettings.newOrders}
                      onChange={() => toggleNotification('newOrders')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-900 after:border-gray-300 dark:after:border-gray-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-700"></div>
                  </label>
                </div>
                <div className="flex items-start sm:items-center justify-between">
                  <div className="flex-1 mr-4">
                    <h3 className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-100">Pickup Confirmations</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                      Get notified when an order is picked up
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={notificationSettings.pickupConfirmations}
                      onChange={() => toggleNotification('pickupConfirmations')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-900 after:border-gray-300 dark:after:border-gray-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-700"></div>
                  </label>
                </div>
                <div className="flex items-start sm:items-center justify-between">
                  <div className="flex-1 mr-4">
                    <h3 className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-100">Donation Requests</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                      Get notified about new donation requests
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={notificationSettings.donationRequests}
                      onChange={() => toggleNotification('donationRequests')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-900 after:border-gray-300 dark:after:border-gray-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-700"></div>
                  </label>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex items-start sm:items-center justify-between">
                  <div className="flex-1 mr-4">
                    <h3 className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-100">All In-App Notifications</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                      Master toggle for all notifications
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={notificationSettings.allInApp}
                      onChange={toggleAllNotifications}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-900 after:border-gray-300 dark:after:border-gray-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-700"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6 sm:mb-8 transition-colors duration-300">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Appearance</h2>
              <div className="flex items-start sm:items-center justify-between">
                <div className="flex-1 mr-4">
                  <h3 className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-100">Dark Mode</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Switch between light and dark themes
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={toggleTheme}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-900 after:border-gray-300 dark:after:border-gray-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-700"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Communication Preferences Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6 sm:mb-8 transition-colors duration-300">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                Communication Preferences
              </h2>
              <div className="space-y-4">
                <div className="flex items-start sm:items-center justify-between">
                  <div className="flex-1 mr-4">
                    <h3 className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-100">Platform Announcements</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                      Receive updates about new features and platform changes
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={communicationPrefs.platformAnnouncements}
                      onChange={() =>
                        toggleCommunicationPref('platformAnnouncements')
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-700"></div>
                  </label>
                </div>
                <div className="flex items-start sm:items-center justify-between">
                  <div className="flex-1 mr-4">
                    <h3 className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-100">App Feedback</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                      Allow Save 'n Bite to contact me for app feedback
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={communicationPrefs.appFeedback}
                      onChange={() => toggleCommunicationPref('appFeedback')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-700"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Account Deactivation - Moved to the end */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6 sm:mb-8 transition-colors duration-300">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
                Account Deactivation
              </h2>
              <div className="bg-red-50 dark:bg-red-900 p-3 sm:p-4 rounded-md mb-4">
                <p className="text-red-700 dark:text-red-300 text-sm sm:text-base">
                  Deactivating your account will remove your business from the
                  platform. All your data will be preserved if you decide to
                  reactivate in the future.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                Deactivate Account
              </button>
            </div>
          </div>

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full">
                <div className="flex items-center mb-4 text-green-600">
                  <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">Success</h3>
                </div>
                <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600 dark:text-gray-300">{successMessage}</p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm sm:text-base"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Account Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full">
                <div className="flex items-center mb-4 text-red-600">
                  <AlertCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">
                    Confirm Account Deactivation
                  </h3>
                </div>
                <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Are you sure you want to deactivate your account? This action will
                  remove your business from the platform and you will no longer
                  receive orders or donation requests.
                </p>
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeactivateAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center text-sm sm:text-base"
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Deactivate Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Deactivated Success Modal */}
          {showDeactivatedModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full">
                <div className="flex items-center mb-4 text-green-600">
                  <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">
                    Account Deactivated Successfully
                  </h3>
                </div>
                <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Your account has been deactivated. You will be redirected to the
                  login page in a few seconds.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full animate-[grow_3s_ease-in-out]"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
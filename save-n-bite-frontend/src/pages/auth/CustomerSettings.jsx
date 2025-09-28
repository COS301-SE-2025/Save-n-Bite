import React, { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'

import {
  KeyIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  MailIcon,
  TrashIcon,
  SmartphoneIcon,
  LogOutIcon,
  XIcon,
  AlertTriangleIcon,
  CheckIcon,
  InfoIcon,
  PauseCircleIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CustomerNavBar from '../../components/auth/CustomerNavBar'
const Modal = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null
  return (
    
    <div className="fixed inset-0 z-50 overflow-y-auto">
        
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        ></div>
        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    {title}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-2">{children}</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {actions}
          </div>
        </div>
      </div>
    </div>
  )
}
const InfoTooltip = ({ content }) => {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        aria-label="More information"
      >
        <InfoIcon className="h-4 w-4" />
      </button>
      {isVisible && (
        <div className="absolute z-10 w-72 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 rounded-md shadow-lg p-3 border border-gray-200 dark:border-gray-700 bottom-full mb-2 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            {content}
            <div className="absolute w-3 h-3 bg-white dark:bg-gray-800 transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1.5 border-r border-b border-gray-200 dark:border-gray-700"></div>
          </div>
        </div>
      )}
    </div>
  )
}
const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('general')
  const navigate = useNavigate()
  // Form states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  // Modal states
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)
  const [isDeactivateAccountModalOpen, setIsDeactivateAccountModalOpen] =
    useState(false)
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false)
  const [actionSuccess, setActionSuccess] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  // Notification preferences
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    pickupReminders: true,
    messages: true,
    marketingEmails: false,
    appFeedback: true,
    inAppNotifications: true,
  })
  const handleNotificationChange = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }
  const handlePasswordChange = (e) => {
    e.preventDefault()
    // Password change logic would go here
    setActionSuccess(true)
    setActionMessage('Password updated successfully!')
    setTimeout(() => {
      setActionSuccess(false)
      setActionMessage('')
    }, 3000)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }
  const handleSignOutAllDevices = () => {
    // Sign out logic would go here
    setIsSignOutModalOpen(false)
    setActionSuccess(true)
    setActionMessage('You have been signed out from all devices')
    setTimeout(() => {
      setActionSuccess(false)
      setActionMessage('')
    }, 3000)
  }
  const handleAccountDeactivation = () => {
    // Account deactivation logic would go here
    setIsDeactivateAccountModalOpen(false)
    setActionSuccess(true)
    setActionMessage('Your account has been deactivated')
    setTimeout(() => {
      setActionSuccess(false)
      setActionMessage('')
      // In a real app, this would redirect to the homepage or login page
      navigate('/')
    }, 3000)
  }
  const handleAccountDeletion = () => {
    // Account deletion logic would go here
    setIsDeleteAccountModalOpen(false)
    setActionSuccess(true)
    setActionMessage('Your account has been permanently deleted')
    setTimeout(() => {
      setActionSuccess(false)
      setActionMessage('')
      // In a real app, this would redirect to the homepage or login page
      navigate('/')
    }, 3000)
  }
  return (
<div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full pt-20 pb-8 transition-colors duration-200">
  <div className="fixed top-0 left-0 right-0 z-40">
    <CustomerNavBar />
  </div>
  <div className="max-w-4xl mx-auto px-4">
      <br></br>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">
  <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Settings</span>
</h1>
<br></br>
  
        {/* Success message toast */}
        {actionSuccess && (
          <div className="fixed top-20 right-4 z-50 bg-emerald-100 dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-md shadow-md flex items-center">
            <CheckIcon className="h-5 w-5 mr-2" />
            {actionMessage}
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Settings Navigation */}
          <div className="w-full md:w-1/3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <nav className="space-y-1">
                
                <button
                  onClick={() => setActiveSection('notifications')}
                  className={`w-full flex items-center px-4 py-3 rounded-md transition-colors ${activeSection === 'notifications' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <BellIcon className="h-5 w-5 mr-3" />
                  <span>Notifications</span>
                </button>
                <button
                  onClick={() => setActiveSection('appearance')}
                  className={`w-full flex items-center px-4 py-3 rounded-md transition-colors ${activeSection === 'appearance' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  {theme === 'dark' ? (
                    <MoonIcon className="h-5 w-5 mr-3" />
                  ) : (
                    <SunIcon className="h-5 w-5 mr-3" />
                  )}
                  <span>Appearance</span>
                </button>
                <button
                  onClick={() => setActiveSection('communication')}
                  className={`w-full flex items-center px-4 py-3 rounded-md transition-colors ${activeSection === 'communication' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <MailIcon className="h-5 w-5 mr-3" />
                  <span>Communication</span>
                </button>
                <button
                  onClick={() => setActiveSection('account')}
                  className={`w-full flex items-center px-4 py-3 rounded-md transition-colors ${activeSection === 'account' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <TrashIcon className="h-5 w-5 mr-3" />
                  <span>Account</span>
                </button>
              </nav>
            </div>
          </div>
          {/* Settings Content */}
          <div className="w-full md:w-2/3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">

            
              {/* Notification Settings */}
              {activeSection === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                    Notification Settings
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                        Email Notifications
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-gray-700 dark:text-gray-300">
                            Order Updates
                          </span>
                          <input
                            type="checkbox"
                            checked={notifications.orderUpdates}
                            onChange={() =>
                              handleNotificationChange('orderUpdates')
                            }
                            className="h-5 w-5 text-emerald-600 dark:text-emerald-500 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500 dark:focus:ring-emerald-400"
                          />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-gray-700 dark:text-gray-300">
                            Pickup Reminders
                          </span>
                          <input
                            type="checkbox"
                            checked={notifications.pickupReminders}
                            onChange={() =>
                              handleNotificationChange('pickupReminders')
                            }
                            className="h-5 w-5 text-emerald-600 dark:text-emerald-500 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500 dark:focus:ring-emerald-400"
                          />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-gray-700 dark:text-gray-300">
                            Messages
                          </span>
                          <input
                            type="checkbox"
                            checked={notifications.messages}
                            onChange={() =>
                              handleNotificationChange('messages')
                            }
                            className="h-5 w-5 text-emerald-600 dark:text-emerald-500 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500 dark:focus:ring-emerald-400"
                          />
                        </label>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                        In-App Notifications
                      </h3>
                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300">
                          Enable In-App Notifications
                        </span>
                        <input
                          type="checkbox"
                          checked={notifications.inAppNotifications}
                          onChange={() =>
                            handleNotificationChange('inAppNotifications')
                          }
                          className="h-5 w-5 text-emerald-600 dark:text-emerald-500 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500 dark:focus:ring-emerald-400"
                        />
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button className="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors">
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Appearance Settings */}
              {activeSection === 'appearance' && (
  <div>
    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
      Appearance Settings
    </h2>
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
          Theme
        </h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center">
            {theme === 'dark' ? (
              <MoonIcon className="h-6 w-6 text-gray-600 dark:text-gray-300 mr-3" />
            ) : (
              <SunIcon className="h-6 w-6 text-gray-600 dark:text-gray-300 mr-3" />
            )}
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
          >
            Toggle Theme
          </button>
        </div>
      </div>
    </div>
  </div>
)}
              {/* Communication Preferences */}
              {activeSection === 'communication' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                    Communication Preferences
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                        Marketing Communications
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-gray-700 dark:text-gray-300">
                            Marketing Emails
                          </span>
                          <input
                            type="checkbox"
                            checked={notifications.marketingEmails}
                            onChange={() =>
                              handleNotificationChange('marketingEmails')
                            }
                            className="h-5 w-5 text-emerald-600 dark:text-emerald-500 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500 dark:focus:ring-emerald-400"
                          />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-gray-700 dark:text-gray-300">
                            App Feedback Requests
                          </span>
                          <input
                            type="checkbox"
                            checked={notifications.appFeedback}
                            onChange={() =>
                              handleNotificationChange('appFeedback')
                            }
                            className="h-5 w-5 text-emerald-600 dark:text-emerald-500 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500 dark:focus:ring-emerald-400"
                          />
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button className="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors">
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Account Settings */}
              {activeSection === 'account' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                    Account Settings
                  </h2>
                  <div className="space-y-6">
                    {/* is this something the team would want? */}
                    {/* <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                        Account Management
                      </h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => setIsSignOutModalOpen(true)}
                          className="w-full flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          <LogOutIcon className="h-4 w-4 mr-2" />
                          Sign Out of All Devices
                        </button>
                      </div>
                    </div> */}
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                     
                      <div className="space-y-4">
                     
                        {/* Delete Account */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <TrashIcon className="h-5 w-5 text-red-500 mr-2" />
                              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
                                Delete Account
                              </h4>
                            </div>
                            <InfoTooltip
                              content={
                                <div>
                                  <p className="font-medium mb-1">
                                    Account Deletion:
                                  </p>
                                  <ul className="list-disc pl-4 space-y-1">
                                    <li>
                                      All your personal information will be
                                      permanently removed
                                    </li>
                                    <li>
                                      Your order history and saved items will be
                                      deleted
                                    </li>
                                    <li>
                                      You'll lose access to all past
                                      transactions and receipts
                                    </li>
                                    <li>
                                      You'll need to create a new account if you
                                      want to use our service again
                                    </li>
                                  </ul>
                                </div>
                              }
                            />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Permanently delete your account and all associated
                            data. This action cannot be undone.
                          </p>
                          <button
                            onClick={() => setIsDeleteAccountModalOpen(true)}
                            className="w-full flex items-center justify-center px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Sign Out Modal */}
      <Modal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        title="Sign Out of All Devices"
        actions={
          <>
            <button
              onClick={handleSignOutAllDevices}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Sign Out
            </button>
            <button
              onClick={() => setIsSignOutModalOpen(false)}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          This will sign you out from all devices where you're currently logged
          in. You'll need to sign in again on each device.
        </p>
      </Modal>
      {/* Deactivate Account Modal */}
      <Modal
        isOpen={isDeactivateAccountModalOpen}
        onClose={() => setIsDeactivateAccountModalOpen(false)}
        title="Deactivate Account"
        actions={
          <>
            <button
              onClick={handleAccountDeactivation}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-500 text-base font-medium text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Deactivate
            </button>
            <button
              onClick={() => setIsDeactivateAccountModalOpen(false)}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </>
        }
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangleIcon
              className="h-6 w-6 text-amber-500"
              aria-hidden="true"
            />
          </div>
          <div className="ml-3">
            <div className="text-gray-700 dark:text-gray-300 space-y-2">
              <p>
                Are you sure you want to deactivate your account? Your account
                will be temporarily disabled.
              </p>
              <p className="font-medium">
                What happens when you deactivate your account:
              </p>
              <ul className="list-disc pl-5 text-sm">
                <li>
                  Your profile and content will be hidden from other users
                </li>
                <li>You won't receive notifications or communications</li>
                <li>Your data will be preserved and can be restored</li>
                <li>
                  You can reactivate your account at any time by logging in
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Modal>
      {/* Delete Account Modal */}
      <Modal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        title="Delete Account"
        actions={
          <>
            <button
              onClick={handleAccountDeletion}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Delete Permanently
            </button>
            <button
              onClick={() => setIsDeleteAccountModalOpen(false)}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </>
        }
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangleIcon
              className="h-6 w-6 text-red-600"
              aria-hidden="true"
            />
          </div>
          <div className="ml-3">
            <div className="text-gray-700 dark:text-gray-300 space-y-2">
              <p>
                Are you sure you want to{' '}
                <span className="font-bold text-red-600 dark:text-red-400">
                  permanently delete
                </span>{' '}
                your account? This action cannot be undone.
              </p>
              <p className="font-medium">
                What happens when you delete your account:
              </p>
              <ul className="list-disc pl-5 text-sm">
                <li>
                  All your personal information will be permanently removed
                </li>
                <li>Your order history and saved items will be deleted</li>
                <li>
                  You'll lose access to all past transactions and receipts
                </li>
                <li>
                  You'll need to create a new account if you want to use our
                  service again
                </li>
              </ul>
              <div className="pt-2">
                <p className="font-medium">Consider deactivation instead:</p>
                <p className="text-sm">
                  If you just need a break, you can temporarily deactivate your
                  account instead of deleting it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
   
  )
}
export default SettingsPage

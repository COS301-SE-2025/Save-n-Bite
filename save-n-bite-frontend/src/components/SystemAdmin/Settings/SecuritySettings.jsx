import React, { useState } from 'react'
import { toast } from 'sonner'
import { SaveIcon, ShieldIcon } from 'lucide-react'

const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword && newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    toast.success('Security settings saved')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
        <p className="mt-1 text-sm text-gray-500">
          Ensure your account is using a long, random password to stay secure.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
            Current Password
          </label>
          <input
            type="password"
            id="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            type="password"
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add additional security to your account using two-factor authentication.
        </p>
        <div className="mt-4 flex items-center">
          <button
            type="button"
            className={`${twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
          >
            <span
              className={`${twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
            />
          </button>
          <span className="ml-3 text-sm font-medium text-gray-900">
            {twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {twoFactorEnabled && (
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ShieldIcon className="mr-2 h-4 w-4" />
              Setup Two-Factor Authentication
            </button>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Login Sessions</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage and log out your active sessions on other browsers and devices.
        </p>
        <div className="mt-4 bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">Current Session</p>
              <p className="text-xs text-gray-500">Chrome on Windows • IP: 192.168.1.1</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active Now
            </span>
          </div>
        </div>
        <div className="mt-2">
          <button
            type="button"
            className="text-sm font-medium text-red-600 hover:text-red-500"
          >
            Log Out Other Sessions
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <SaveIcon className="mr-2 h-4 w-4" />
          Save Changes
        </button>
      </div>
    </form>
  )
}

export default SecuritySettings

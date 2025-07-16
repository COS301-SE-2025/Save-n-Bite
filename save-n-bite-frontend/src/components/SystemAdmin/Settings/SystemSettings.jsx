import React, { useState } from 'react'
import { toast } from 'sonner'
import { SaveIcon, DatabaseIcon } from 'lucide-react'
import InfoTooltip from '../../SystemAdmin/UI/InfoTooltip'

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    autoVerification: false,
    maxListingDuration: '7',
    disputeWindow: '3',
    requireVerification: true,
    autoArchive: true,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    toast.success('System settings saved')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">System Configuration</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure global platform settings and behavior.
        </p>
      </div>

      <div className="pt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <label htmlFor="maintenance-mode" className="block text-sm font-medium text-gray-700">
                Maintenance Mode
              </label>
              <span className="ml-1">
                <InfoTooltip
                  content="When enabled, users will see a maintenance message and cannot access the platform. Admin users can still log in."
                  position="right"
                />
              </span>
            </div>
            <button
              type="button"
              className={`${
                settings.maintenanceMode ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              onClick={() =>
                setSettings({
                  ...settings,
                  maintenanceMode: !settings.maintenanceMode,
                })
              }
            >
              <span
                className={`${
                  settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
              />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            When enabled, the platform will be inaccessible to users for maintenance.
          </p>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="max-listing-duration" className="block text-sm font-medium text-gray-700">
            Maximum Listing Duration (days)
          </label>
          <select
            id="max-listing-duration"
            value={settings.maxListingDuration}
            onChange={(e) =>
              setSettings({
                ...settings,
                maxListingDuration: e.target.value,
              })
            }
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="5">5 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            How long food listings remain active before expiring.
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Database Management</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage database operations and maintenance.
        </p>
        <div className="mt-4 space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center">
              <DatabaseIcon className="h-5 w-5 text-gray-400" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">Database Backup</h4>
                <p className="text-xs text-gray-500">Last backup: Today at 3:00 AM</p>
              </div>
            </div>
            <div className="mt-4 flex space-x-4">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Run Manual Backup
              </button>
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Backup History
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <SaveIcon className="mr-2 h-4 w-4" />
          Save System Settings
        </button>
      </div>
    </form>
  )
}

export default SystemSettings

import React, { useState } from 'react'
import { toast } from 'sonner'
import { SaveIcon, UserIcon } from 'lucide-react'

const ProfileSettings = () => {
  const [name, setName] = useState('Admin User')
  const [email, setEmail] = useState('admin@saveanbite.com')
  const [role, setRole] = useState('System Administrator')

  const handleSubmit = (e) => {
    e.preventDefault()
    toast.success('Profile settings saved')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center">
        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl">
          <UserIcon size={32} />
        </div>
        <div className="ml-5">
          <button
            type="button"
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Change Avatar
          </button>
          <p className="mt-1 text-xs text-gray-500">JPG, GIF or PNG. 1MB max.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <input
            type="text"
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled
          />
        </div>

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
            Timezone
          </label>
          <select
            id="timezone"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option>Eastern Time (ET)</option>
            <option>Central Time (CT)</option>
            <option>Mountain Time (MT)</option>
            <option>Pacific Time (PT)</option>
            <option>UTC</option>
          </select>
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

export default ProfileSettings

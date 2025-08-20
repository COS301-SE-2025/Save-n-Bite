import React, { useState, useRef } from 'react'
import { Edit2Icon, CheckIcon, XIcon, Menu } from 'lucide-react'
import { profileData, sustainabilityData } from '../../utils/MockData'
import SideBar from '../../components/foodProvider/SideBar';

function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(profileData)
  const [tags, setTags] = useState(profileData.tags)
  const [newTag, setNewTag] = useState('')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const bannerInputRef = useRef(null)
  const logoInputRef = useRef(null)

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsEditing(false)
  }

  const handleAddTag = () => {
    if (newTag.trim() !== '' && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleImageChange = (e, type) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({
          ...formData,
          [type]: reader.result,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:flex">
        <SideBar onNavigate={() => {}} currentPage="foodprovider-profile" />
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
              currentPage="foodprovider-profile"
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
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Business Profile</h1>
          <div className="w-10" />
        </div>

        <div className="max-w-5xl mx-auto p-4 sm:p-6">
          {/* Banner Section */}
          <div className="relative h-48 sm:h-64 rounded-lg overflow-hidden mb-6 sm:mb-8 bg-blue-100 dark:bg-blue-900 transition-colors duration-300">
            <img
              src={formData.bannerUrl}
              alt="Business Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
              <div className="p-4 sm:p-6 text-white">
                <h2 className="text-xl sm:text-3xl font-bold">{formData.businessName}</h2>
              </div>
            </div>
            <button
              onClick={() => bannerInputRef.current.click()}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors"
            >
              <Edit2Icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-900" />
            </button>
            <input
              type="file"
              accept="image/*"
              ref={bannerInputRef}
              style={{ display: 'none' }}
              onChange={(e) => handleImageChange(e, 'bannerUrl')}
            />
          </div>

          {/* Business Info Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6 sm:mb-8 transition-colors duration-300">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Business Information</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center sm:justify-start text-sm sm:text-base"
                  >
                    <Edit2Icon className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleSubmit}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center text-sm sm:text-base"
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setFormData(profileData)
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center justify-center text-sm sm:text-base"
                    >
                      <XIcon className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center mb-6 relative">
                <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4 sm:mb-0 sm:mr-6 mx-auto sm:mx-0 transition-colors duration-300">
                  <img
                    src={formData.logoUrl}
                    alt="Business Logo"
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  onClick={() => logoInputRef.current.click()}
                  className="absolute left-1/2 transform -translate-x-1/2 top-14 sm:left-16 sm:top-16 sm:transform-none bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors"
                >
                  <Edit2Icon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-900" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={logoInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => handleImageChange(e, 'logoUrl')}
                />
                <div className="text-center sm:text-left">
                  <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full font-medium text-xs sm:text-sm transition-colors duration-300">
                    {formData.verificationStatus === 'Verified' ? (
                      <span className="flex items-center">
                        <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-600 dark:text-green-400" />
                        Verified Business
                      </span>
                    ) : formData.verificationStatus === 'Pending' ? (
                      <span className="text-yellow-600 dark:text-yellow-400">Verification Pending</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">Verification Required</span>
                    )}
                  </span>
                </div>
              </div>

              {isEditing ? (
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Business Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Business Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Business Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full text-xs sm:text-sm transition-colors duration-300"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 sm:ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors duration-300"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add a tag"
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 transition-colors duration-300"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 text-sm sm:text-base"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300">
                        Business Name
                      </h4>
                      <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100">{formData.businessName}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300">
                        Contact Email
                      </h4>
                      <p className="text-sm sm:text-base break-words text-gray-900 dark:text-gray-100">{formData.email}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300">
                        Phone Number
                      </h4>
                      <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100">{formData.phone}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300">
                        Business Address
                      </h4>
                      <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100">{formData.address}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300">
                      Business Description
                    </h4>
                    <p className="mt-1 text-sm sm:text-base text-gray-900 dark:text-gray-100">{formData.description}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300">
                      Business Tags
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full text-xs sm:text-sm transition-colors duration-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Impact Snapshot Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6 sm:mb-8 transition-colors duration-300">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Your Impact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900 p-3 sm:p-4 rounded-lg transition-colors duration-300">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300">
                    Meals Donated
                  </h4>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                    {sustainabilityData.mealsSaved}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900 p-3 sm:p-4 rounded-lg transition-colors duration-300">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300">
                    Food Weight Saved (kg)
                  </h4>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {sustainabilityData.mealsSaved * 0.5}
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900 p-3 sm:p-4 rounded-lg transition-colors duration-300">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300">
                    CO₂ Reduced (kg)
                  </h4>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {sustainabilityData.co2Reduced}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:mb-8">
            <button className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-white dark:bg-gray-800 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors duration-300 text-sm sm:text-base">
              Download Impact Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage;
import React, { useState, useRef } from 'react'
import { Edit2Icon, CheckIcon, XIcon } from 'lucide-react'
import { profileData, sustainabilityData } from '../../utils/MockData'
import SideBar from '../../components/foodProvider/SideBar';

function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(profileData)
  const [tags, setTags] = useState(profileData.tags)
  const [newTag, setNewTag] = useState('')
    const bannerInputRef = useRef(null)
  const logoInputRef = useRef(null)

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
    <div className="w-full flex min-h-screen">
    <SideBar onNavigate={() => {}} currentPage="foodprovider-profile" />
    <div className="max-w-5xl mx-auto">
      {/* <h1 className="text-2xl font-bold mb-6">Business Profile</h1> */}

      {/* Banner Section */}
        <div className="relative h-64 rounded-lg overflow-hidden mb-8 bg-blue-100">
          <img
            src={formData.bannerUrl}
            alt="Business Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
            <div className="p-6 text-white">
              <h2 className="text-3xl font-bold">{formData.businessName}</h2>
            </div>
          </div>
          <button
            onClick={() => bannerInputRef.current.click()}
            className="absolute top-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors"
          >
            <Edit2Icon className="h-5 w-5 text-blue-900" />
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
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Business Information</h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <Edit2Icon className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setFormData(profileData)
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center"
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>

      <div className="flex items-center mb-6 relative">
              <div className="h-24 w-24 bg-gray-200 rounded-full overflow-hidden mr-6">
                <img
                  src={formData.logoUrl}
                  alt="Business Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                onClick={() => logoInputRef.current.click()}
                className="absolute left-16 top-16 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors"
              >
                <Edit2Icon className="h-4 w-4 text-blue-900" />
              </button>
              <input
                type="file"
                accept="image/*"
                ref={logoInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleImageChange(e, 'logoUrl')}
              />
              <div>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium text-sm">
                  {formData.verificationStatus === 'Verified' ? (
                    <span className="flex items-center">
                      <CheckIcon className="h-4 w-4 mr-1 text-green-600" />
                      Verified Business
                    </span>
                  ) : formData.verificationStatus === 'Pending' ? (
                    <span className="text-yellow-600">Verification Pending</span>
                  ) : (
                    <span className="text-red-600">Verification Required</span>
                  )}
                </span>
              </div>
            </div>


          {isEditing ? (
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
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
                    className="flex-1 p-2 border border-gray-300 rounded-l-md"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Business Name
                  </h4>
                  <p>{formData.businessName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Contact Email
                  </h4>
                  <p>{formData.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Phone Number
                  </h4>
                  <p>{formData.phone}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Business Address
                  </h4>
                  <p>{formData.address}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Business Description
                </h4>
                <p className="mt-1">{formData.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Business Tags
                </h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
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
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Your Impact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">
                Meals Donated
              </h4>
              <p className="text-3xl font-bold text-green-600">
                {sustainabilityData.mealsSaved}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">
                Food Weight Saved (kg)
              </h4>
              <p className="text-3xl font-bold text-blue-600">
                {sustainabilityData.mealsSaved * 0.5}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">
                CO₂ Reduced (kg)
              </h4>
              <p className="text-3xl font-bold text-yellow-600">
                {sustainabilityData.co2Reduced}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        {/* <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          View Order History
        </button> */}
        <button className="px-6 py-3 bg-white border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
          Download Impact Report
        </button>
      </div>
    </div>
    </div>
  )
}
export default  ProfilePage;
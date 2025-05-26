import React, { useState } from 'react';
import { CalendarIcon, ImageIcon, ClockIcon } from 'lucide-react';

export function ListingForm() {
  const [isDonation, setIsDonation] = useState(false);
  const [errors, setErrors] = useState({});

 const validateField = (name, value) => {
    if (!value) {
      setErrors(prev => ({
        ...prev,
        [name]: 'This field is required'
      }));
    } else {
      setErrors(prev => {
        const newErrors = {
          ...prev
        };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  return <form className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-3xl">
      <div className="space-y-6">
        {/* Food Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Food Name
          </label>
          <input type="text" className={`w-full p-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., Fresh Baked Bread" onChange={e => validateField('name', e.target.value)} />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea className="w-full p-2 border border-gray-300 rounded-lg h-24" placeholder="Describe your food item..." />
        </div>
        {/* Quantity and Price/Donation Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input type="number" className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Number of items" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Setting
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input type="checkbox" checked={isDonation} onChange={e => setIsDonation(e.target.checked)} className="w-4 h-4 text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">
                  Mark as Donation
                </span>
              </label>
              {!isDonation && <input type="number" className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Price (R)" />}
            </div>
          </div>
        </div>
        {/* Expiration Date and Time Range Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date
            </label>
            <div className="relative">
              <input type="date" className="w-full p-2 border border-gray-300 rounded-lg" />
              <CalendarIcon className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Time Range
            </label>
            <div className="relative">
              <select className="w-full p-2 border border-gray-300 rounded-lg appearance-none">
                <option>9:00 AM - 12:00 PM</option>
                <option>12:00 PM - 3:00 PM</option>
                <option>3:00 PM - 6:00 PM</option>
              </select>
              <ClockIcon className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Image
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="flex flex-col items-center">
              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Drag and drop an image, or{' '}
                <span className="text-blue-600">browse</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Save Draft
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Publish Listing
          </button>
        </div>
      </div>
    </form>;
}
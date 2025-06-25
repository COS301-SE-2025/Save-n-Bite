import React from 'react';
import { ClockIcon, MapPinIcon } from 'lucide-react';

const FoodItemDetails = ({ pickupWindow, address, quantity }) => (
  <div className="mb-6">
    <div className="flex items-start mb-3">
      <ClockIcon size={20} className="mr-2 text-emerald-600 mt-0.5" />
      <div>
        <p className="text-sm text-gray-500">Pickup Window</p>
        <p className="font-medium text-gray-700">{pickupWindow}</p>
      </div>
    </div>
    
    {/* remember */}
    <div className="flex items-start mb-3">
      <MapPinIcon size={20} className="mr-2 text-emerald-600 mt-0.5" />
      <div>
        <p className="text-sm text-gray-500">Pickup Location</p>
        <p className="font-medium text-gray-700">{address}</p>
      </div>
    </div>
    
    <div className="mb-3">
      <p className="text-sm text-gray-500">Available Quantity</p>
      <p className="font-medium text-gray-700">{quantity} available</p>
    </div>
  </div>
);

export default FoodItemDetails;
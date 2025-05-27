import React from 'react';

const StoreLocation = ({ address }) => (
  <div className="p-6 border-t border-gray-100">
    <h2 className="text-lg font-semibold mb-4 text-gray-800">
      Store Location
    </h2>
    <div className="h-64 bg-gray-200 rounded-lg overflow-hidden">
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        Map would display here for: {address}
      </div>
    </div>
  </div>
);

export default StoreLocation;
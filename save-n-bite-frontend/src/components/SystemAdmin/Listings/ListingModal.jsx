import React from 'react'
import { XIcon, StarIcon } from 'lucide-react'

const ListingModal = ({
  listing,
  onClose,
  onRemove,
  onFeature,
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    Listing Details
                    {listing.featured && (
                      <StarIcon size={16} className="ml-2 text-yellow-500" />
                    )}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XIcon size={20} />
                  </button>
                </div>
                <div className="mt-4">
                  <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={listing.image}
                      alt={listing.name}
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-4 flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {listing.name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">{listing.id}</p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        listing.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : listing.status === 'Flagged'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {listing.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Provider
                      </h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {listing.provider}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Type
                      </h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {listing.type}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Price
                      </h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {listing.price}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Created
                      </h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(listing.created).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {listing.status !== 'Removed' && (
              <button
                type="button"
                onClick={() => onRemove(listing.id)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Remove Listing
              </button>
            )}
            <button
              type="button"
              onClick={() => onFeature(listing.id)}
              className={`mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${
                listing.featured
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              } text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm`}
            >
              {listing.featured ? 'Unfeature' : 'Feature'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListingModal

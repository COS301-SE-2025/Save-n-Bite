import React from 'react'
import { EyeIcon, XIcon, StarIcon } from 'lucide-react'

const ListingTable = ({
  listings,
  onViewListing,
  onActionClick,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'flagged':
        return 'bg-amber-100 text-amber-800'
      case 'removed':
        return 'bg-red-100 text-red-800'
      case 'sold_out':
        return 'bg-gray-100 text-gray-800'
      case 'expired':
        return 'bg-purple-100 text-purple-800'
      case 'inactive':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

    const getStatusDisplay = (status) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'flagged':
        return 'Flagged'
      case 'removed':
        return 'Removed'
      case 'sold_out':
        return 'Sold Out'
      case 'expired':
        return 'Expired'
      case 'inactive':
        return 'Inactive'
      default:
        return status
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Listing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {listings.length > 0 ? (
              listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-md object-cover"
                          src={listing.image}
                          alt={listing.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {listing.name}
                          {listing.featured && (
                            <StarIcon
                              size={16}
                              className="ml-1 text-yellow-500"
                            />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {listing.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {listing.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        listing.type === 'Sale'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {listing.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {listing.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(listing.created).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onViewListing(listing)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="View Details"
                    >
                      <EyeIcon size={18} />
                    </button>
                    {listing.status !== 'Removed' && (
                      <button
                        onClick={() => onActionClick('remove', listing.id)}
                        className="text-red-600 hover:text-red-900 mr-3"
                        title="Remove Listing"
                      >
                        <XIcon size={18} />
                      </button>
                    )}
                    
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No listings found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ListingTable

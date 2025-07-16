import React from 'react'
import { LeafIcon, ScaleIcon, CreditCardIcon, BuildingIcon } from 'lucide-react'

const ImpactSummary = ({ totalMeals, totalWeight }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          Platform Impact Summary
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <LeafIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">
                Total Meals Rescued
              </h3>
              <p className="text-2xl font-semibold text-gray-900">
                {totalMeals.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Since launch</p>
            </div>
          </div>
        </div>
        <div className="p-6 border-b md:border-b-0 lg:border-r border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <ScaleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">
                Food Weight Saved
              </h3>
              <p className="text-2xl font-semibold text-gray-900">
                {totalWeight.toLocaleString()} kg
              </p>
              <p className="text-sm text-gray-500">Total rescued food</p>
            </div>
          </div>
        </div>
        <div className="p-6 border-b lg:border-b-0 md:border-r border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <CreditCardIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">
                Completed Transactions
              </h3>
              <p className="text-2xl font-semibold text-gray-900">5,782</p>
              <p className="text-sm text-gray-500">Successful exchanges</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
              <BuildingIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">
                Active Providers
              </h3>
              <p className="text-2xl font-semibold text-gray-900">880</p>
              <p className="text-sm text-gray-500">Contributing businesses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImpactSummary

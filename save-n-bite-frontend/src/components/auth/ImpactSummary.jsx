import React from 'react';
import { CheckCircle, Leaf, DollarSign, Users, Package } from 'lucide-react';

const ImpactSummary = ({ impact, userType }) => {
  const stats = [
    {
      icon: CheckCircle,
      label: 'Meals Saved',
      value: impact.mealsSaved,
      color: 'emerald',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-600'
    },
    {
      icon: Leaf,
      label: 'CO₂ Reduced',
      value: `${impact.co2Reduced.toFixed(1)} kg`,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    }
  ];

  // Add user-type specific stats
  if (userType === 'customer') {
    stats.push(
      {
        icon: DollarSign,
        label: 'Total Spent',
        value: `R${impact.totalSpent.toFixed(2)}`,
        color: 'purple',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600'
      },
      {
        icon: Package,
        label: 'Orders Placed',
        value: impact.ordersCount,
        color: 'orange',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600'
      }
    );
  } else {
    stats.push(
      {
        icon: Users,
        label: 'People Helped',
        value: impact.totalDonationsReceived,
        color: 'purple',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600'
      },
      {
        icon: Package,
        label: 'Donations Received',
        value: impact.ordersCount,
        color: 'orange',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600'
      }
    );
  }

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        {userType === 'ngo' ? 'Your Community Impact' : 'Your Impact Summary'}
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg p-4 flex items-center">
              <div className={`${stat.bgColor} p-3 rounded-full mr-4`}>
                <IconComponent size={24} className={stat.textColor} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional insights for NGOs */}
      {userType === 'ngo' && impact.ordersCount > 0 && (
        <div className="mt-4 pt-4 border-t border-white/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="font-medium text-gray-800">Average per donation:</p>
              <p className="text-gray-600">
                {Math.round(impact.mealsSaved / impact.ordersCount)} meals, {' '}
                {(impact.co2Reduced / impact.ordersCount).toFixed(1)} kg CO₂
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="font-medium text-gray-800">Community reach:</p>
              <p className="text-gray-600">
                {Math.round(impact.totalDonationsReceived / impact.ordersCount)} people per donation
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Additional insights for customers */}
      {userType === 'customer' && impact.ordersCount > 0 && (
        <div className="mt-4 pt-4 border-t border-white/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="font-medium text-gray-800">Average per order:</p>
              <p className="text-gray-600">
                R{(impact.totalSpent / impact.ordersCount).toFixed(2)}, {' '}
                {Math.round(impact.mealsSaved / impact.ordersCount)} meals saved
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="font-medium text-gray-800">Environmental impact:</p>
              <p className="text-gray-600">
                Equivalent to {(impact.co2Reduced * 2.2).toFixed(1)} km less driving
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpactSummary;
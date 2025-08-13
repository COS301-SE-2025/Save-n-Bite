import React from 'react';
import { CheckCircle, Leaf, Heart, Utensils, Package, Calendar } from 'lucide-react';

const ImpactSummary = ({ impact, userType }) => {
  const stats = [
    {
      icon: Utensils,
      label: 'Meals Saved',
      value: impact.mealsSaved || 0,
      color: 'emerald',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900',
      textColor: 'text-emerald-600 dark:text-emerald-200'
    },
    {
      icon: Leaf,
      label: 'CO₂ Reduced',
      value: `${(impact.co2Reduced || 0).toFixed(1)} kg`,
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      textColor: 'text-blue-600 dark:text-blue-200'
    },
    {
      icon: Heart,
      label: 'Community Impact',
      value: `${Math.round((impact.mealsSaved || 0) * 0.8)} families helped`,
      color: 'pink',
      bgColor: 'bg-pink-100 dark:bg-pink-900',
      textColor: 'text-pink-600 dark:text-pink-200'
    }
  ];

  // Add user-type specific stats
  if (userType === 'customer') {
    stats.push({
      icon: Package,
      label: 'Successful Pickups',
      value: impact.ordersCount || 0,
      color: 'orange',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      textColor: 'text-orange-600 dark:text-orange-200'
    });
  } else {
    stats.push(
      {
        icon: Package,
        label: 'Donations Managed',
        value: impact.ordersCount || 0,
        color: 'orange',
        bgColor: 'bg-orange-100 dark:bg-orange-900',
        textColor: 'text-orange-600 dark:text-orange-200'
      }
    );
  }

  // Calculate additional meaningful metrics for South African context
  const waterSaved = Math.round((impact.mealsSaved || 0) * 150); // Approx 150L water per meal saved
  const wasteReduced = ((impact.mealsSaved || 0) * 0.3).toFixed(1); // Approx 300g waste per meal

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6 mb-8 transition-colors">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
        {userType === 'ngo' ? 'Your Community Impact' : 'Your Positive Impact'}
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center transition-colors">
              <div className={`${stat.bgColor} p-3 rounded-full mr-4`}>
                <IconComponent size={24} className={stat.textColor} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional positive impact insights */}
      {(impact.ordersCount || 0) > 0 && (
        <div className="mt-6 pt-4 border-t border-white/50 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            🌍 Your Environmental & Social Impact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-200">{waterSaved}L</p>
              <p className="text-gray-600 dark:text-gray-300">Water saved</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">by preventing food waste</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-green-600 dark:text-green-200">{wasteReduced}kg</p>
              <p className="text-gray-600 dark:text-gray-300">Waste prevented</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">from reaching landfills</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-purple-600 dark:text-purple-200">
                {Math.round((impact.co2Reduced || 0) * 4.5)}km
              </p>
              <p className="text-gray-600 dark:text-gray-300">Equivalent car travel</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">CO₂ emissions saved</p>
            </div>
          </div>
          
          {/* Motivational message */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300 italic">
              {userType === 'customer' 
                ? " Thank you for making a difference in South African communities while enjoying great food!"
                : " Your work is creating lasting positive change in South African communities!"
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpactSummary;
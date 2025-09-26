// src/components/garden/GardenLoader.jsx
import React from 'react';
import { TreePineIcon, SparklesIcon } from 'lucide-react';

// Main garden loading component
const GardenLoader = ({ 
  type = "garden", 
  message = "Loading your garden...",
  className = "" 
}) => {
  
  const getLoaderContent = () => {
    switch (type) {
      case 'garden':
        return <GardenGridLoader />;
      case 'plant':
        return <PlantLoader />;
      case 'inventory':
        return <InventoryLoader />;
      case 'stats':
        return <StatsLoader />;
      default:
        return <GardenGridLoader />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {getLoaderContent()}
      <p className="mt-4 text-gray-600 dark:text-gray-300 text-center">
        {message}
      </p>
    </div>
  );
};

// Garden grid skeleton loader
const GardenGridLoader = () => {
  return (
    <div className="space-y-4">
      {/* Animated garden icon */}
      <div className="flex justify-center">
        <div className="relative">
          <TreePineIcon className="w-12 h-12 text-emerald-500 animate-pulse" />
          <SparklesIcon className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
        </div>
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-8 gap-2 p-4 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900 dark:to-green-900 rounded-lg">
        {Array.from({ length: 64 }, (_, i) => (
          <div
            key={i}
            className="aspect-square bg-white dark:bg-gray-700 rounded-sm animate-pulse"
            style={{
              animationDelay: `${(i % 8) * 0.1}s`,
              animationDuration: '1.5s'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Plant loading animation
const PlantLoader = () => {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {/* Growing plant animation */}
        <div className="w-16 h-16 bg-emerald-500 rounded-full animate-pulse opacity-20"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <TreePineIcon className="w-8 h-8 text-emerald-600 animate-bounce" />
        </div>
      </div>
      
      {/* Growing bars */}
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-emerald-500 rounded-full animate-pulse"
            style={{
              height: `${(i + 1) * 8}px`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Inventory loading skeleton
const InventoryLoader = () => {
  return (
    <div className="space-y-3 w-full max-w-xs">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
      
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Statistics loading skeleton
const StatsLoader = () => {
  return (
    <div className="space-y-4 w-full max-w-sm">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
      
      {/* Progress bar skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-3"></div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

// Tile loading component for individual garden tiles
export const TileLoader = ({ className = "" }) => {
  return (
    <div className={`aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse ${className}`}>
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-ping"></div>
      </div>
    </div>
  );
};

// Plant card loading skeleton
export const PlantCardLoader = ({ className = "" }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm ${className}`}>
      <div className="space-y-3">
        {/* Image placeholder */}
        <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"></div>
        
        {/* Text placeholders */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    </div>
  );
};

// Spinner loader for quick actions
export const SpinnerLoader = ({ 
  size = "medium", 
  color = "emerald",
  className = "" 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4';
      case 'large':
        return 'w-8 h-8';
      case 'xlarge':
        return 'w-12 h-12';
      default:
        return 'w-6 h-6';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'white':
        return 'border-white border-t-transparent';
      case 'gray':
        return 'border-gray-300 border-t-transparent';
      case 'green':
        return 'border-green-500 border-t-transparent';
      default:
        return 'border-emerald-500 border-t-transparent';
    }
  };

  return (
    <div 
      className={`
        ${getSizeClasses()} 
        border-2 rounded-full animate-spin
        ${getColorClasses()}
        ${className}
      `}
    />
  );
};

export default GardenLoader;
// src/components/ui/ProgressBar.jsx
import React from 'react';

const ProgressBar = ({ 
  progress = 0, 
  className = "",
  size = "medium",
  variant = "primary",
  showLabel = false,
  label = "",
  animated = true,
  striped = false 
}) => {
  
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'h-2';
      case 'large':
        return 'h-6';
      case 'xlarge':
        return 'h-8';
      default:
        return 'h-4';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'danger':
        return 'bg-red-500';
      case 'info':
        return 'bg-blue-500';
      case 'garden':
        return 'bg-gradient-to-r from-emerald-500 to-green-500';
      default:
        return 'bg-emerald-500';
    }
  };

  const getStripedClasses = () => {
    if (!striped) return '';
    return 'bg-gradient-to-r from-transparent via-white to-transparent bg-[length:1rem_1rem] opacity-25';
  };

  const getAnimatedClasses = () => {
    if (!animated) return '';
    return 'transition-all duration-300 ease-out';
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {normalizedProgress.toFixed(0)}%
          </span>
        </div>
      )}
      
      {/* Progress bar container */}
      <div 
        className={`
          w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden
          ${getSizeClasses()}
        `}
      >
        {/* Progress fill */}
        <div
          className={`
            ${getSizeClasses()} rounded-full relative overflow-hidden
            ${getVariantClasses()}
            ${getAnimatedClasses()}
          `}
          style={{ width: `${normalizedProgress}%` }}
        >
          {/* Striped overlay */}
          {striped && (
            <div 
              className={`
                absolute inset-0 ${getStripedClasses()}
                ${animated ? 'animate-pulse' : ''}
              `}
            />
          )}
        </div>
      </div>
      
      {/* Progress text inside bar for larger sizes */}
      {(size === 'large' || size === 'xlarge') && normalizedProgress > 10 && (
        <div 
          className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium"
          style={{ width: `${normalizedProgress}%` }}
        >
          {normalizedProgress.toFixed(0)}%
        </div>
      )}
    </div>
  );
};

// Circular Progress Bar variant
export const CircularProgressBar = ({ 
  progress = 0, 
  size = 120, 
  strokeWidth = 8,
  className = "",
  showLabel = true,
  variant = "primary" 
}) => {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  const getStrokeColor = () => {
    switch (variant) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'danger':
        return '#EF4444';
      case 'info':
        return '#3B82F6';
      case 'garden':
        return '#10B981';
      default:
        return '#10B981';
    }
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {/* Center label */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
            {normalizedProgress.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
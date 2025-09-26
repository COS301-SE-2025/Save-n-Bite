// src/components/ui/Button.jsx
import React from 'react';
import { LoaderIcon } from 'lucide-react';

const Button = ({
  children,
  variant = "primary",
  size = "medium",
  className = "",
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  onClick,
  type = "button",
  ...props
}) => {

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return `
          bg-emerald-600 hover:bg-emerald-700 text-white 
          border-emerald-600 hover:border-emerald-700
          focus:ring-emerald-500
        `;
      case 'secondary':
        return `
          bg-gray-200 hover:bg-gray-300 text-gray-900
          border-gray-200 hover:border-gray-300
          focus:ring-gray-500
          dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white
          dark:border-gray-700 dark:hover:border-gray-600
        `;
      case 'outline':
        return `
          bg-transparent hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700
          border-emerald-600 hover:border-emerald-700
          focus:ring-emerald-500
          dark:hover:bg-emerald-900 dark:text-emerald-400
        `;
      case 'ghost':
        return `
          bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900
          border-transparent hover:border-gray-300
          focus:ring-gray-500
          dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-white
        `;
      case 'danger':
        return `
          bg-red-600 hover:bg-red-700 text-white
          border-red-600 hover:border-red-700
          focus:ring-red-500
        `;
      case 'success':
        return `
          bg-green-600 hover:bg-green-700 text-white
          border-green-600 hover:border-green-700
          focus:ring-green-500
        `;
      case 'warning':
        return `
          bg-yellow-500 hover:bg-yellow-600 text-white
          border-yellow-500 hover:border-yellow-600
          focus:ring-yellow-500
        `;
      case 'garden':
        return `
          bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600
          text-white border-transparent
          focus:ring-emerald-500
        `;
      default:
        return getVariantClasses.primary;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-1.5 text-sm';
      case 'large':
        return 'px-6 py-3 text-lg';
      case 'xlarge':
        return 'px-8 py-4 text-xl';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const getDisabledClasses = () => {
    if (!disabled && !loading) return '';
    return 'opacity-50 cursor-not-allowed pointer-events-none';
  };

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg border
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    active:transform active:scale-95
    ${fullWidth ? 'w-full' : ''}
  `;

  const handleClick = (e) => {
    if (disabled || loading) return;
    if (onClick) onClick(e);
  };

  return (
    <button
      type={type}
      className={`
        ${baseClasses}
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${getDisabledClasses()}
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {/* Left icon or loading spinner */}
      {loading ? (
        <LoaderIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
      ) : leftIcon ? (
        <span className="-ml-1 mr-2">{leftIcon}</span>
      ) : null}

      {/* Button content */}
      <span>{children}</span>

      {/* Right icon */}
      {rightIcon && !loading && (
        <span className="ml-2 -mr-1">{rightIcon}</span>
      )}
    </button>
  );
};

// Icon Button variant
export const IconButton = ({
  children,
  variant = "ghost",
  size = "medium",
  className = "",
  rounded = true,
  ...props
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'p-1.5';
      case 'large':
        return 'p-3';
      case 'xlarge':
        return 'p-4';
      default:
        return 'p-2';
    }
  };

  return (
    <Button
      variant={variant}
      className={`
        ${getSizeClasses()}
        ${rounded ? 'rounded-full' : 'rounded-lg'}
        ${className}
      `}
      {...props}
    >
      {children}
    </Button>
  );
};

// Button Group component
export const ButtonGroup = ({ children, className = "", orientation = "horizontal" }) => {
  const orientationClasses = orientation === 'vertical' 
    ? 'flex-col space-y-0 divide-y' 
    : 'flex-row space-x-0 divide-x';

  return (
    <div className={`inline-flex ${orientationClasses} rounded-lg shadow-sm ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            className: `
              ${child.props.className || ''} 
              ${index === 0 ? (orientation === 'vertical' ? 'rounded-t-lg rounded-b-none' : 'rounded-l-lg rounded-r-none') : ''}
              ${index === React.Children.count(children) - 1 ? (orientation === 'vertical' ? 'rounded-b-lg rounded-t-none' : 'rounded-r-lg rounded-l-none') : ''}
              ${index > 0 && index < React.Children.count(children) - 1 ? 'rounded-none' : ''}
            `.trim()
          });
        }
        return child;
      })}
    </div>
  );
};

export default Button;
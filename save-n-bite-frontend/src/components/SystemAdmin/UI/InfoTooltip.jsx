import React, { useState } from 'react'
import { InfoIcon } from 'lucide-react'

const InfoTooltip = ({
  content,
  position = 'top',
  size = 'md',
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
  }
  const sizeClasses = {
    sm: 'text-xs w-40',
    md: 'text-sm w-56',
    lg: 'text-sm w-72',
  }
  return (
    <div className="relative inline-block">
      <div
        className="inline-flex items-center justify-center text-gray-500 hover:text-gray-700 cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        <InfoIcon size={16} />
      </div>
      {isVisible && (
        <div
          className={`absolute z-50 ${positionClasses[position]} ${sizeClasses[size]}`}
        >
          <div className="bg-gray-800 text-white rounded-md py-2 px-3 shadow-lg">
            <p>{content}</p>
            {position === 'top' && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-800"></div>
            )}
            {position === 'right' && (
              <div className="absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2 border-8 border-transparent border-r-gray-800"></div>
            )}
            {position === 'bottom' && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-b-gray-800"></div>
            )}
            {position === 'left' && (
              <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 border-8 border-transparent border-l-gray-800"></div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default InfoTooltip

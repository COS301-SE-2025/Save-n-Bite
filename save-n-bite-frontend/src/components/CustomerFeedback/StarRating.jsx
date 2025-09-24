 import React from 'react'
import { Star } from 'lucide-react'

const StarRating = ({ rating, setRating, size = 28, interactive = true, className = '' }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => interactive && setRating(star)}
          onMouseEnter={() => interactive && setRating(star)}
          className={`transition-all duration-200 focus:outline-none ${
            interactive ? 'hover:scale-110' : ''
          }`}
          aria-label={`Rate ${star} out of 5`}
          disabled={!interactive}
        >
          <Star
            size={size}
            className={`transition-colors duration-200 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400 dark:fill-yellow-400 dark:text-yellow-400' 
                : 'text-gray-200 dark:text-gray-700'
            }`}
            strokeWidth={star <= rating ? 0 : 1.5}
          />
        </button>
      ))}
    </div>
  )
}

export default StarRating

import React from 'react'
import { Star } from 'lucide-react'

const StarRating = ({ rating, setRating, size = 32 }) => {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setRating(star)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            size={size}
            className={`transition-colors duration-200 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400 dark:fill-yellow-400 dark:text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default StarRating

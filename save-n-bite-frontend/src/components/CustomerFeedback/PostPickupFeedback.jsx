import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircleIcon, XIcon } from 'lucide-react'
import StarRating from './StarRating'
import ProviderReview from './ProviderReview'
import ItemReview from './ItemReview'

const PostPickupFeedback = ({ orderNumber, providerName, itemName, onClose }) => {
  const [showProviderReview, setShowProviderReview] = useState(false)
  const [showItemReview, setShowItemReview] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleSkip = () => {
    setIsComplete(true)
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <XIcon size={24} />
          </button>

          <AnimatePresence mode="wait">
            {!isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Would you like to review more details?
                  </h2>
                  <p className="text-gray-600">
                    Order #{orderNumber} from {providerName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Your feedback helps us and our providers improve.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowProviderReview(true)}
                    className="p-4 border rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                  >
                    Review Provider
                  </button>
                  <button
                    onClick={() => setShowItemReview(true)}
                    className="p-4 border rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                  >
                    Review Item
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSkip}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800"
                  >
                    No, thanks
                  </button>
                </div>
              </motion.div>
            )}

            {isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center space-y-4"
              >
                <CheckCircleIcon size={48} className="text-emerald-500 mx-auto" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Thanks for your feedback!
                </h2>
                <p className="text-gray-600">
                  Your input helps us improve our service.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {showProviderReview && (
          <ProviderReview
            providerName={providerName}
            onClose={() => setShowProviderReview(false)}
            onComplete={() => {
              setShowProviderReview(false)
              setIsComplete(true)
            }}
          />
        )}

        {showItemReview && (
          <ItemReview
            itemName={itemName}
            onClose={() => setShowItemReview(false)}
            onComplete={() => {
              setShowItemReview(false)
              setIsComplete(true)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default PostPickupFeedback
import React, { useState } from 'react'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  HelpCircleIcon,
  XIcon,
  UserIcon,
  UsersIcon,
  StoreIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const HelpCard = ({ title, icon: Icon, children }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex justify-between items-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <div className="p-2 mr-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <Icon size={20} />
          </div>
          <span className="font-medium text-gray-800 dark:text-gray-100 text-left">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUpIcon size={20} className="text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ChevronDownIcon size={20} className="text-emerald-600 dark:text-emerald-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm space-y-4">
              {children}
              {/* <a
                href="#"
                className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium text-sm transition-colors"
              >
                Need more help? Contact support
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const RegistrationHelp = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
      >
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-700 dark:to-emerald-600 text-white px-6 py-5 rounded-t-2xl flex justify-between items-center z-10">
          <div className="flex items-center">
            <div className="p-2 mr-3 rounded-lg bg-white/20 backdrop-blur-sm">
              <HelpCircleIcon size={24} />
            </div>
            <h3 className="text-xl font-semibold">Need Help Registering?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close help"
          >
            <XIcon size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <HelpCard 
            title="Registering as an Individual" 
            icon={UserIcon}
          >
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">To register as an individual, you'll need:</p>
              <ul className="space-y-2 pl-2">
                {["A valid email address", "Personal details (name, contact information)", "A secure password"].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 mt-2 mr-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                    <span className="text-gray-600 dark:text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-gray-700 dark:text-gray-300 pt-1">
                After registering, you'll receive a confirmation email to verify your account.
              </p>
            </div>
          </HelpCard>

          <HelpCard 
            title="Registering as an Organization (NGO)" 
            icon={UsersIcon}
          >
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">To register as an NGO, you'll need:</p>
              <ul className="space-y-2 pl-2">
                {["Organization name and details", "Proof of NGO status or registration number", "Contact information for the primary representative", "Organization location details"].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 mt-2 mr-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                    <span className="text-gray-600 dark:text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-gray-700 dark:text-gray-300 pt-1">
                Your application will be reviewed within 2-3 business days.
              </p>
            </div>
          </HelpCard>

          <HelpCard 
            title="Registering as a Food Provider" 
            icon={StoreIcon}
          >
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">To register as a food provider, you'll need:</p>
              <ul className="space-y-2 pl-2">
                {["Business name and details", "Business license or registration number", "Food handling certifications", "Store location and operating hours", "Contact information for account management"].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 mt-2 mr-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                    <span className="text-gray-600 dark:text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-gray-700 dark:text-gray-300 pt-1">
                Your application will be reviewed within 1-2 business days.
              </p>
            </div>
          </HelpCard>
        </div>
        
        <div className="sticky bottom-0 bg-gradient-to-t from-white to-white/80 dark:from-gray-900 dark:to-gray-900/80 px-6 py-4 border-t border-gray-100 dark:border-gray-800 rounded-b-2xl z-10">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Got it, thanks!
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default RegistrationHelp

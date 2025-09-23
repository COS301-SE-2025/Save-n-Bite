import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { 
  XIcon, 
  ChevronDownIcon, 
  ChevronUpIcon, 
  HelpCircleIcon,
  UserIcon,
  UsersIcon,
  StoreIcon,
  InfoIcon,
  MessageSquareIcon,
  MailIcon,
  PhoneIcon,
  ClockIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const AccordionItem = ({ title, icon: Icon, children, isOpen, toggleOpen }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-md">
      <button
        onClick={toggleOpen}
        className="w-full px-6 py-5 flex justify-between items-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const HelpItem = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2 text-left flex justify-between items-center group"
        aria-expanded={isOpen}
      >
        <span className="text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {title}
        </span>
        {isOpen ? (
          <ChevronUpIcon size={18} className="text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ChevronDownIcon size={18} className="text-emerald-600 dark:text-emerald-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="py-2 pl-4 pr-2 text-sm text-gray-600 dark:text-gray-300">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const HelpMenu = ({ isOpen, onClose }) => {
  const [openSection, setOpenSection] = useState('general')

  if (!isOpen) return null

  // Use React Portal to render outside the component tree
  return createPortal(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999999]"
    >
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        className="fixed right-0 top-0 bg-white dark:bg-gray-900 w-full max-w-md h-full overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-700 dark:to-emerald-600 text-white px-6 py-5 flex justify-between items-center z-10">
          <div className="flex items-center">
            <div className="p-2 mr-3 rounded-lg bg-white/20 backdrop-blur-sm">
              <HelpCircleIcon size={24} />
            </div>
            <h2 className="text-xl font-semibold">Help Center</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close help menu"
          >
            <XIcon size={24} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <AccordionItem
            title="General Help"
            icon={InfoIcon}
            isOpen={openSection === 'general'}
            toggleOpen={() => setOpenSection(openSection === 'general' ? '' : 'general')}
          >
            <div className="space-y-4">
              <HelpItem title="What is Save n Bite?">
                <p className="text-gray-700 dark:text-gray-300">
                  Save n Bite is a platform that connects consumers with local
                  businesses to rescue surplus food that would otherwise go to
                  waste. We help reduce food waste while offering quality food
                  at discounted prices.
                </p>
              </HelpItem>
              <HelpItem title="Understanding user roles">
                <p className="text-gray-700 dark:text-gray-300">Save n Bite has three main user roles:</p>
                <ul className="space-y-2 mt-2 ml-2">
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 mt-2 mr-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                    <span className="text-gray-600 dark:text-gray-400">Individual Consumers: Users who purchase surplus food.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 mt-2 mr-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                    <span className="text-gray-600 dark:text-gray-400">Organizations (NGOs): Entities that can request food donations and purchase surplus food.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 mt-2 mr-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                    <span className="text-gray-600 dark:text-gray-400">Food Providers: Businesses that list surplus food items.</span>
                  </li>
                </ul>
              </HelpItem>
              <HelpItem title="Notifications and alerts">
                <p className="text-gray-700 dark:text-gray-300">
                  You can manage your notification preferences in your Profile
                  Settings. We send alerts for pickup reminders, new deals,
                  order confirmations, and impact milestones.
                </p>
              </HelpItem>
            </div>
          </AccordionItem>

          <AccordionItem
            title="For Individual Consumers"
            icon={UserIcon}
            isOpen={openSection === 'consumers'}
            toggleOpen={() => setOpenSection(openSection === 'consumers' ? '' : 'consumers')}
          >
            <div className="space-y-4">
              <HelpItem title="Browsing food listings">
                <p className="text-gray-700 dark:text-gray-300">
                  Navigate to the "Browse Food" page to see all available food
                  listings. You can filter by location, price range, food type,
                  or pickup time to find items that match your preferences.
                </p>
              </HelpItem>
              <HelpItem title="Ordering and paying for food">
                <p className="text-gray-700 dark:text-gray-300">
                  When you find an item you want, click "Add to Cart." You can
                  then proceed to checkout, select a pickup time slot, enter your payment details, and
                  confirm your order. Payment is processed securely through our
                  platform.
                </p>
              </HelpItem>
              <HelpItem title="Scheduling pickups">
                <p className="text-gray-700 dark:text-gray-300">
                  After completing your purchase, you'll receive pickup
                  instructions with the pickup time slot you selected within the pickup window. Make sure to
                  arrive during this window with your order confirmation code.
                </p>
              </HelpItem>
            </div>
          </AccordionItem>

          <AccordionItem
            title="For Organizations (NGOs)"
            icon={UsersIcon}
            isOpen={openSection === 'organizations'}
            toggleOpen={() => setOpenSection(openSection === 'organizations' ? '' : 'organizations')}
          >
            <div className="space-y-4">
              <HelpItem title="Requesting donation items">
                <p className="text-gray-700 dark:text-gray-300">
                  As an organization, you can browse available donation items and discounted items. Navigate to the "Browse" tab to
                  see what's available.
                </p>
              </HelpItem>
              <HelpItem title="Viewing pickup details">
                <p className="text-gray-700 dark:text-gray-300">
                  Once your request is approved, you'll receive pickup
                  instructions. You can view all scheduled pickups in your
                  Order History.
                </p>
              </HelpItem>
              <HelpItem title="Tracking impact reports">
                <p className="text-gray-700 dark:text-gray-300">
                  Your Order History includes impact reports showing how many meals
                  you've distributed, CO₂ emissions saved, and other key
                  metrics.
                </p>
              </HelpItem>
            </div>
          </AccordionItem>

          <AccordionItem
            title="For Food Providers"
            icon={StoreIcon}
            isOpen={openSection === 'providers'}
            toggleOpen={() => setOpenSection(openSection === 'providers' ? '' : 'providers')}
          >
            <div className="space-y-4">
              <HelpItem title="Listing food items">
                <p className="text-gray-700 dark:text-gray-300">
                  Add new food items through your dashboard. Include clear photos, accurate descriptions,
                  quantities, and set appropriate pricing and pickup times.
                </p>
              </HelpItem>
              <HelpItem title="Managing orders">
                <p className="text-gray-700 dark:text-gray-300">
                  View and manage incoming orders in your dashboard. Update order statuses,
                  communicate with customers, and prepare orders for pickup.
                </p>
              </HelpItem>
              <HelpItem title="Analytics and reporting">
                <p className="text-gray-700 dark:text-gray-300">
                  Track your impact with detailed analytics on food saved,
                  revenue generated, and environmental impact.
                </p>
              </HelpItem>
            </div>
          </AccordionItem>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 space-y-4 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-start">
              <div className="p-2 mr-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <MessageSquareIcon size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 dark:text-white mb-1">Still need help?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Our support team is here to assist you with any questions or issues.
                </p>
              </div>
            </div>
            
            <div className="space-y-3 pl-11">
              <a href="mailto:support@savenbite.com" className="flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm">
                <MailIcon size={16} className="mr-2" />
                support@savenbite.com
              </a>
              <a href="tel:+27998776443" className="flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm">
                <PhoneIcon size={16} className="mr-2" />
                +27 99 877 6443
              </a>
              <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                <ClockIcon size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Business Hours:</p>
                  <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p>Saturday: 9:00 AM - 2:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

export default HelpMenu
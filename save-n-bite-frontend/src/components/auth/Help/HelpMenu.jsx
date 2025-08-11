import React, { useState } from 'react'
import { XIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

const AccordionItem = ({ title, children, isOpen, toggleOpen }) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <button
        onClick={toggleOpen}
        className="w-full py-4 px-5 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-gray-800 dark:text-gray-100">{title}</span>
        {isOpen ? (
          <ChevronUpIcon size={20} className="text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ChevronDownIcon size={20} className="text-emerald-600 dark:text-emerald-400" />
        )}
      </button>
      {isOpen && <div className="px-5 pb-4 text-gray-700 dark:text-gray-300">{children}</div>}
    </div>
  )
}

const HelpItem = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2 text-left flex justify-between items-center"
        aria-expanded={isOpen}
      >
        <span className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">{title}</span>
        {isOpen ? (
          <ChevronUpIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ChevronDownIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
        )}
      </button>
      {isOpen && (
        <div className="py-2 pl-4 pr-2 text-sm text-gray-600 dark:text-gray-300">{children}</div>
      )}
    </div>
  )
}

const HelpMenu = ({ isOpen, onClose }) => {
  const [openSection, setOpenSection] = useState('general')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md h-full overflow-y-auto animate-slide-in transition-colors duration-300">
        <div className="sticky top-0 bg-emerald-600 dark:bg-emerald-700 text-white px-5 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Help Center</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors"
            aria-label="Close help menu"
          >
            <XIcon size={24} />
          </button>
        </div>

        <div className="py-4">
          <AccordionItem
            title="General Help"
            isOpen={openSection === 'general'}
            toggleOpen={() =>
              setOpenSection(openSection === 'general' ? '' : 'general')
            }
          >
            <div className="space-y-1">
              <HelpItem title="What is Save n Bite?">
                <p>
                  Save n Bite is a platform that connects consumers with local
                  businesses to rescue surplus food that would otherwise go to
                  waste. We help reduce food waste while offering quality food
                  at discounted prices.
                </p>
              </HelpItem>
              <HelpItem title="Understanding user roles">
                <p>Save n Bite has three main user roles:</p>
                <ul className="list-disc list-inside mt-2 ml-2">
                  <li>Individual Consumers: Users who purchase surplus food.</li>
                  <li>
                    Organizations (NGOs): Entities that can request food donations and purchase surplus food.
                  </li>
                  <li>
                    Food Providers: Businesses that list surplus food items.
                  </li>
                </ul>
              </HelpItem>
              <HelpItem title="Notifications and alerts">
                <p>
                  You can manage your notification preferences in your Profile
                  Settings. We send alerts for pickup reminders, new deals,
                  order confirmations, and impact milestones.
                </p>
              </HelpItem>
              <HelpItem title="Contacting support">
                <p>
                  For additional help, you can contact our support team at
                  support@savenbite.com or call us at +27 998776443 during
                  business hours (9 AM - 5 PM, Monday to Friday).
                </p>
              </HelpItem>
            </div>
          </AccordionItem>

          <AccordionItem
            title="Help for Individual Consumers"
            isOpen={openSection === 'consumers'}
            toggleOpen={() =>
              setOpenSection(openSection === 'consumers' ? '' : 'consumers')
            }
          >
            <div className="space-y-1">
              <HelpItem title="Browsing food listings">
                <p>
                  Navigate to the "Browse Food" page to see all available food
                  listings. You can filter by location, price range, food type,
                  or pickup time to find items that match your preferences.
                </p>
              </HelpItem>
              <HelpItem title="Ordering and paying for food">
                <p>
                  When you find an item you want, click "Add to Cart." You can
                  then proceed to checkout, select a pickup time slot, enter your payment details, and
                  confirm your order. Payment is processed securely through our
                  platform.
                </p>
              </HelpItem>
              <HelpItem title="Scheduling pickups">
                <p>
                  After completing your purchase, you'll receive pickup
                  instructions with the pickup time slot you selected within the pickup window. Make sure to
                  arrive during this window with your order confirmation code.
                </p>
              </HelpItem>
              <HelpItem title="Viewing order history">
                <p>
                  You can view your past orders in the "Order History" section.
                  This shows all your previous purchases, including pickup
                  details and impact statistics.
                </p>
              </HelpItem>
              <HelpItem title="Leaving reviews or feedback">
                <p>
                  After picking up your order, you'll have the option to leave a
                  review for both the food provider and the specific items you
                  purchased. Your feedback helps improve the platform.
                </p>
              </HelpItem>
            </div>
          </AccordionItem>

          <AccordionItem
            title="Help for NGO/Organization Users"
            isOpen={openSection === 'organizations'}
            toggleOpen={() =>
              setOpenSection(
                openSection === 'organizations' ? '' : 'organizations'
              )
            }
          >
            <div className="space-y-1">
              <HelpItem title="Requesting donation items">
                <p>
                  As an organization, you can browse available donation items and discounted items. Navigate to the "Browse" tab to
                  see what's available.
                </p>
              </HelpItem>
              <HelpItem title="Viewing pickup details">
                <p>
                  Once your request is approved, you'll receive pickup
                  instructions. You can view all scheduled pickups in your
                  Order History.
                </p>
              </HelpItem>
              <HelpItem title="Tracking impact reports">
                <p>
                  Your Order History includes impact reports showing how many meals
                  you've distributed, CO₂ emissions saved, and other key
                  metrics.
                </p>
              </HelpItem>
            </div>
          </AccordionItem>

          <AccordionItem
            title="Frequently Asked Questions"
            isOpen={openSection === 'faq'}
            toggleOpen={() =>
              setOpenSection(openSection === 'faq' ? '' : 'faq')
            }
          >
            <div className="space-y-1">
              <HelpItem title="Is my payment information secure?">
                <p>
                  Yes, we use industry-standard encryption and secure payment
                  processors. We never store your full credit card details on
                  our servers.
                </p>
              </HelpItem>
              <HelpItem title="What happens if I miss my pickup window?">
                <p>
                 If you miss your pickup window, your order may be offered to another user or donated. However, if you arrive within a reasonable timeframe and it's still within the provider's specified pickup window, they may still honor the order at their discretion. It's best to contact the provider directly if you're running late or need to reschedule.
                </p>
              </HelpItem>
              <HelpItem title="Can I cancel my order?">
                <p>
                  Orders can be canceled up to 2 hours before the pickup window
                  starts. After that, cancellations are at the provider's
                  discretion.
                </p>
              </HelpItem>
              <HelpItem title="How do I know the food is safe?">
                <p>
                  All food providers on our platform must comply with local food
                  safety regulations. Items are properly stored and handled
                  according to health department guidelines.
                </p>
              </HelpItem>
              <HelpItem title="Can I get a refund?">
                <p>
                  Refund policies vary by provider. Generally, refunds are
                  available for canceled orders or if there are serious quality
                  issues with the food.
                </p>
              </HelpItem>
            </div>
          </AccordionItem>
        </div>
      </div>
    </div>
  )
}

export default HelpMenu

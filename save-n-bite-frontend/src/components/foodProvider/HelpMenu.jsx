import React, { useState } from 'react'
import { X as CloseIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { useOnboarding } from './OnboardingWalkthrough/OnboardingContext'

function AccordionItem({ title, children, isOpen, toggleOpen }) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        className="flex justify-between items-center w-full py-4 px-6 text-left font-medium focus:outline-none"
        onClick={toggleOpen}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="px-6 pb-4">{children}</div>}
    </div>
  )
}

export function HelpMenu({ onClose }) {
  const [openSections, setOpenSections] = useState({
    general: false,
    provider: false,
    faq: false,
  })

  const { startWalkthrough } = useOnboarding()

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleStartWalkthrough = () => {
    onClose()
    startWalkthrough()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col transition-colors duration-300">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200">Help Center</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
            aria-label="Close help menu"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Welcome to the Save n Bite Help Center. Find answers to common
              questions and learn how to make the most of our platform.
            </p>

            <div className="mb-6">
              <button
                onClick={handleStartWalkthrough}
                className="w-full py-3 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md font-medium transition-colors"
              >
                Start Platform Walkthrough
              </button>
            </div>

            <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <AccordionItem
                title="General Help"
                isOpen={openSections.general}
                toggleOpen={() => toggleSection('general')}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      What is Save n Bite?
                    </h3>
                    <p className="text-gray-600">
                      Save n Bite is a platform that connects food businesses with consumers to reduce food waste. Businesses can list surplus food items at discounted prices or as donations, helping to save perfectly good food from going to waste while offering great deals to consumers.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      How to update your profile
                    </h3>
                    <p className="text-gray-600">
                      Navigate to the Settings page using the sidebar menu. From there, you can update your business information, contact details, and notification preferences. Don't forget to save your changes before leaving the page.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      Understanding user roles
                    </h3>
                    <p className="text-gray-600">
                      Save n Bite has two main user roles: Food Providers and Consumers. Food Providers can list food items, manage pickups, and track sustainability metrics. Consumers can browse listings, place orders, and provide feedback.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      Notifications and alerts
                    </h3>
                    <p className="text-gray-600">
                      You'll receive notifications for new orders, pickup confirmations, and customer feedback. Manage your notification preferences in the Settings page to control which alerts you receive and how (email, in-app, or both).
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      Contacting support
                    </h3>
                    <p className="text-gray-600">
                      Need additional help? Contact our support team at <a href="mailto:support@savenbite.com" className="text-blue-600 underline">support@savenbite.com</a> or use the "Contact Support" button in the Settings page. Our team typically responds within 24 hours during business days.
                    </p>
                  </div>
                </div>
              </AccordionItem>
            </div>

            <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <AccordionItem
                title="Help for Food Providers"
                isOpen={openSections.provider}
                toggleOpen={() => toggleSection('provider')}
              >
                <div className="space-y-4">
                  
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      Creating and managing listings
                    </h3>
                    <p className="text-gray-600">
                      Click on "Create Listing" in the sidebar to add new food items. Fill in all required details including food name, description, quantity, and expiration date. You can save drafts or publish immediately. Manage all your listings from the "My Listings" page.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      Marking food as donation or discounted
                    </h3>
                    <p className="text-gray-600">
                      When creating a listing, you can choose to mark an item as a donation by checking the "Mark as Donation" box. For discounted items, leave this unchecked and specify the discounted price. You can highlight the original price in the description to show the savings.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      Managing pickup schedules
                    </h3>
                    <p className="text-gray-600">
                      Set pickup time ranges when creating listings. View and manage all scheduled pickups from the "Pickups" page. You can sort by date, mark pickups as completed, and communicate with customers directly through the platform if they're running late.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      Viewing orders and sustainability metrics
                    </h3>
                    <p className="text-gray-600">
                      Track your impact on the "Dashboard" page, which shows key metrics like meals saved, CO2 emissions reduced, and customer satisfaction. The "Orders/Feedback" page provides detailed information about each transaction and customer reviews.
                    </p>
                  </div>
                </div>
              </AccordionItem>
            </div>

            <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <AccordionItem
                title="Frequently Asked Questions"
                isOpen={openSections.faq}
                toggleOpen={() => toggleSection('faq')}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      How do I receive payment for sold items?
                    </h3>
                    <p className="text-gray-600">
                      Payments are processed through our secure payment system. Funds are transferred to your registered bank account within 3–5 business days after the customer picks up the order.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      What happens if a customer doesn't pick up their order?
                    </h3>
                    <p className="text-gray-600">
                      If a customer doesn't pick up their order during the specified time window, you can mark it as "No Show" in the Pickups page. The system will automatically notify the customer and you can choose to relist the item if it's still viable.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      Can I edit a listing after publishing it?
                    </h3>
                    <p className="text-gray-600">
                      Yes, you can edit listings that haven't been ordered yet. Navigate to "My Listings," find the item you want to modify, and click the "Edit" button. Once an item has been ordered, you can only edit certain fields like pickup instructions.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      How are the sustainability metrics calculated?
                    </h3>
                    <p className="text-gray-600">
                      Our sustainability metrics are calculated based on industry standards for food waste impact. Each completed order contributes to your total meals saved count, and CO₂ emissions are estimated based on the food type and quantity saved from landfill.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      What should I do if I have a dispute with a customer?
                    </h3>
                    <p className="text-gray-600">
                      If you encounter an issue with a customer, first try to resolve it through direct communication. For unresolved disputes, contact our support team with the order details and description of the issue. We'll mediate and help find a fair resolution.
                    </p>
                  </div>
                </div>
              </AccordionItem>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

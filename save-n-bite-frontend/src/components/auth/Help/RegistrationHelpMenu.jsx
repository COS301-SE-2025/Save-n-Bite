import React, { useState } from 'react'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  HelpCircleIcon,
  XIcon,
} from 'lucide-react'

const HelpCard = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-gray-800">{title}</span>
        {isOpen ? (
          <ChevronUpIcon size={20} className="text-emerald-600" />
        ) : (
          <ChevronDownIcon size={20} className="text-emerald-600" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-gray-50 text-gray-700 text-sm">
          {children}
        </div>
      )}
    </div>
  )
}

const RegistrationHelp = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-emerald-600 text-white px-5 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <HelpCircleIcon size={24} className="mr-2" />
            <h3 className="text-xl font-semibold">Need Help Registering?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-emerald-700 transition-colors"
            aria-label="Close help"
          >
            <XIcon size={24} />
          </button>
        </div>
        <div className="p-6 space-y-3">
          <HelpCard title="Registering as an Individual">
            <div className="space-y-2">
              <p>To register as an individual, you'll need:</p>
              <ul className="list-disc list-inside ml-2">
                <li>A valid email address</li>
                <li>Personal details (name, contact information)</li>
                <li>A secure password</li>
              </ul>
              <p>
                After registering, you'll receive a confirmation email to verify
                your account.
              </p>
              <a
                href="#"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Need more help? Contact support
              </a>
            </div>
          </HelpCard>

          <HelpCard title="Registering as an Organization (NGO)">
            <div className="space-y-2">
              <p>To register as an NGO, you'll need:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Organization name and details</li>
                <li>Proof of NGO status or registration number</li>
                <li>Contact information for the primary representative</li>
                <li>Organization location details</li>
              </ul>
              <p>Your application will be reviewed within 2-3 business days.</p>
              <a
                href="#"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Need more help? Contact support
              </a>
            </div>
          </HelpCard>

          <HelpCard title="Registering as a Food Provider">
            <div className="space-y-2">
              <p>To register as a food provider, you'll need:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Business name and details</li>
                <li>Business license or registration number</li>
                <li>Food handling certifications</li>
                <li>Store location and operating hours</li>
                <li>Contact information for account management</li>
              </ul>
              <p>Your application will be reviewed within 1-2 business days.</p>
              <a
                href="#"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Need more help? Contact support
              </a>
            </div>
          </HelpCard>
        </div>
      </div>
    </div>
  )
}

export default RegistrationHelp

import React, { useState } from 'react'
import {
  XIcon,
  SparklesIcon,
  LightbulbIcon,
  AlertCircleIcon,
  InfoIcon,
  StarIcon,
} from 'lucide-react'
import { toast } from 'sonner'

const NotificationComposer = ({ onClose, onSend }) => {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('All Users')
  const [isLoading, setIsLoading] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [notificationType, setNotificationType] = useState('update')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please enter a notification title')
      return
    }
    if (!message.trim()) {
      toast.error('Please enter a notification message')
      return
    }
    onSend({
      title,
      message,
      audience,
    })
  }

  const generateAIContent = () => {
    setShowAIModal(true)
  }

  const handleAIGeneration = () => {
    if (!aiPrompt.trim()) {
      toast.error('Please provide context for the AI to generate content')
      return
    }
    setIsLoading(true)
    setShowAIModal(false)
    setTimeout(() => {
      let generatedTitle = ''
      let generatedMessage = ''
      const promptLower = aiPrompt.toLowerCase()
      switch (notificationType) {
        case 'update':
          generatedTitle = promptLower.includes('feature')
            ? 'New Feature Announcement'
            : 'Important Platform Update'
          generatedMessage = `We're excited to announce updates to our platform based on your feedback about ${aiPrompt}.\n\nWe've made improvements to our food listing process to make it easier for providers to share available items. Additionally, we've enhanced our search functionality to help users find food more efficiently based on location and preferences.\n\nThank you for being part of our community and helping reduce food waste!`
          break
        case 'maintenance':
          generatedTitle = 'Scheduled Maintenance Notice'
          generatedMessage = `We will be performing scheduled maintenance related to ${aiPrompt}.\n\nDuring this time, the platform will be temporarily unavailable. We expect the maintenance to last approximately 2 hours.\n\nWe apologize for any inconvenience this may cause and appreciate your understanding as we work to improve our service.`
          break
        case 'announcement':
          generatedTitle = promptLower.includes('partnership')
            ? 'New Partnership Announcement'
            : 'Important Announcement'
          generatedMessage = `We have some exciting news to share regarding ${aiPrompt}!\n\nThis development will help us further our mission of reducing food waste and connecting surplus food with those who need it most.\n\nStay tuned for more details in the coming weeks. Thank you for your continued support of our platform and mission.`
          break
        case 'alert':
          generatedTitle = 'Important Alert'
          generatedMessage = `We need to inform you about an important situation regarding ${aiPrompt}.\n\nPlease be aware of this information as it may affect your experience on our platform. We're working diligently to address this matter and will provide updates as soon as they're available.\n\nIf you have any questions or concerns, please contact our support team.`
          break
      }
      setTitle(generatedTitle)
      setMessage(generatedMessage)
      setIsLoading(false)
      toast.success('AI-generated content created based on your prompt')
      setAiPrompt('')
    }, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Create Notification
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XIcon size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="notification-title" className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      id="notification-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Notification title"
                    />
                  </div>
                  <div>
                    <label htmlFor="notification-message" className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      id="notification-message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Notification message"
                    ></textarea>
                  </div>
                  <div>
                    <label htmlFor="notification-audience" className="block text-sm font-medium text-gray-700">Audience</label>
                    <select
                      id="notification-audience"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="All Users">All Users</option>
                      <option value="Providers">Providers Only</option>
                      <option value="Consumers">Consumers Only</option>
                      <option value="NGOs">NGOs Only</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={generateAIContent}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <SparklesIcon className="mr-2 h-4 w-4" />
                      Generate AI Content
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title || !message || isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating...' : 'Send Notification'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* AI Content Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  onClick={() => setShowAIModal(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <XIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <SparklesIcon
                      className="h-6 w-6 text-blue-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Generate AI Content
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Provide context about what you want to communicate, and
                      our AI will generate a notification for you.
                    </p>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label
                          htmlFor="notification-type"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Notification Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setNotificationType('update')}
                            className={`flex items-center px-3 py-2 rounded-md text-sm ${notificationType === 'update' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'}`}
                          >
                            <LightbulbIcon className="h-4 w-4 mr-2" />
                            Platform Update
                          </button>
                          <button
                            type="button"
                            onClick={() => setNotificationType('maintenance')}
                            className={`flex items-center px-3 py-2 rounded-md text-sm ${notificationType === 'maintenance' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'}`}
                          >
                            <AlertCircleIcon className="h-4 w-4 mr-2" />
                            Maintenance
                          </button>
                          <button
                            type="button"
                            onClick={() => setNotificationType('announcement')}
                            className={`flex items-center px-3 py-2 rounded-md text-sm ${notificationType === 'announcement' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'}`}
                          >
                            <InfoIcon className="h-4 w-4 mr-2" />
                            Announcement
                          </button>
                          <button
                            type="button"
                            onClick={() => setNotificationType('alert')}
                            className={`flex items-center px-3 py-2 rounded-md text-sm ${notificationType === 'alert' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'}`}
                          >
                            <AlertCircleIcon className="h-4 w-4 mr-2" />
                            Alert
                          </button>
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="ai-prompt"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Context for AI (What do you want to communicate?)
                        </label>
                        <textarea
                          id="ai-prompt"
                          rows={4}
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="E.g., 'We're launching a new feature that allows users to rate food quality' or 'We need to perform database maintenance'"
                        ></textarea>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-md">
                        <h4 className="text-sm font-medium text-blue-800 flex items-center">
                          <StarIcon className="h-4 w-4 mr-2" />
                          Prompt Tips
                        </h4>
                        <ul className="mt-2 text-xs text-blue-700 space-y-1 ml-6 list-disc">
                          <li>
                            Be specific about what you're announcing or
                            notifying users about
                          </li>
                          <li>
                            Include any key details that should be mentioned
                          </li>
                          <li>
                            Specify the tone you want (excited, informative,
                            urgent, etc.)
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAIGeneration}
                  disabled={!aiPrompt.trim()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SparklesIcon className="mr-2 h-4 w-4" />
                  Generate Notification Content
                </button>
                <button
                  type="button"
                  onClick={() => setShowAIModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationComposer

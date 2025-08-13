import React, { useState } from 'react'
import { HelpCircleIcon } from 'lucide-react'
import { HelpMenu } from './HelpMenu'

export function HelpButton() {
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const toggleHelp = () => {
    setIsHelpOpen(!isHelpOpen)
  }

  return (
    <>
      <button
        onClick={toggleHelp}
        className="fixed bottom-6 right-6 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white p-3 rounded-full shadow-lg z-50 flex items-center justify-center transition-all duration-200 hover:scale-105"
        aria-label="Help"
      >
        <HelpCircleIcon className="h-6 w-6" />
      </button>
      {isHelpOpen && <HelpMenu onClose={() => setIsHelpOpen(false)} />}
    </>
  )
}

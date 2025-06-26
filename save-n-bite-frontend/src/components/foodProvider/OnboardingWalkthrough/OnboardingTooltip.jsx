import React, { useState } from 'react'
import { X as CloseIcon } from 'lucide-react'
import { Button } from '../Button'

export function OnboardingTooltip({
  title,
  content,
  position,
  onNext,
  onSkip,
  showFinish = false,
  showNext = true,
  showStart = false,
  showCloseOption = false,
  targetElement,
}) {
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
      case 'center':
        return 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
    }
  }

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45'
      case 'right':
        return 'left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45'
      case 'bottom':
        return 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45'
      case 'left':
        return 'right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45'
      case 'center':
        return 'hidden'
      default:
        return 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45'
    }
  }

  const handleNextClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onNext()
  }

  const handleSkipClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onSkip()
  }

  return (
    <div
      className={`absolute z-[1000] ${getPositionClasses()} ${position === 'center' ? 'w-[90%] max-w-md' : 'w-64'}`}
      data-target={targetElement}
    >
      <div className="relative bg-white rounded-lg shadow-xl border-2 border-blue-600 p-4">
        {position !== 'center' && (
          <div
            className={`absolute w-4 h-4 bg-white border-2 border-blue-600 ${getArrowClasses()}`}
            style={{
              borderRight: 'none',
              borderBottom: 'none',
            }}
          ></div>
        )}

        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-bold text-blue-900 mb-2">{title}</h3>
          )}
          <p className="text-gray-700">{content}</p>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handleSkipClick}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            type="button"
          >
            {showFinish ? 'Close' : 'Skip Tour'}
          </button>

          <div className="flex space-x-2">
            {showCloseOption && (
              <button
                onClick={handleSkipClick}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-medium"
                type="button"
              >
                Close
              </button>
            )}
            {showStart && (
              <Button onClick={handleNextClick} size="sm" type="button">
                Start
              </Button>
            )}
            {showNext && !showFinish && !showStart && (
              <Button onClick={handleNextClick} size="sm" type="button">
                Next
              </Button>
            )}
            {showFinish && (
              <Button onClick={handleNextClick} size="sm" type="button">
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

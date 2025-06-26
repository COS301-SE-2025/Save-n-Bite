import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from './OnboardingContext'
import { OnboardingTooltip } from './OnboardingTooltip'

export function Onboarding() {
  const {
    isWalkthroughActive,
    currentStep,
    nextStep,
    skipWalkthrough,
    finishWalkthrough,
  } = useOnboarding()

  const navigate = useNavigate()
  const [targetElement, setTargetElement] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState('center')

  useEffect(() => {
    if (!isWalkthroughActive) return

    let selector = ''
    let position = 'bottom'

    switch (currentStep) {
      case 1:
        position = 'center'
        break
      case 2:
        selector = "[data-onboarding='dashboard-stats']"
        position = 'bottom'
        break 
      case 3:
        selector = "[data-onboarding='nav-createlisting']"
        position = 'right'
        break
      case 4:
        selector = "[data-onboarding='nav-listingoverview']"
        position = 'right'
        break
      case 5:
        selector = "[data-onboarding='nav-pickup-coordination']"
        position = 'right'
        break
      case 6:
         selector = "[data-onboarding='nav-orders-and-feedback']"
        position = 'right'
        break
      case 7:
        position = 'center'
        break
      default:
        break
    }

    setTooltipPosition(position)

    if (selector) {
      const element = document.querySelector(selector)
      setTargetElement(element)

      if (currentStep === 2 && window.location.pathname !== '/dashboard') {
        navigate('/dashboard')
      }
    } else {
      setTargetElement(null)
    }
  }, [currentStep, isWalkthroughActive, navigate])

  const handleNext = () => {
    if (currentStep === 7) {
      finishWalkthrough()
    } else {
      nextStep()
    }
  }

  const handleSkip = () => {
    skipWalkthrough()
  }

  const handleFinalAction = (action) => {
    finishWalkthrough()
    if (action === 'create') {
      navigate('/create-listing')
    } else {
      navigate('/dashboard')
    }
  }

  if (!isWalkthroughActive) return null

  const createSpotlight = () => {
    if (!targetElement || tooltipPosition === 'center') return null
    const rect = targetElement.getBoundingClientRect()
    const padding = 5

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[999] pointer-events-none"
        style={{
          boxShadow: `0 0 0 5000px rgba(0, 0, 0, 0.5), 
                      inset ${rect.left - padding}px 
                      ${rect.top - padding}px 
                      0 0 rgba(0, 0, 0, 0.3),
                      inset ${-window.innerWidth + rect.right + padding}px 
                      ${rect.top - padding}px 
                      0 0 rgba(0, 0, 0, 0.3),
                      inset ${rect.left - padding}px 
                      ${-window.innerHeight + rect.bottom + padding}px 
                      0 0 rgba(0, 0, 0, 0.3),
                      inset ${-window.innerWidth + rect.right + padding}px 
                      ${-window.innerHeight + rect.bottom + padding}px 
                      0 0 rgba(0, 0, 0, 0.3)`,
        }}
      />
    )
  }

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return {
          title: 'Welcome to Save n Bite!',
          content:
            "Welcome to Save n Bite. Let's walk through how you can list and manage surplus food.",
          position: 'center',
          showStart: true,
        }
      case 2:
        return {
          title: 'Dashboard Overview',
          content:
            "This is your dashboard. Quickly see how many listings you have, how many orders you've fulfilled, and the impact you're making.",
          position: tooltipPosition,
        }
      case 3:
        return {
          title: 'Create Listing',
          content:
            'Click here to create a new food listing. You can add details like quantity, expiration, price, or mark it as a donation.',
          position: tooltipPosition,
        }
      case 4:
        return {
          title: 'My Listings',
          content:
            'Manage your existing listings here. You can edit, deactivate, or remove items at any time.',
          position: tooltipPosition,
        }
      case 5:
        return {
          title: 'Manage Pickups',
          content:
            'See upcoming pickup times and mark when customers have collected their orders.',
          position: tooltipPosition,
        }
      case 6:
        return {
          title: 'Orders & Feedback',
          content:
            "Track who's ordered from you and read reviews from customers. Great listings mean great ratings.",
          position: tooltipPosition,
        }
      case 7:
        return {
          title: "You're All Set!",
          content:
            "That's it! You're all set to start sharing surplus food and making a positive impact. Let's get listing!",
          position: 'center',
          showFinish: true,
          showCloseOption: true,
        }
      default:
        return {
          content: '',
          position: 'center',
        }
    }
  }

  const stepContent = getStepContent()

  if (currentStep === 7) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[999]" />
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl border-2 border-blue-600 p-6 z-[1000] w-[90%] max-w-md">
          <h3 className="text-xl font-bold text-blue-900 mb-3">
            You're All Set!
          </h3>
          <p className="text-gray-700 mb-6">
            That's it! You're all set to start sharing surplus food and making a
            positive impact. Let's get listing!
          </p>
          <div className="flex justify-between">
            <button
              onClick={() => finishWalkthrough()}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
            <div className="space-x-3">
              <button
                onClick={() => handleFinalAction('dashboard')}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => handleFinalAction('create')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                Create Listing
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {createSpotlight()}
      <div className="fixed inset-0 z-[1000]">
        <div className="relative w-full h-full">
          {targetElement && tooltipPosition !== 'center' ? (
            <div
              style={{
                position: 'absolute',
                top: `${targetElement.getBoundingClientRect().top}px`,
                left: `${targetElement.getBoundingClientRect().left}px`,
                width: `${targetElement.getBoundingClientRect().width}px`,
                height: `${targetElement.getBoundingClientRect().height}px`,
              }}
            >
              <OnboardingTooltip
                title={stepContent.title}
                content={stepContent.content}
                position={stepContent.position}
                onNext={handleNext}
                onSkip={handleSkip}
                showFinish={stepContent.showFinish}
                showStart={stepContent.showStart}
                showCloseOption={stepContent.showCloseOption}
                targetElement={targetElement.id}
              />
            </div>
          ) : (
            <OnboardingTooltip
              title={stepContent.title}
              content={stepContent.content}
              position={stepContent.position}
              onNext={handleNext}
              onSkip={handleSkip}
              showFinish={stepContent.showFinish}
              showStart={stepContent.showStart}
              showCloseOption={stepContent.showCloseOption}
            />
          )}
        </div>
      </div>
    </>
  )
}
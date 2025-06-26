import React, { useState, createContext, useContext } from 'react'
import { useLocation } from 'react-router-dom'

const OnboardingContext = createContext(undefined)

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

export const OnboardingProvider = ({ children }) => {
  const [isWalkthroughActive, setIsWalkthroughActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const location = useLocation()

  const startWalkthrough = () => {
    setCurrentStep(1)
    setIsWalkthroughActive(true)
  }

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1)
  }

  const skipWalkthrough = () => {
    setIsWalkthroughActive(false)
    setCurrentStep(1)
  }

  const finishWalkthrough = () => {
    setIsWalkthroughActive(false)
    setCurrentStep(1)
  }

  const goToStep = (step) => {
    setCurrentStep(step)
  }

  return (
    <OnboardingContext.Provider
      value={{
        isWalkthroughActive,
        currentStep,
        startWalkthrough,
        nextStep,
        skipWalkthrough,
        finishWalkthrough,
        goToStep,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

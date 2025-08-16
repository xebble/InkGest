'use client';


import { useBooking } from './BookingProvider';

export function BookingNavigation() {
  const { state, nextStep, prevStep, canProceedToNextStep } = useBooking();

  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === state.steps.length - 1;

  return (
    <div className="bg-gray-50 px-6 py-4 border-t">
      <div className="flex items-center justify-between">
        <div>
          {!isFirstStep && (
            <button
              onClick={prevStep}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Step indicator */}
          <span className="text-sm text-gray-500">
            Step {state.currentStep + 1} of {state.steps.length}
          </span>

          {!isLastStep && (
            <button
              onClick={nextStep}
              disabled={!canProceedToNextStep()}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <span>
                {state.currentStep === state.steps.length - 2 ? 'Review' : 'Continue'}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
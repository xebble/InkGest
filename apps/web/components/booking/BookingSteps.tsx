'use client';

import { useBooking, type BookingStep } from './BookingProvider';

interface BookingStepsProps {
  steps: BookingStep[];
  currentStep: number;
}

export function BookingSteps({ steps, currentStep }: BookingStepsProps) {
  const { goToStep } = useBooking();

  return (
    <div className="bg-gray-50 px-6 py-4">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, index) => (
            <li key={step.id} className="relative flex-1">
              {index !== steps.length - 1 && (
                <div className="absolute top-4 left-1/2 w-full h-0.5 bg-gray-200">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    style={{ 
                      width: index < currentStep ? '100%' : '0%' 
                    }}
                  />
                </div>
              )}
              
              <button
                onClick={() => {
                  // Only allow going back to completed steps
                  if (index < currentStep || step.completed) {
                    goToStep(index);
                  }
                }}
                className={`relative flex flex-col items-center group ${
                  index < currentStep || step.completed
                    ? 'cursor-pointer'
                    : 'cursor-default'
                }`}
                disabled={index > currentStep && !step.completed}
              >
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-200 ${
                    index === currentStep
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : index < currentStep || step.completed
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 bg-white text-gray-500'
                  }`}
                >
                  {index < currentStep || step.completed ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                
                <span
                  className={`mt-2 text-xs font-medium transition-all duration-200 ${
                    index === currentStep
                      ? 'text-blue-600'
                      : index < currentStep || step.completed
                      ? 'text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Service, Artist } from '@/types';

export interface BookingStep {
  id: 'service' | 'artist' | 'datetime' | 'client' | 'confirmation';
  title: string;
  completed: boolean;
}

export interface BookingState {
  currentStep: number;
  steps: BookingStep[];
  selectedService: Service | null;
  selectedArtist: (Artist & { user: { id: string; name: string } }) | null;
  selectedDateTime: Date | null;
  clientData: {
    name: string;
    email: string;
    phone: string;
    birthDate?: Date;
    isMinor: boolean;
    guardianInfo?: {
      name: string;
      email: string;
      phone: string;
      relationship: 'parent' | 'guardian' | 'other';
      idDocument: string;
    };
    medicalInfo?: {
      allergies: string[];
      medications: string[];
      conditions: string[];
      notes?: string;
    };
    imageRights: boolean;
    notes?: string;
  };
  availableSlots: Date[];
  isLoading: boolean;
  error: string | null;
}

type BookingAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_SERVICE'; payload: Service }
  | { type: 'SET_ARTIST'; payload: Artist & { user: { id: string; name: string } } }
  | { type: 'SET_DATETIME'; payload: Date }
  | { type: 'SET_CLIENT_DATA'; payload: Partial<BookingState['clientData']> }
  | { type: 'SET_AVAILABLE_SLOTS'; payload: Date[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_BOOKING' }
  | { type: 'COMPLETE_STEP'; payload: number };

const initialState: BookingState = {
  currentStep: 0,
  steps: [
    { id: 'service', title: 'Select Service', completed: false },
    { id: 'artist', title: 'Choose Artist', completed: false },
    { id: 'datetime', title: 'Pick Date & Time', completed: false },
    { id: 'client', title: 'Your Information', completed: false },
    { id: 'confirmation', title: 'Confirmation', completed: false },
  ],
  selectedService: null,
  selectedArtist: null,
  selectedDateTime: null,
  clientData: {
    name: '',
    email: '',
    phone: '',
    isMinor: false,
    imageRights: false,
  },
  availableSlots: [],
  isLoading: false,
  error: null,
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };

    case 'SET_SERVICE':
      return {
        ...state,
        selectedService: action.payload,
        selectedArtist: null, // Reset artist when service changes
        selectedDateTime: null, // Reset datetime when service changes
        availableSlots: [],
      };

    case 'SET_ARTIST':
      return {
        ...state,
        selectedArtist: action.payload,
        selectedDateTime: null, // Reset datetime when artist changes
        availableSlots: [],
      };

    case 'SET_DATETIME':
      return {
        ...state,
        selectedDateTime: action.payload,
      };

    case 'SET_CLIENT_DATA':
      return {
        ...state,
        clientData: {
          ...state.clientData,
          ...action.payload,
        },
      };

    case 'SET_AVAILABLE_SLOTS':
      return {
        ...state,
        availableSlots: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'COMPLETE_STEP':
      return {
        ...state,
        steps: state.steps.map((step, index) =>
          index === action.payload ? { ...step, completed: true } : step
        ),
      };

    case 'RESET_BOOKING':
      return initialState;

    default:
      return state;
  }
}

interface BookingContextType {
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  canProceedToNextStep: () => boolean;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

interface BookingProviderProps {
  children: ReactNode;
  storeId: string;
}

export function BookingProvider({ children }: BookingProviderProps) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const nextStep = () => {
    if (state.currentStep < state.steps.length - 1) {
      dispatch({ type: 'COMPLETE_STEP', payload: state.currentStep });
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
  };

  const prevStep = () => {
    if (state.currentStep > 0) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < state.steps.length) {
      dispatch({ type: 'SET_STEP', payload: step });
    }
  };

  const canProceedToNextStep = (): boolean => {
    switch (state.currentStep) {
      case 0: // Service selection
        return !!state.selectedService;
      case 1: // Artist selection
        return !!state.selectedArtist;
      case 2: // DateTime selection
        return !!state.selectedDateTime;
      case 3: // Client information
        return !!(
          state.clientData.name &&
          state.clientData.email &&
          state.clientData.phone &&
          (!state.clientData.isMinor || state.clientData.guardianInfo)
        );
      case 4: // Confirmation
        return false; // This is the final step
      default:
        return false;
    }
  };

  const resetBooking = () => {
    dispatch({ type: 'RESET_BOOKING' });
  };

  const contextValue: BookingContextType = {
    state,
    dispatch,
    nextStep,
    prevStep,
    goToStep,
    canProceedToNextStep,
    resetBooking,
  };

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
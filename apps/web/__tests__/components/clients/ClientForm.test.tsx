import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ClientForm from '../../../components/clients/ClientForm';
// import type { CreateClientData } from '../../../types';

// Mock messages
const messages = {
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
  },
  clients: {
    create: 'New Client',
    edit: 'Edit Client',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    birthDate: 'Birth Date',
    isMinor: 'Is Minor',
    guardian: 'Legal Guardian',
    medicalInfo: 'Medical Information',
    imageRights: 'Image Rights',
  },
};

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

const defaultProps = {
  storeId: 'store-123',
  onSubmit: mockOnSubmit,
  onCancel: mockOnCancel,
  isLoading: false,
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider messages={messages} locale="en">
      <div>{component}</div>
    </NextIntlClientProvider>
  );
};

describe('ClientForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form fields correctly', () => {
    renderWithIntl(<ClientForm {...defaultProps} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/birth date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/is minor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/image rights/i)).toBeInTheDocument();
  });

  it('should show guardian form when minor is checked', async () => {
    renderWithIntl(<ClientForm {...defaultProps} />);

    const minorCheckbox = screen.getByLabelText(/is minor/i);
    fireEvent.click(minorCheckbox);

    await waitFor(() => {
      expect(screen.getByText(/legal guardian/i)).toBeInTheDocument();
    });
  });

  it('should update form fields correctly', async () => {
    renderWithIntl(<ClientForm {...defaultProps} />);

    // Fill form with valid data
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const phoneInput = screen.getByLabelText(/phone/i);

    fireEvent.change(nameInput, {
      target: { value: 'John Doe' },
    });
    fireEvent.change(emailInput, {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(phoneInput, {
      target: { value: '+1234567890' },
    });

    expect(nameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(phoneInput).toHaveValue('+1234567890');
  });

  it('should call onCancel when cancel button is clicked', () => {
    renderWithIntl(<ClientForm {...defaultProps} />);

    fireEvent.click(screen.getByText(/cancel/i));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    renderWithIntl(<ClientForm {...defaultProps} isLoading={true} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should populate form when editing existing client', () => {
    const existingClient = {
      id: 'client-123',
      storeId: 'store-123',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+0987654321',
      birthDate: new Date('1990-01-01'),
      isMinor: false,
      guardianInfo: null,
      medicalInfo: null,
      imageRights: true,
      source: 'referral',
      loyaltyPoints: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    renderWithIntl(<ClientForm {...defaultProps} client={existingClient} />);

    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+0987654321')).toBeInTheDocument();
    expect(screen.getByDisplayValue('referral')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    renderWithIntl(<ClientForm {...defaultProps} />);

    // Try to submit empty form
    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() => {
      // Form should not be submitted due to validation
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('should show medical information form when toggled', async () => {
    renderWithIntl(<ClientForm {...defaultProps} />);

    const showMedicalButton = screen.getByText(/mostrar/i);
    fireEvent.click(showMedicalButton);

    await waitFor(() => {
      expect(screen.getByText(/alergias/i)).toBeInTheDocument();
      expect(screen.getByText(/medicamentos/i)).toBeInTheDocument();
      expect(screen.getByText(/condiciones médicas/i)).toBeInTheDocument();
    });
  });
});
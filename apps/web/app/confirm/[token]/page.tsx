'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle, XCircle, Clock, Calendar, User, MapPin } from 'lucide-react';

interface AppointmentData {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  client: {
    name: string;
    email: string;
  };
  service: {
    name: string;
    description?: string;
  };
  artist: {
    user: {
      name: string;
    };
  };
  store: {
    name: string;
  };
}

interface ConfirmationResponse {
  success: boolean;
  data: {
    valid: boolean;
    appointment?: AppointmentData;
    error?: string;
  };
}

export default function ConfirmAppointmentPage() {
  const params = useParams();
  const token = params['token'] as string;
  
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/appointments/confirm/${token}`);
      const result: ConfirmationResponse = await response.json();

      if (result.success && result.data.valid && result.data.appointment) {
        setAppointment(result.data.appointment);
      } else {
        setError(result.data.error || 'Invalid or expired confirmation link');
      }
    } catch (err) {
      setError('Failed to validate confirmation link');
    } finally {
      setLoading(false);
    }
  };

  const confirmAppointment = async () => {
    setConfirming(true);
    try {
      const response = await fetch(`/api/appointments/confirm/${token}`, {
        method: 'POST'
      });
      
      const result = await response.json();

      if (result.success) {
        setConfirmed(true);
      } else {
        setError(result.error || 'Failed to confirm appointment');
      }
    } catch (err) {
      setError('Failed to confirm appointment');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating confirmation link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Confirmation Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Please contact the studio if you need assistance with your appointment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">Appointment Confirmed!</CardTitle>
            <CardDescription>
              Your appointment has been successfully confirmed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              You will receive a reminder before your appointment. Thank you!
            </p>
            {appointment && (
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="font-semibold mb-2">Appointment Details:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>
                      {new Date(appointment.startTime).toLocaleDateString()} at{' '}
                      {new Date(appointment.startTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{appointment.service.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{appointment.store.name}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <CardTitle>Confirm Your Appointment</CardTitle>
          <CardDescription>
            Please confirm your upcoming appointment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointment && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Appointment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client:</span>
                    <span className="font-medium">{appointment.client.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{appointment.service.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Artist:</span>
                    <span className="font-medium">{appointment.artist.user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Studio:</span>
                    <span className="font-medium">{appointment.store.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {new Date(appointment.startTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">
                      {new Date(appointment.startTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {new Date(appointment.endTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">€{appointment.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={confirmAppointment} 
                disabled={confirming}
                className="w-full"
                size="lg"
              >
                {confirming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Confirming...
                  </>
                ) : (
                  'Confirm Appointment'
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By confirming, you agree to attend this appointment at the scheduled time.
                If you need to cancel or reschedule, please contact the studio directly.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
'use client'

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  CalendarIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface BookingWidgetProps {
  businessId: string;
  theme?: 'light' | 'dark';
  primaryColor?: string;
  compact?: boolean;
}

interface Service {
  id: string;
  name: string;
  category: string;
  duration_minutes: number;
  price: number;
  description?: string;
}

interface Business {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
}

export default function BookingWidget({ 
  businessId, 
  theme = 'light',
  primaryColor = '#8B5CF6',
  compact = false 
}: BookingWidgetProps) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: ''
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Load business and services
  useEffect(() => {
    loadBusinessData();
  }, [businessId]);

  const loadBusinessData = async () => {
    try {
      // Load business info
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id, name, phone, address')
        .eq('id', businessId)
        .single();
      
      if (businessError) throw businessError;
      setBusiness(businessData);

      // Load services  
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name, category, duration_minutes, price')
        .eq('business_id', businessId)
        .eq('is_active', true);
      
      if (servicesError) throw servicesError;
      setServices(servicesData || []);
    } catch (err: any) {
      setError('Failed to load booking information');
      console.error('Error loading business data:', err);
    }
  };

  const checkAvailability = async (date: string) => {
    if (!selectedService) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use existing availability API
      const response = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          preferred_date: date,
          service_type: selectedService.category
        })
      });
      
      if (!response.ok) throw new Error('Failed to check availability');
      
      const result = await response.json();
      setAvailableSlots(result.available_times || []);
    } catch (err: any) {
      setError('Failed to check availability');
      console.error('Availability check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const bookAppointment = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use existing booking API 
      const response = await fetch('/api/book-appointment', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_email: customerInfo.email,
          service_type: selectedService.category,
          appointment_date: selectedDate,
          start_time: selectedTime,
          booking_source: 'web'
        })
      });
      
      if (!response.ok) throw new Error('Failed to book appointment');
      
      const result = await response.json();
      
      if (result.success) {
        setBookingId(result.booking_id);
        setStep(4); // Show confirmation
      } else {
        throw new Error(result.error || 'Booking failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourInt = parseInt(hour);
    const period = hourInt >= 12 ? 'PM' : 'AM';
    const displayHour = hourInt > 12 ? hourInt - 12 : hourInt === 0 ? 12 : hourInt;
    return `${displayHour}:${minute} ${period}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isFormValid = () => {
    return customerInfo.name.trim() && 
           customerInfo.phone.trim() && 
           customerInfo.email.trim();
  };

  if (error && !business) {
    return (
      <div className="booking-widget bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800 text-center">
          <p className="font-medium">Unable to load booking</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`booking-widget ${compact ? 'max-w-sm' : 'max-w-md'} mx-auto bg-white rounded-xl shadow-lg border border-gray-200`}
      style={{ '--primary-color': primaryColor } as any}
    >
      {/* Header */}
      <div className="widget-header bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-xl">
        <h3 className="text-lg font-semibold">
          {business?.name ? `Book with ${business.name}` : 'Book Appointment'}
        </h3>
        <div className="text-sm opacity-90">Step {step} of 4</div>
        
        {/* Progress bar */}
        <div className="mt-3 w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="service-selection">
            <h4 className="text-lg font-medium mb-4">Choose a Service</h4>
            
            {services.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <p>Loading services...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {services.map(service => (
                  <button
                    key={service.id}
                    className={`w-full p-4 rounded-lg border-2 transition text-left ${
                      selectedService?.id === service.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedService(service)}
                  >
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-600 flex items-center mt-1">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {service.duration_minutes}min • ${service.price}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {selectedService && (
              <button 
                onClick={() => setStep(2)} 
                className="w-full mt-4 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition flex items-center justify-center"
              >
                Continue
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {step === 2 && (
          <div className="datetime-selection">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Back to Services
            </button>
            
            <h4 className="text-lg font-medium mb-4">Select Date & Time</h4>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Date
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                  type="date"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    checkAvailability(e.target.value);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Checking availability...</p>
              </div>
            )}
            
            {availableSlots.length > 0 && !loading && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Times
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map(time => (
                    <button
                      key={time}
                      className={`py-2 px-3 text-sm rounded-lg border-2 transition ${
                        selectedTime === time
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {formatTime(time)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {selectedDate && availableSlots.length === 0 && !loading && (
              <div className="text-center py-4 text-gray-500">
                <p>No available times on this date.</p>
                <p className="text-sm">Please try a different date.</p>
              </div>
            )}
            
            {selectedTime && (
              <button 
                onClick={() => setStep(3)} 
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition flex items-center justify-center"
              >
                Continue
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        )}

        {/* Step 3: Customer Information */}
        {step === 3 && (
          <div className="customer-info">
            <button 
              onClick={() => setStep(2)}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Back to Date & Time
            </button>
            
            <h4 className="text-lg font-medium mb-4">Your Information</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter your full name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="(555) 123-4567"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="your@email.com"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={bookAppointment}
              disabled={!isFormValid() || loading}
              className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Book Appointment
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="confirmation text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-10 h-10 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-green-800">Booking Confirmed!</h4>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h5 className="font-medium text-gray-900 mb-3">Appointment Details:</h5>
              <div className="space-y-2 text-sm">
                <p><strong>Service:</strong> {selectedService?.name}</p>
                <p><strong>Date:</strong> {formatDate(selectedDate)}</p>
                <p><strong>Time:</strong> {formatTime(selectedTime)}</p>
                <p><strong>Duration:</strong> {selectedService?.duration_minutes} minutes</p>
                <p><strong>Price:</strong> ${selectedService?.price}</p>
                {bookingId && <p><strong>Confirmation:</strong> #{bookingId}</p>}
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              <p>We've sent a confirmation to {customerInfo.email}</p>
              <p>You can also call us at {business?.phone} if needed</p>
            </div>
            
            <button 
              onClick={() => {
                setStep(1);
                setSelectedService(null);
                setSelectedDate('');
                setSelectedTime('');
                setCustomerInfo({ name: '', phone: '', email: '' });
                setBookingId(null);
              }}
              className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition"
            >
              Book Another Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
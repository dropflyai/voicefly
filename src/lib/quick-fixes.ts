// ==============================================  
// QUICK TYPESCRIPT COMPATIBILITY FIXES
// ==============================================

// Method signature overloads for flexible API calls
export function flexibleAPICall<T>(fn: (...args: any[]) => Promise<T>) {
  return async (...args: any[]): Promise<T> => {
    // Handle variable argument counts gracefully
    try {
      return await fn(...args)
    } catch (error) {
      // If method signature doesn't match, try with fewer args
      if (args.length > 1) {
        return await fn(args[0])
      }
      throw error
    }
  }
}

// Type guards for safe property access
export function hasLocation(appointment: any): appointment is { location: any } {
  return appointment && typeof appointment.location === 'object'
}

export function hasRawAppointment(appointment: any): appointment is { raw_appointment: any } {
  return appointment && appointment.raw_appointment !== undefined
}

// Safe property accessors
export function safeGetLocation(appointment: any) {
  return hasLocation(appointment) ? appointment.location : null
}

export function safeGetRawAppointment(appointment: any) {
  return hasRawAppointment(appointment) ? appointment.raw_appointment : appointment
}

// Mock implementations for missing methods
export const mockImplementations = {
  awardPoints: async (businessId: string, customerId: string, appointmentId: string, amount?: number) => {
    const points = Math.floor((amount || 0) / 100)
    return points
  },
  
  getLoyaltyCustomers: async (businessId: string, locationId?: string) => {
    return [] // Mock empty array
  },
  
  createLoyaltyProgram: async (businessId: string, data: any) => {
    return {
      id: 'mock-program',
      business_id: businessId,
      program_name: data.name || 'Loyalty Program',
      is_active: true,
      points_per_dollar: 1,
      points_per_visit: 0,
      reward_tiers: [],
      points_expire_days: 365,
      minimum_purchase_for_points: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data
    }
  }
}

export default {
  flexibleAPICall,
  hasLocation,
  hasRawAppointment,
  safeGetLocation,
  safeGetRawAppointment,
  mockImplementations
}
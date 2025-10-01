import { SMSService } from './sms-service'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface LocationInfo {
  id: string
  name: string
  address: string
  phone?: string
  business_id: string
}

export class BrandedSMSService extends SMSService {
  
  static async getLocationInfo(locationId: string): Promise<LocationInfo | null> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error loading location info:', error)
      return null
    }
  }

  static async getBusinessInfo(businessId: string) {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error loading business info:', error)
      return null
    }
  }

  // Location-specific appointment confirmation with business branding
  static async sendLocationAppointmentConfirmation(appointment: any, locationId?: string) {
    const businessName = appointment.business?.name || 'your salon'
    const customerName = appointment.customer?.first_name || 'there'
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString()
    const startTime = appointment.start_time || 'your scheduled time'
    const serviceName = appointment.service?.name || 'your service'
    
    let locationInfo = ''
    if (locationId) {
      const location = await this.getLocationInfo(locationId)
      if (location) {
        locationInfo = ` at our ${location.name} location (${location.address})`
      }
    }
    
    const message = `Hi ${customerName}! Your appointment${locationInfo} is confirmed for ${appointmentDate} at ${startTime} for ${serviceName}. We look forward to seeing you! Reply STOP to unsubscribe.`
    
    return this.sendSMS(appointment.customer?.phone, message)
  }

  // Multi-location staff notification system
  static async sendStaffLocationAlert(staffPhone: string, message: string, locationId: string, businessId: string) {
    const location = await this.getLocationInfo(locationId)
    const business = await this.getBusinessInfo(businessId)
    
    const locationName = location?.name || 'your location'
    const businessName = business?.name || 'the salon'
    
    const alertMessage = `[${businessName} - ${locationName}] ${message}`
    
    return this.sendSMS(staffPhone, alertMessage)
  }

  // Location-specific reminder with address details
  static async sendLocationReminder(appointment: any, locationId?: string) {
    const businessName = appointment.business?.name || 'your salon'
    const customerName = appointment.customer?.first_name || 'there'
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString()
    const startTime = appointment.start_time || 'your scheduled time'
    const serviceName = appointment.service?.name || 'your service'
    
    let locationDetails = ''
    if (locationId) {
      const location = await this.getLocationInfo(locationId)
      if (location) {
        locationDetails = ` at ${location.name} (${location.address})`
      }
    }
    
    const message = `Reminder: Hi ${customerName}! You have an appointment${locationDetails} tomorrow (${appointmentDate}) at ${startTime} for ${serviceName}. See you soon! Reply CANCEL to cancel.`
    
    return this.sendSMS(appointment.customer?.phone, message)
  }

  // Multi-location booking available notification
  static async sendLocationAvailabilityAlert(customerPhone: string, businessName: string, locationId: string, availableSlots: string[]) {
    const location = await this.getLocationInfo(locationId)
    const locationName = location?.name || 'our salon'
    
    const slotsText = availableSlots.length > 3 
      ? `${availableSlots.slice(0, 3).join(', ')} and ${availableSlots.length - 3} more slots`
      : availableSlots.join(', ')
    
    const message = `Great news! New appointments available at ${businessName} - ${locationName}: ${slotsText}. Book now by calling or visiting our website. Reply STOP to unsubscribe.`
    
    return this.sendSMS(customerPhone, message)
  }

  // Location-specific cancellation with rebooking options
  static async sendLocationCancellationWithRebooking(appointment: any, reason?: string, alternativeSlots?: string[], locationId?: string) {
    const businessName = appointment.business?.name || 'your salon'
    const customerName = appointment.customer?.first_name || 'there'
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString()
    const startTime = appointment.start_time || 'your scheduled time'
    
    let locationInfo = ''
    if (locationId) {
      const location = await this.getLocationInfo(locationId)
      if (location) {
        locationInfo = ` at ${location.name}`
      }
    }
    
    let message = `Hi ${customerName}, unfortunately your appointment${locationInfo} on ${appointmentDate} at ${startTime} has been cancelled`
    
    if (reason) {
      message += ` due to ${reason}`
    }
    
    message += '. We apologize for the inconvenience.'
    
    if (alternativeSlots && alternativeSlots.length > 0) {
      const slotsText = alternativeSlots.slice(0, 3).join(', ')
      message += ` Available alternatives: ${slotsText}. Please call to reschedule.`
    }
    
    return this.sendSMS(appointment.customer?.phone, message)
  }

  // Cross-location promotional campaigns
  static async sendCrossLocationPromotion(customerPhone: string, businessId: string, promotionText: string, applicableLocations?: string[]) {
    const business = await this.getBusinessInfo(businessId)
    const businessName = business?.name || 'your salon'
    
    let locationText = ''
    if (applicableLocations && applicableLocations.length > 0) {
      const locationNames = []
      for (const locationId of applicableLocations) {
        const location = await this.getLocationInfo(locationId)
        if (location) locationNames.push(location.name)
      }
      
      if (locationNames.length > 0) {
        locationText = ` Available at: ${locationNames.join(', ')}.`
      }
    }
    
    const message = `${businessName}: ${promotionText}${locationText} Book online or call us!`
    
    return this.sendSMS(customerPhone, message)
  }

  // Location-specific loyalty program notifications
  static async sendLocationLoyaltyUpdate(customerPhone: string, pointsEarned: number, totalPoints: number, businessName: string, locationId?: string) {
    let locationInfo = ''
    if (locationId) {
      const location = await this.getLocationInfo(locationId)
      if (location) {
        locationInfo = ` at ${location.name}`
      }
    }
    
    const message = `Congratulations! You earned ${pointsEarned} loyalty points${locationInfo}. Total balance: ${totalPoints} points. Visit ${businessName} to redeem rewards!`
    
    return this.sendSMS(customerPhone, message)
  }

  // Emergency multi-location broadcast
  static async sendEmergencyLocationBroadcast(businessId: string, message: string, locationIds?: string[]) {
    const business = await this.getBusinessInfo(businessId)
    const businessName = business?.name || 'your salon'
    
    // Get all customers for the specified locations
    let query = supabase
      .from('appointments')
      .select(`
        customer:customers(phone),
        location_id
      `)
      .eq('business_id', businessId)
      .gte('appointment_date', new Date().toISOString().split('T')[0]) // Future appointments only
      .in('status', ['pending', 'confirmed'])
    
    if (locationIds && locationIds.length > 0) {
      query = query.in('location_id', locationIds)
    }
    
    const { data: appointments, error } = await query
    
    if (error) {
      console.error('Error fetching customers for broadcast:', error)
      return { success: false, error: error.message }
    }
    
    const uniquePhones = new Set<string>()
    appointments?.forEach((apt: any) => {
      if (apt.customer?.phone) {
        uniquePhones.add(apt.customer.phone)
      }
    })
    
    const results = []
    for (const phone of Array.from(uniquePhones)) {
      const broadcastMessage = `${businessName} NOTICE: ${message}`
      const result = await this.sendSMS(phone, broadcastMessage)
      results.push({ phone, success: result.success, error: result.error })
    }
    
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    return {
      success: successCount > 0,
      results,
      summary: {
        total: uniquePhones.size,
        sent: successCount,
        failed: failureCount
      }
    }
  }

  // Location staff shift notifications
  static async sendStaffShiftAlert(staffPhone: string, shiftDetails: any, locationId: string, businessId: string) {
    const location = await this.getLocationInfo(locationId)
    const business = await this.getBusinessInfo(businessId)
    
    const locationName = location?.name || 'your location'
    const businessName = business?.name || 'the salon'
    const shiftDate = new Date(shiftDetails.date).toLocaleDateString()
    const shiftTime = `${shiftDetails.start_time} - ${shiftDetails.end_time}`
    
    let message = `${businessName} - ${locationName}: `
    
    if (shiftDetails.type === 'assigned') {
      message += `You're scheduled to work ${shiftDate} from ${shiftTime}.`
    } else if (shiftDetails.type === 'changed') {
      message += `Your shift on ${shiftDate} has been updated to ${shiftTime}.`
    } else if (shiftDetails.type === 'cancelled') {
      message += `Your shift on ${shiftDate} has been cancelled.`
    }
    
    return this.sendSMS(staffPhone, message)
  }
}
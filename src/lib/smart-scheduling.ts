/**
 * Smart Scheduling Rules Engine
 * Handles intelligent appointment scheduling with business rules
 */

import { supabase } from './supabase'
import { Appointment, Staff, Service, Business } from './supabase-types-mvp'

export interface SchedulingRule {
  id: string
  business_id: string
  name: string
  type: 'buffer_time' | 'staff_preference' | 'service_constraint' | 'time_block' | 'capacity_limit'
  conditions: {
    service_ids?: string[]
    staff_ids?: string[]
    days_of_week?: number[]
    time_ranges?: { start: string; end: string }[]
  }
  actions: {
    buffer_minutes_before?: number
    buffer_minutes_after?: number
    block_booking?: boolean
    max_concurrent?: number
    preferred_staff?: string[]
  }
  priority: number
  is_active: boolean
}

export interface SchedulingSlot {
  date: string
  time: string
  duration_minutes: number
  staff_id?: string
  service_id: string
  available: boolean
  conflicts?: string[]
}

export interface SchedulingConstraints {
  business_hours: { [day: number]: { open: string; close: string; closed: boolean } }
  staff_schedules: { [staff_id: string]: { available_times: string[]; unavailable_dates: string[] } }
  existing_appointments: Appointment[]
  rules: SchedulingRule[]
}

export class SmartSchedulingEngine {
  private businessId: string
  private constraints: SchedulingConstraints | null = null

  constructor(businessId: string) {
    this.businessId = businessId
  }

  /**
   * Load all scheduling constraints for the business
   */
  async loadConstraints(): Promise<SchedulingConstraints> {
    try {
      const [businessHours, staffSchedules, appointments, rules] = await Promise.all([
        this.getBusinessHours(),
        this.getStaffSchedules(),
        this.getExistingAppointments(),
        this.getSchedulingRules()
      ])

      this.constraints = {
        business_hours: businessHours,
        staff_schedules: staffSchedules,
        existing_appointments: appointments,
        rules: rules
      }

      return this.constraints
    } catch (error) {
      console.error('Error loading scheduling constraints:', error)
      throw new Error('Failed to load scheduling constraints')
    }
  }

  /**
   * Find available time slots for a service
   */
  async findAvailableSlots(
    serviceId: string,
    date: string,
    preferredStaffId?: string,
    durationOverride?: number
  ): Promise<SchedulingSlot[]> {
    if (!this.constraints) {
      await this.loadConstraints()
    }

    const service = await this.getService(serviceId)
    if (!service) throw new Error('Service not found')

    const duration = durationOverride || service.duration_minutes
    const dayOfWeek = new Date(date).getDay()

    // Check if business is open
    const businessHours = this.constraints!.business_hours[dayOfWeek]
    if (!businessHours || businessHours.closed) {
      return []
    }

    // Get eligible staff
    const eligibleStaff = await this.getEligibleStaff(serviceId, preferredStaffId)
    if (eligibleStaff.length === 0) {
      return []
    }

    const availableSlots: SchedulingSlot[] = []

    // Generate time slots for each eligible staff member
    for (const staff of eligibleStaff) {
      const staffSlots = this.generateStaffSlots(
        staff.id,
        serviceId,
        date,
        duration,
        businessHours
      )
      availableSlots.push(...staffSlots)
    }

    // Filter and rank slots by rules
    const filteredSlots = this.applySchedulingRules(availableSlots, serviceId)
    
    // Sort by priority (time, staff preference, etc.)
    return this.rankSlots(filteredSlots)
  }

  /**
   * Check if a specific time slot is available
   */
  async isSlotAvailable(
    date: string,
    time: string,
    duration: number,
    staffId?: string,
    serviceId?: string
  ): Promise<{ available: boolean; conflicts: string[] }> {
    if (!this.constraints) {
      await this.loadConstraints()
    }

    const conflicts: string[] = []
    const dayOfWeek = new Date(date).getDay()

    // Check business hours
    const businessHours = this.constraints!.business_hours[dayOfWeek]
    if (!businessHours || businessHours.closed) {
      conflicts.push('Business is closed')
      return { available: false, conflicts }
    }

    const slotStart = new Date(`${date}T${time}:00`)
    const slotEnd = new Date(slotStart.getTime() + duration * 60000)
    const businessOpen = new Date(`${date}T${businessHours.open}:00`)
    const businessClose = new Date(`${date}T${businessHours.close}:00`)

    if (slotStart < businessOpen || slotEnd > businessClose) {
      conflicts.push('Outside business hours')
    }

    // Check existing appointments
    const existingConflicts = this.constraints!.existing_appointments.filter(apt => {
      if (apt.appointment_date !== date) return false
      if (staffId && apt.staff_id && apt.staff_id !== staffId) return false

      const aptStart = new Date(`${date}T${apt.start_time}:00`)
      const aptEnd = new Date(`${date}T${apt.end_time}:00`)

      return (slotStart < aptEnd && slotEnd > aptStart)
    })

    if (existingConflicts.length > 0) {
      conflicts.push('Time slot already booked')
    }

    // Apply scheduling rules
    const ruleConflicts = this.checkRuleConflicts(date, time, duration, staffId, serviceId)
    conflicts.push(...ruleConflicts)

    return { available: conflicts.length === 0, conflicts }
  }

  /**
   * Book an appointment with automatic conflict resolution
   */
  async bookAppointmentSmart(appointmentData: {
    customer_id: string
    service_id: string
    preferred_date: string
    preferred_time?: string
    preferred_staff_id?: string
    duration_override?: number
    notes?: string
  }): Promise<{ success: boolean; appointment?: Appointment; alternatives?: SchedulingSlot[] }> {
    try {
      const { customer_id, service_id, preferred_date, preferred_time, preferred_staff_id, duration_override, notes } = appointmentData

      if (preferred_time) {
        // Try exact time first
        const service = await this.getService(service_id)
        const duration = duration_override || service?.duration_minutes || 60

        const slotCheck = await this.isSlotAvailable(
          preferred_date,
          preferred_time,
          duration,
          preferred_staff_id,
          service_id
        )

        if (slotCheck.available) {
          // Book the exact slot
          return await this.createAppointment({
            customer_id,
            service_id,
            appointment_date: preferred_date,
            start_time: preferred_time,
            staff_id: preferred_staff_id,
            duration_minutes: duration,
            notes
          })
        }
      }

      // Find alternative slots
      const alternatives = await this.findAvailableSlots(
        service_id,
        preferred_date,
        preferred_staff_id,
        duration_override
      )

      if (alternatives.length > 0) {
        // Auto-book the best alternative
        const bestSlot = alternatives[0]
        return await this.createAppointment({
          customer_id,
          service_id,
          appointment_date: bestSlot.date,
          start_time: bestSlot.time,
          staff_id: bestSlot.staff_id,
          duration_minutes: bestSlot.duration_minutes,
          notes
        })
      }

      return { success: false, alternatives }
    } catch (error) {
      console.error('Smart booking error:', error)
      return { success: false, alternatives: [] }
    }
  }

  // Private helper methods
  private async getBusinessHours(): Promise<{ [day: number]: { open: string; close: string; closed: boolean } }> {
    const { data } = await supabase
      .from('business_hours')
      .select('*')
      .eq('business_id', this.businessId)

    const hours: { [day: number]: { open: string; close: string; closed: boolean } } = {}
    data?.forEach(h => {
      hours[h.day_of_week] = {
        open: h.open_time,
        close: h.close_time,
        closed: h.is_closed
      }
    })

    return hours
  }

  private async getStaffSchedules(): Promise<{ [staff_id: string]: { available_times: string[]; unavailable_dates: string[] } }> {
    const { data } = await supabase
      .from('staff')
      .select('id, schedule_data')
      .eq('business_id', this.businessId)
      .eq('is_active', true)

    const schedules: { [staff_id: string]: { available_times: string[]; unavailable_dates: string[] } } = {}
    data?.forEach(staff => {
      schedules[staff.id] = staff.schedule_data || { available_times: [], unavailable_dates: [] }
    })

    return schedules
  }

  private async getExistingAppointments(daysAhead: number = 30): Promise<Appointment[]> {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + daysAhead)

    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('business_id', this.businessId)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .lte('appointment_date', endDate.toISOString().split('T')[0])
      .neq('status', 'cancelled')

    return data || []
  }

  private async getSchedulingRules(): Promise<SchedulingRule[]> {
    const { data } = await supabase
      .from('scheduling_rules')
      .select('*')
      .eq('business_id', this.businessId)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    return data || []
  }

  private async getService(serviceId: string): Promise<Service | null> {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single()

    return data
  }

  private async getEligibleStaff(serviceId: string, preferredStaffId?: string): Promise<Staff[]> {
    let query = supabase
      .from('staff')
      .select('*')
      .eq('business_id', this.businessId)
      .eq('is_active', true)

    if (preferredStaffId) {
      query = query.eq('id', preferredStaffId)
    }

    const { data } = await query

    // Filter by service specialties if defined
    return (data || []).filter(staff => {
      // If staff has no specialties defined, they can handle all services
      if (!staff.specialties || staff.specialties.length === 0) return true
      
      // Check if any specialty matches the service
      return staff.specialties.some((specialty: string) => 
        // This would need service category matching logic
        true // Simplified for now
      )
    })
  }

  private generateStaffSlots(
    staffId: string,
    serviceId: string,
    date: string,
    duration: number,
    businessHours: { open: string; close: string; closed: boolean }
  ): SchedulingSlot[] {
    const slots: SchedulingSlot[] = []
    const slotInterval = 30 // 30-minute intervals

    const openTime = new Date(`${date}T${businessHours.open}:00`)
    const closeTime = new Date(`${date}T${businessHours.close}:00`)

    for (let time = new Date(openTime); time < closeTime; time.setMinutes(time.getMinutes() + slotInterval)) {
      const endTime = new Date(time.getTime() + duration * 60000)
      
      if (endTime <= closeTime) {
        slots.push({
          date,
          time: time.toTimeString().slice(0, 5),
          duration_minutes: duration,
          staff_id: staffId,
          service_id: serviceId,
          available: true
        })
      }
    }

    return slots
  }

  private applySchedulingRules(slots: SchedulingSlot[], serviceId: string): SchedulingSlot[] {
    if (!this.constraints) return slots

    const rules = this.constraints.rules.filter(rule => 
      !rule.conditions.service_ids || rule.conditions.service_ids.includes(serviceId)
    )

    return slots.filter(slot => {
      for (const rule of rules) {
        if (!this.evaluateRule(rule, slot)) {
          return false
        }
      }
      return true
    })
  }

  private evaluateRule(rule: SchedulingRule, slot: SchedulingSlot): boolean {
    // Day of week check
    if (rule.conditions.days_of_week) {
      const dayOfWeek = new Date(slot.date).getDay()
      if (!rule.conditions.days_of_week.includes(dayOfWeek)) return false
    }

    // Time range check
    if (rule.conditions.time_ranges) {
      const slotTime = slot.time
      const inTimeRange = rule.conditions.time_ranges.some(range => 
        slotTime >= range.start && slotTime <= range.end
      )
      if (!inTimeRange) return false
    }

    // Staff check
    if (rule.conditions.staff_ids && slot.staff_id) {
      if (!rule.conditions.staff_ids.includes(slot.staff_id)) return false
    }

    // Apply rule actions
    if (rule.actions.block_booking) return false

    return true
  }

  private checkRuleConflicts(date: string, time: string, duration: number, staffId?: string, serviceId?: string): string[] {
    const conflicts: string[] = []

    if (!this.constraints) return conflicts

    // Buffer time conflicts
    const bufferRules = this.constraints.rules.filter(rule => 
      rule.type === 'buffer_time' && 
      (!rule.conditions.service_ids || (serviceId && rule.conditions.service_ids.includes(serviceId)))
    )

    for (const rule of bufferRules) {
      const bufferBefore = rule.actions.buffer_minutes_before || 0
      const bufferAfter = rule.actions.buffer_minutes_after || 0

      if (bufferBefore > 0 || bufferAfter > 0) {
        const slotStart = new Date(`${date}T${time}:00`)
        const slotEnd = new Date(slotStart.getTime() + duration * 60000)
        
        const nearbyAppointments = this.constraints.existing_appointments.filter(apt => {
          if (apt.appointment_date !== date) return false
          if (staffId && apt.staff_id !== staffId) return false

          const aptStart = new Date(`${date}T${apt.start_time}:00`)
          const aptEnd = new Date(`${date}T${apt.end_time}:00`)

          // Check if within buffer time
          const beforeBufferStart = new Date(slotStart.getTime() - bufferBefore * 60000)
          const afterBufferEnd = new Date(slotEnd.getTime() + bufferAfter * 60000)

          return (aptStart < afterBufferEnd && aptEnd > beforeBufferStart)
        })

        if (nearbyAppointments.length > 0) {
          conflicts.push(`Buffer time conflict (${bufferBefore}min before, ${bufferAfter}min after)`)
        }
      }
    }

    return conflicts
  }

  private rankSlots(slots: SchedulingSlot[]): SchedulingSlot[] {
    return slots.sort((a, b) => {
      // Prefer earlier times
      if (a.time !== b.time) {
        return a.time.localeCompare(b.time)
      }
      
      // Prefer specific staff assignments
      if (a.staff_id && !b.staff_id) return -1
      if (!a.staff_id && b.staff_id) return 1

      return 0
    })
  }

  private async createAppointment(data: {
    customer_id: string
    service_id: string
    appointment_date: string
    start_time: string
    staff_id?: string
    duration_minutes: number
    notes?: string
  }): Promise<{ success: boolean; appointment?: Appointment }> {
    try {
      const endTime = new Date(`${data.appointment_date}T${data.start_time}:00`)
      endTime.setMinutes(endTime.getMinutes() + data.duration_minutes)

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          business_id: this.businessId,
          customer_id: data.customer_id,
          service_id: data.service_id,
          staff_id: data.staff_id,
          appointment_date: data.appointment_date,
          start_time: data.start_time,
          end_time: endTime.toTimeString().slice(0, 5),
          duration_minutes: data.duration_minutes,
          status: 'confirmed',
          notes: data.notes,
          booking_source: 'smart_scheduling'
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, appointment }
    } catch (error) {
      console.error('Error creating appointment:', error)
      return { success: false }
    }
  }
}

// Default scheduling rules for new businesses
export const DEFAULT_SCHEDULING_RULES: Omit<SchedulingRule, 'id' | 'business_id'>[] = [
  {
    name: 'Standard Buffer Time',
    type: 'buffer_time',
    conditions: {},
    actions: {
      buffer_minutes_before: 5,
      buffer_minutes_after: 10
    },
    priority: 5,
    is_active: true
  },
  {
    name: 'No Back-to-Back Long Services',
    type: 'service_constraint',
    conditions: {
      // Would be configured with specific long service IDs
    },
    actions: {
      buffer_minutes_after: 15
    },
    priority: 3,
    is_active: true
  },
  {
    name: 'Lunch Break Block',
    type: 'time_block',
    conditions: {
      time_ranges: [{ start: '12:00', end: '13:00' }]
    },
    actions: {
      block_booking: true
    },
    priority: 8,
    is_active: true
  }
]
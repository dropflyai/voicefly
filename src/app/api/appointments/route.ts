import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organization_id = searchParams.get('organization_id')
    const date = searchParams.get('date')
    const status = searchParams.get('status')

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
    }

    let query = supabase
      .from('appointments')
      .select(`
        *,
        customers (
          first_name,
          last_name,
          phone,
          email
        ),
        services (
          name,
          duration_minutes,
          price_cents,
          category
        ),
        staff (
          first_name,
          last_name,
          specialties
        )
      `)
      .eq('organization_id', organization_id)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (date) {
      query = query.eq('appointment_date', date)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: appointments, error } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organization_id,
      customer_phone,
      customer_first_name,
      customer_last_name,
      customer_email,
      service_id,
      staff_id,
      appointment_date,
      start_time,
      end_time,
      notes,
      special_requests,
      voice_call_id,
      campaign_id,
      booking_source = 'voice_call'
    } = body

    // Find or create customer
    let customer
    const { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('phone', customer_phone)
      .single()

    if (existingCustomer) {
      customer = existingCustomer
    } else {
      // Create new customer
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert([
          {
            organization_id,
            first_name: customer_first_name,
            last_name: customer_last_name,
            phone: customer_phone,
            email: customer_email
          }
        ])
        .select()
        .single()

      if (createError) {
        console.error('Error creating customer:', createError)
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      customer = newCustomer
    }

    // Get service details for pricing
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('price_cents, duration_minutes')
      .eq('id', service_id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Calculate end time if not provided
    let calculatedEndTime = end_time
    if (!calculatedEndTime && start_time && service.duration_minutes) {
      const startDate = new Date(`${appointment_date}T${start_time}`)
      startDate.setMinutes(startDate.getMinutes() + service.duration_minutes)
      calculatedEndTime = startDate.toTimeString().slice(0, 5) // HH:MM format
    }

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert([
        {
          organization_id,
          customer_id: customer.id,
          service_id,
          staff_id,
          appointment_date,
          start_time,
          end_time: calculatedEndTime,
          duration_minutes: service.duration_minutes,
          service_price_cents: service.price_cents,
          total_price_cents: service.price_cents,
          notes,
          special_requests,
          voice_call_id,
          campaign_id,
          booking_source,
          status: 'scheduled'
        }
      ])
      .select(`
        *,
        customers (
          first_name,
          last_name,
          phone,
          email
        ),
        services (
          name,
          duration_minutes,
          price_cents,
          category
        )
      `)
      .single()

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError)
      return NextResponse.json({ error: appointmentError.message }, { status: 500 })
    }

    // Create appointment reminder
    const reminderTime = new Date(`${appointment_date}T${start_time}`)
    reminderTime.setHours(reminderTime.getHours() - 24) // 24 hours before

    await supabase
      .from('appointment_reminders')
      .insert([
        {
          appointment_id: appointment.id,
          reminder_type: 'sms',
          scheduled_for: reminderTime.toISOString()
        }
      ])

    return NextResponse.json({
      success: true,
      appointment,
      message: `Appointment booked for ${customer_first_name} on ${appointment_date} at ${start_time}`
    })
  } catch (error) {
    console.error('Appointment booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update appointment status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointment_id, status, payment_status, notes } = body

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        status,
        payment_status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointment_id)
      .select(`
        *,
        customers (
          first_name,
          last_name,
          phone
        ),
        services (
          name,
          price_cents
        )
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Appointment update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
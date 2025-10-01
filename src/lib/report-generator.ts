import { createClient } from '@supabase/supabase-js'

interface ReportData {
  date: string
  summary: {
    totalAppointments: number
    completedAppointments: number
    totalRevenue: number
    newCustomers: number
    averageTicket: number
  }
  appointments: any[]
  topServices: {
    name: string
    bookings: number
    revenue: number
  }[]
  staffPerformance: {
    name: string
    appointments: number
    revenue: number
    utilizationRate: number
  }[]
  insights: {
    type: 'opportunity' | 'warning' | 'success'
    title: string
    description: string
    action?: string
  }[]
}

export class ReportGenerator {
  private supabase

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  async generateDailyReport(businessId: string, date: string): Promise<ReportData> {
    try {
      // Fetch appointments for the day
      const { data: appointments, error: appointmentsError } = await this.supabase
        .from('appointments')
        .select(`
          *,
          service:services(name, base_price),
          customer:customers(first_name, last_name)
        `)
        .eq('business_id', businessId)
        .gte('appointment_date', date)
        .lt('appointment_date', new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (appointmentsError) throw appointmentsError

      // Calculate summary metrics
      const completedAppointments = appointments?.filter(a => a.status === 'completed') || []
      const totalRevenue = completedAppointments.reduce((sum, apt) => 
        sum + (apt.service?.base_price || 0), 0
      )
      const newCustomersToday = await this.getNewCustomersCount(businessId, date)
      const averageTicket = completedAppointments.length > 0 
        ? totalRevenue / completedAppointments.length 
        : 0

      // Calculate top services
      const serviceMap = new Map()
      completedAppointments.forEach(apt => {
        if (apt.service?.name) {
          const current = serviceMap.get(apt.service.name) || { bookings: 0, revenue: 0 }
          serviceMap.set(apt.service.name, {
            bookings: current.bookings + 1,
            revenue: current.revenue + (apt.service.base_price || 0)
          })
        }
      })

      const topServices = Array.from(serviceMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Calculate staff performance (mock data for now)
      const staffPerformance = [
        { name: 'Sarah Johnson', appointments: 12, revenue: 960, utilizationRate: 85 },
        { name: 'Maria Rodriguez', appointments: 9, revenue: 720, utilizationRate: 78 },
        { name: 'Emily Chen', appointments: 8, revenue: 640, utilizationRate: 72 }
      ]

      // Generate insights
      const insights = this.generateInsights(appointments || [], totalRevenue, completedAppointments.length)

      return {
        date,
        summary: {
          totalAppointments: appointments?.length || 0,
          completedAppointments: completedAppointments.length,
          totalRevenue,
          newCustomers: newCustomersToday,
          averageTicket
        },
        appointments: appointments || [],
        topServices,
        staffPerformance,
        insights
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
      throw error
    }
  }

  async generateWeeklyReport(businessId: string, startDate: string): Promise<ReportData> {
    const endDate = new Date(new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000)
    
    // Similar logic to daily report but for a week range
    // Implementation would aggregate daily data across the week
    
    // For now, return mock weekly data
    return {
      date: `${startDate} to ${endDate.toISOString().split('T')[0]}`,
      summary: {
        totalAppointments: 156,
        completedAppointments: 142,
        totalRevenue: 11360,
        newCustomers: 23,
        averageTicket: 80
      },
      appointments: [],
      topServices: [
        { name: 'Gel Manicure', bookings: 45, revenue: 3600 },
        { name: 'Pedicure', bookings: 32, revenue: 2560 },
        { name: 'Signature Service', bookings: 28, revenue: 2240 }
      ],
      staffPerformance: [
        { name: 'Sarah Johnson', appointments: 52, revenue: 4160, utilizationRate: 88 },
        { name: 'Maria Rodriguez', appointments: 48, revenue: 3840, utilizationRate: 85 },
        { name: 'Emily Chen', appointments: 42, revenue: 3360, utilizationRate: 79 }
      ],
      insights: [
        {
          type: 'success',
          title: 'Strong Week Performance',
          description: 'Revenue up 12% compared to last week',
          action: 'Continue current marketing efforts'
        },
        {
          type: 'opportunity',
          title: 'Peak Hour Optimization',
          description: 'Thursday 2-4 PM has lowest booking rate',
          action: 'Consider promotional offers for this time slot'
        }
      ]
    }
  }

  async generateMonthlyReport(businessId: string, month: string): Promise<ReportData> {
    // Monthly aggregation logic
    // For now, return mock monthly data
    
    return {
      date: month,
      summary: {
        totalAppointments: 680,
        completedAppointments: 612,
        totalRevenue: 48960,
        newCustomers: 95,
        averageTicket: 80
      },
      appointments: [],
      topServices: [
        { name: 'Gel Manicure', bookings: 195, revenue: 15600 },
        { name: 'Pedicure', bookings: 142, revenue: 11360 },
        { name: 'Signature Service', bookings: 128, revenue: 10240 },
        { name: 'French Tips', bookings: 89, revenue: 7120 },
        { name: 'Polish Change', bookings: 58, revenue: 2320 }
      ],
      staffPerformance: [
        { name: 'Sarah Johnson', appointments: 225, revenue: 18000, utilizationRate: 92 },
        { name: 'Maria Rodriguez', appointments: 198, revenue: 15840, utilizationRate: 88 },
        { name: 'Emily Chen', appointments: 189, revenue: 15120, utilizationRate: 85 }
      ],
      insights: [
        {
          type: 'success',
          title: 'Excellent Monthly Performance',
          description: 'Exceeded revenue target by 8%',
          action: 'Maintain current service quality'
        },
        {
          type: 'opportunity',
          title: 'Customer Retention Focus',
          description: '15% of customers haven\'t returned in 60+ days',
          action: 'Launch win-back email campaign'
        },
        {
          type: 'warning',
          title: 'Staff Utilization Variance',
          description: 'Some staff members below 80% utilization',
          action: 'Review scheduling and training needs'
        }
      ]
    }
  }

  private async getNewCustomersCount(businessId: string, date: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('customers')
        .select('id')
        .eq('business_id', businessId)
        .gte('created_at', date)
        .lt('created_at', new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString())

      if (error) throw error
      return data?.length || 0
    } catch (error) {
      console.error('Failed to get new customers count:', error)
      return 0
    }
  }

  private generateInsights(appointments: any[], revenue: number, completedCount: number) {
    const insights = []

    // Revenue insight
    if (revenue > 1000) {
      insights.push({
        type: 'success' as const,
        title: 'Strong Daily Revenue',
        description: `Generated $${revenue.toLocaleString()} today`,
        action: 'Keep up the excellent work'
      })
    } else if (revenue < 500) {
      insights.push({
        type: 'opportunity' as const,
        title: 'Revenue Below Target',
        description: 'Consider promotional offers or upselling opportunities',
        action: 'Review pricing and service offerings'
      })
    }

    // Appointment completion insight
    const completionRate = appointments.length > 0 ? (completedCount / appointments.length) * 100 : 0
    if (completionRate < 80) {
      insights.push({
        type: 'warning' as const,
        title: 'High Cancellation Rate',
        description: `${(100 - completionRate).toFixed(1)}% of appointments were cancelled or no-shows`,
        action: 'Implement reminder system and cancellation policy'
      })
    }

    // Peak time insight
    if (appointments.length > 15) {
      insights.push({
        type: 'opportunity' as const,
        title: 'High Demand Day',
        description: 'Consider expanding capacity or premium pricing',
        action: 'Analyze staff scheduling and resource allocation'
      })
    }

    return insights
  }

  // Export data as CSV
  exportToCSV(reportData: ReportData): string {
    const csvRows = []
    
    // Headers
    csvRows.push(['Metric', 'Value'])
    csvRows.push(['Report Date', reportData.date])
    csvRows.push(['Total Appointments', reportData.summary.totalAppointments.toString()])
    csvRows.push(['Completed Appointments', reportData.summary.completedAppointments.toString()])
    csvRows.push(['Total Revenue', `$${reportData.summary.totalRevenue.toLocaleString()}`])
    csvRows.push(['New Customers', reportData.summary.newCustomers.toString()])
    csvRows.push(['Average Ticket', `$${reportData.summary.averageTicket.toFixed(2)}`])
    
    csvRows.push([]) // Empty row
    csvRows.push(['Top Services', 'Bookings', 'Revenue'])
    reportData.topServices.forEach(service => {
      csvRows.push([service.name, service.bookings.toString(), `$${service.revenue.toLocaleString()}`])
    })
    
    csvRows.push([]) // Empty row
    csvRows.push(['Staff Performance', 'Appointments', 'Revenue', 'Utilization %'])
    reportData.staffPerformance.forEach(staff => {
      csvRows.push([
        staff.name, 
        staff.appointments.toString(), 
        `$${staff.revenue.toLocaleString()}`, 
        `${staff.utilizationRate}%`
      ])
    })

    return csvRows.map(row => row.join(',')).join('\n')
  }

  // Export data as JSON
  exportToJSON(reportData: ReportData): string {
    return JSON.stringify(reportData, null, 2)
  }
}
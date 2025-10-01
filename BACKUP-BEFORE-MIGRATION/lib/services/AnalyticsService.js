const { createClient } = require('@supabase/supabase-js');

class AnalyticsService {
    constructor() {
        // Use the same fallback values as the main server
        const SUPABASE_URL = process.env.SUPABASE_URL || 'https://irvyhhkoiyzartmmvbxw.supabase.co';
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlydnloaGtvaXl6YXJ0bW12Ynh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTExODI5MywiZXhwIjoyMDcwNjk0MjkzfQ.61Zfyc87GpmpIlWFL1fyX6wcfydqCu6DUFuHnpNSvhk';
        
        this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }

    // Real-time metrics
    async getRealTimeMetrics(businessId) {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().substring(0, 7);

        try {
            // Today's stats
            const { data: todayAppointments } = await this.supabase
                .from('appointments')
                .select('*, customers(*), services(*)')
                .eq('business_id', businessId)
                .eq('appointment_date', today)
                .neq('status', 'cancelled');

            const { data: monthlyRevenue } = await this.supabase
                .from('payments')
                .select('total_amount')
                .eq('business_id', businessId)
                .like('created_at', `${thisMonth}%`)
                .eq('status', 'paid');

            const totalRevenue = monthlyRevenue?.reduce((sum, p) => sum + p.total_amount, 0) || 0;

            return {
                todayAppointments: todayAppointments?.length || 0,
                monthlyRevenue: totalRevenue,
                avgAppointmentValue: todayAppointments?.length
                    ? totalRevenue / todayAppointments.length
                    : 0,
                bookingTrend: await this.getBookingTrend(businessId, 7)
            };
        } catch (error) {
            console.error('Error fetching real-time metrics:', error);
            return { todayAppointments: 0, monthlyRevenue: 0, avgAppointmentValue: 0 };
        }
    }

    // Customer insights
    async getCustomerInsights(businessId) {
        try {
            const { data: customers } = await this.supabase
                .from('customers')
                .select(`
                    *,
                    appointments(*),
                    customer_loyalty_points(*)
                `)
                .eq('business_id', businessId);

            const insights = {
                totalCustomers: customers?.length || 0,
                newCustomersThisMonth: 0,
                topCustomers: [],
                customerRetentionRate: 0,
                avgCustomerLifetimeValue: 0
            };

            if (customers) {
                const thisMonth = new Date().toISOString().substring(0, 7);
                insights.newCustomersThisMonth = customers.filter(c =>
                    c.created_at.startsWith(thisMonth)
                ).length;

                insights.topCustomers = customers
                    .sort((a, b) => b.total_spent - a.total_spent)
                    .slice(0, 5)
                    .map(c => ({
                        name: `${c.first_name} ${c.last_name}`,
                        totalSpent: c.total_spent,
                        visits: c.total_visits,
                        loyaltyPoints: c.customer_loyalty_points?.[0]?.current_balance || 0
                    }));

                const repeatCustomers = customers.filter(c => c.total_visits > 1);
                insights.customerRetentionRate = customers.length ?
                    (repeatCustomers.length / customers.length) * 100 : 0;

                insights.avgCustomerLifetimeValue = customers.length ?
                    customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length : 0;
            }

            return insights;
        } catch (error) {
            console.error('Error fetching customer insights:', error);
            return { totalCustomers: 0, newCustomersThisMonth: 0, topCustomers: [], customerRetentionRate: 0, avgCustomerLifetimeValue: 0 };
        }
    }

    // Service performance
    async getServicePerformance(businessId) {
        try {
            const { data: appointments } = await this.supabase
                .from('appointments')
                .select(`
                    *,
                    services(*),
                    payments(*)
                `)
                .eq('business_id', businessId)
                .neq('status', 'cancelled');

            const serviceStats = {};

            appointments?.forEach(apt => {
                const serviceName = apt.services?.name || 'Unknown Service';
                if (!serviceStats[serviceName]) {
                    serviceStats[serviceName] = {
                        name: serviceName,
                        bookings: 0,
                        revenue: 0,
                        avgDuration: apt.services?.duration_minutes || 0,
                        popularTimes: {}
                    };
                }

                serviceStats[serviceName].bookings += 1;
                serviceStats[serviceName].revenue += apt.payments?.[0]?.total_amount || 0;

                const hour = new Date(`2000-01-01T${apt.start_time}`).getHours();
                serviceStats[serviceName].popularTimes[hour] = 
                    (serviceStats[serviceName].popularTimes[hour] || 0) + 1;
            });

            return Object.values(serviceStats)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10);
        } catch (error) {
            console.error('Error fetching service performance:', error);
            return [];
        }
    }

    // Staff performance
    async getStaffPerformance(businessId) {
        try {
            const { data: staff } = await this.supabase
                .from('staff')
                .select(`
                    *,
                    appointments(*),
                    appointments(payments(*))
                `)
                .eq('business_id', businessId)
                .eq('is_active', true);

            return staff?.map(member => {
                const appointments = member.appointments || [];
                const totalRevenue = appointments.reduce((sum, apt) =>
                    sum + (apt.payments?.[0]?.total_amount || 0), 0);

                return {
                    name: `${member.first_name} ${member.last_name}`,
                    appointments: appointments.length,
                    revenue: totalRevenue,
                    efficiency: appointments.length ? totalRevenue / appointments.length : 0,
                    specialties: member.specialties || []
                };
            }) || [];
        } catch (error) {
            console.error('Error fetching staff performance:', error);
            return [];
        }
    }

    // Booking trends
    async getBookingTrend(businessId, days = 30) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);

            const { data: appointments } = await this.supabase
                .from('appointments')
                .select('appointment_date, status')
                .eq('business_id', businessId)
                .gte('appointment_date', startDate.toISOString().split('T')[0])
                .lte('appointment_date', endDate.toISOString().split('T')[0]);

            const trendData = {};
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                trendData[dateStr] = 0;
            }

            appointments?.forEach(apt => {
                if (apt.status !== 'cancelled') {
                    trendData[apt.appointment_date] = (trendData[apt.appointment_date] || 0) + 1;
                }
            });

            return Object.entries(trendData).map(([date, count]) => ({ date, count }));
        } catch (error) {
            console.error('Error fetching booking trend:', error);
            return [];
        }
    }

    // AI-powered insights
    async generateInsights(businessId) {
        try {
            const [metrics, customers, services, staff] = await Promise.all([
                this.getRealTimeMetrics(businessId),
                this.getCustomerInsights(businessId),
                this.getServicePerformance(businessId),
                this.getStaffPerformance(businessId)
            ]);

            const insights = [];

            // Revenue insights
            if (metrics.monthlyRevenue > 0) {
                const growth = await this.calculateGrowthRate(businessId, 'revenue');
                insights.push({
                    type: 'revenue',
                    priority: 'high',
                    title: `Revenue ${growth > 0 ? 'Growth' : 'Decline'} Detected`,
                    description: `Monthly revenue is ${Math.abs(growth).toFixed(1)}% ${growth > 0 ? 'up' : 'down'} compared to last month`,
                    recommendation: growth < -10 ? 'Consider promotional campaigns' : 'Great momentum!',
                    metric: `$${metrics.monthlyRevenue.toFixed(2)}`
                });
            }

            // Customer retention insights
            if (customers.customerRetentionRate < 50) {
                insights.push({
                    type: 'retention',
                    priority: 'high',
                    title: 'Low Customer Retention',
                    description: `Only ${customers.customerRetentionRate.toFixed(1)}% of customers return`,
                    recommendation: 'Implement loyalty program and follow-up campaigns',
                    metric: `${customers.customerRetentionRate.toFixed(1)}%`
                });
            }

            // Service performance insights
            if (services.length > 0) {
                const topService = services[0];
                insights.push({
                    type: 'service',
                    priority: 'medium',
                    title: 'Top Performing Service',
                    description: `${topService.name} generates the most revenue`,
                    recommendation: 'Consider promoting similar services',
                    metric: `$${topService.revenue.toFixed(2)}`
                });
            }

            return insights;
        } catch (error) {
            console.error('Error generating insights:', error);
            return [];
        }
    }

    // Helper: Calculate growth rate
    async calculateGrowthRate(businessId, metric) {
        try {
            const thisMonth = new Date();
            const lastMonth = new Date();
            lastMonth.setMonth(thisMonth.getMonth() - 1);

            const thisMonthStr = thisMonth.toISOString().substring(0, 7);
            const lastMonthStr = lastMonth.toISOString().substring(0, 7);

            if (metric === 'revenue') {
                const [thisMonthData, lastMonthData] = await Promise.all([
                    this.supabase.from('payments')
                        .select('total_amount')
                        .eq('business_id', businessId)
                        .like('created_at', `${thisMonthStr}%`)
                        .eq('status', 'paid'),
                    this.supabase.from('payments')
                        .select('total_amount')
                        .eq('business_id', businessId)
                        .like('created_at', `${lastMonthStr}%`)
                        .eq('status', 'paid')
                ]);

                const thisTotal = thisMonthData.data?.reduce((sum, p) => sum + p.total_amount, 0) || 0;
                const lastTotal = lastMonthData.data?.reduce((sum, p) => sum + p.total_amount, 0) || 0;

                if (lastTotal === 0) return 0;
                return ((thisTotal - lastTotal) / lastTotal) * 100;
            }

            return 0;
        } catch (error) {
            console.error('Error calculating growth rate:', error);
            return 0;
        }
    }

    // Log analytics event
    async logEvent(businessId, eventType, eventData) {
        try {
            await this.supabase
                .from('analytics_events')
                .insert({
                    business_id: businessId,
                    event_type: eventType,
                    event_data: eventData,
                    created_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('Error logging analytics event:', error);
        }
    }
}

// Helper functions for analytics events
const analyticsHelpers = {
    // Track customer portal login
    trackCustomerLogin: async (analyticsService, businessId, customerId) => {
        await analyticsService.logEvent(businessId, 'customer_portal_login', {
            customer_id: customerId,
            timestamp: new Date().toISOString()
        });
    },

    // Track appointment booking
    trackAppointmentBooked: async (analyticsService, businessId, appointmentData) => {
        await analyticsService.logEvent(businessId, 'appointment_booked', {
            service_type: appointmentData.service_type,
            booking_source: appointmentData.booking_source,
            customer_id: appointmentData.customer_id,
            timestamp: new Date().toISOString()
        });
    },

    // Track payment processed
    trackPayment: async (analyticsService, businessId, paymentData) => {
        await analyticsService.logEvent(businessId, 'payment_processed', {
            amount: paymentData.amount,
            payment_method: paymentData.payment_method,
            customer_id: paymentData.customer_id,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = AnalyticsService;
module.exports.analyticsHelpers = analyticsHelpers;
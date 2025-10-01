'use client'

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface RevenueData {
  date: string
  revenue: number
  appointments: number
  averageTicket: number
}

interface RevenueChartProps {
  data: RevenueData[]
  type?: 'line' | 'bar'
  height?: number
}

export function RevenueChart({ data, type = 'line', height = 300 }: RevenueChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <p className="text-green-600 font-semibold">
            Revenue: ${payload[0]?.value?.toLocaleString() || 0}
          </p>
          <p className="text-blue-600 text-sm">
            {payload[0]?.payload?.appointments || 0} appointments
          </p>
          <p className="text-purple-600 text-sm">
            Avg ticket: ${payload[0]?.payload?.averageTicket?.toFixed(2) || 0}
          </p>
        </div>
      )
    }
    return null
  }

  const ChartComponent = type === 'bar' ? BarChart : LineChart

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              // Format date to show just month/day
              try {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              } catch {
                return value
              }
            }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          {type === 'line' ? (
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            />
          ) : (
            <Bar 
              dataKey="revenue" 
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}

interface ServiceRevenueData {
  name: string
  revenue: number
  percentage: number
  color: string
}

interface ServicePopularityChartProps {
  data: ServiceRevenueData[]
  height?: number
}

export function ServicePopularityChart({ data, height = 300 }: ServicePopularityChartProps) {
  const COLORS = [
    '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', 
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-green-600 font-semibold">
            ${data.revenue.toLocaleString()}
          </p>
          <p className="text-gray-600 text-sm">
            {data.percentage.toFixed(1)}% of total revenue
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="revenue"
            label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

interface StaffPerformanceData {
  name: string
  revenue: number
  appointments: number
  utilizationRate: number
  averageTicket: number
}

interface StaffPerformanceChartProps {
  data: StaffPerformanceData[]
  height?: number
}

export function StaffPerformanceChart({ data, height = 300 }: StaffPerformanceChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const staffData = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <p className="text-green-600 font-semibold">
            Revenue: ${staffData.revenue.toLocaleString()}
          </p>
          <p className="text-blue-600 text-sm">
            {staffData.appointments} appointments
          </p>
          <p className="text-purple-600 text-sm">
            {staffData.utilizationRate}% utilization
          </p>
          <p className="text-orange-600 text-sm">
            Avg ticket: ${staffData.averageTicket.toFixed(2)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          layout="horizontal"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tickFormatter={(value) => `$${value.toLocaleString()}`} />
          <YAxis type="category" dataKey="name" width={100} />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="revenue" 
            fill="#8b5cf6"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface CustomerRetentionData {
  cohortMonth: string
  cohortSize: number
  returned: number
  retentionRate: number
}

interface CustomerRetentionChartProps {
  data: CustomerRetentionData[]
  height?: number
}

export function CustomerRetentionChart({ data, height = 300 }: CustomerRetentionChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const cohortData = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <p className="text-blue-600 font-semibold">
            {cohortData.retentionRate.toFixed(1)}% retention
          </p>
          <p className="text-gray-600 text-sm">
            {cohortData.returned} of {cohortData.cohortSize} customers returned
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="cohortMonth" tick={{ fontSize: 12 }} />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="retentionRate" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
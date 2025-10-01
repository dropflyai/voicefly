"use client"

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

interface ChartProps {
  data: any[]
  height?: number
}

export function LineChartComponent({ data, height = 300 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6B7280" />
        <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ fill: '#3B82F6', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="value2"
          stroke="#10B981"
          strokeWidth={2}
          dot={{ fill: '#10B981', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function BarChartComponent({ data, height = 300 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6B7280" />
        <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
        <Bar dataKey="value2" fill="#10B981" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function PieChartComponent({ data, height = 300 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function AreaChartComponent({ data, height = 300 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6B7280" />
        <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#3B82F6"
          fillOpacity={1}
          fill="url(#colorValue)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="value2"
          stroke="#10B981"
          fillOpacity={1}
          fill="url(#colorValue2)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function RadarChartComponent({ data, height = 300 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data}>
        <PolarGrid stroke="#E5E7EB" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} stroke="#6B7280" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#6B7280" />
        <Radar
          name="Performance"
          dataKey="A"
          stroke="#3B82F6"
          fill="#3B82F6"
          fillOpacity={0.6}
          strokeWidth={2}
        />
        <Radar
          name="Target"
          dataKey="B"
          stroke="#10B981"
          fill="#10B981"
          fillOpacity={0.6}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px'
          }}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  )
}
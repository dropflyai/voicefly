'use client'

import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

/**
 * Professional Skeleton Loading Component
 *
 * Used to show placeholder content while data is loading.
 * Follows enterprise design principles with subtle animations.
 */
export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200'

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
    none: ''
  }

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width,
        height: height || (variant === 'text' ? '1rem' : undefined)
      }}
    />
  )
}

/**
 * Skeleton for stat/metric cards
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton width={60} height={20} className="rounded" />
      </div>
      <div className="mt-4">
        <Skeleton width={100} height={28} className="mb-2" />
        <Skeleton width={140} height={16} />
      </div>
    </div>
  )
}

/**
 * Skeleton for chart components
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={150} height={24} />
        <Skeleton width={100} height={32} className="rounded-lg" />
      </div>
      <div
        className="bg-gray-50 rounded-lg flex items-end justify-around px-4"
        style={{ height }}
      >
        {[65, 45, 80, 55, 70, 40, 90].map((h, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width={32}
            height={`${h}%`}
            className="!rounded-t-lg"
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton for table rows
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton
            width={i === 0 ? 120 : 80}
            height={16}
          />
        </td>
      ))}
    </tr>
  )
}

/**
 * Skeleton for table component
 */
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <Skeleton width={200} height={24} />
          <div className="flex gap-2">
            <Skeleton width={100} height={36} className="rounded-lg" />
            <Skeleton width={100} height={36} className="rounded-lg" />
          </div>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton width={80} height={14} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Skeleton for list items
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-b-0">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton width={180} height={18} className="mb-2" />
        <Skeleton width={120} height={14} />
      </div>
      <Skeleton width={80} height={24} className="rounded-full" />
    </div>
  )
}

/**
 * Skeleton for cards with image
 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Skeleton variant="rectangular" className="w-full h-48" />
      <div className="p-4">
        <Skeleton width="70%" height={20} className="mb-2" />
        <Skeleton width="100%" height={14} className="mb-1" />
        <Skeleton width="80%" height={14} />
      </div>
    </div>
  )
}

/**
 * Full page loading skeleton
 */
export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton width={200} height={32} className="mb-2" />
          <Skeleton width={300} height={18} />
        </div>
        <div className="flex gap-3">
          <Skeleton width={120} height={40} className="rounded-lg" />
          <Skeleton width={120} height={40} className="rounded-lg" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Table */}
      <TableSkeleton />
    </div>
  )
}

/**
 * Dashboard-specific skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Welcome section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={56} height={56} />
          <div>
            <Skeleton width={240} height={28} className="mb-2" />
            <Skeleton width={180} height={18} />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Chart */}
        <div className="lg:col-span-2">
          <ChartSkeleton height={350} />
        </div>

        {/* Right column - Activity */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <Skeleton width={150} height={24} />
          </div>
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Skeleton

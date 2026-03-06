'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { BusinessAPI, type Business } from '../../../lib/supabase'
import { supabase } from '../../../lib/supabase-client'
import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '../../../lib/multi-tenant-auth'
import {
  ShoppingBagIcon,
  PhoneIcon,
  TruckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow, format } from 'date-fns'

interface OrderItem {
  name: string
  quantity: number
  price: number
  modifiers?: string[]
  specialInstructions?: string
}

interface PhoneOrder {
  id: string
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  items: OrderItem[]
  subtotal: number
  tax: number
  delivery_fee: number
  tip: number
  total: number
  order_type: string
  delivery_address: { street?: string; city?: string; zip?: string; instructions?: string } | null
  requested_time: string | null
  estimated_ready: string | null
  status: string
  special_instructions: string | null
  created_at: string
  employee_id: string | null
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  ready: 'bg-green-100 text-green-700',
  out_for_delivery: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'completed']

function OrdersPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [orders, setOrders] = useState<PhoneOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('active')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const businessId = getSecureBusinessId()
    if (!businessId) {
      redirectToLoginIfUnauthenticated()
      return
    }

    const b = await BusinessAPI.getBusiness(businessId)
    if (b) setBusiness(b)

    const { data, error } = await supabase
      .from('phone_orders')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setOrders(data)
    }
    setLoading(false)
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from('phone_orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error) {
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      )
    }
  }

  const filtered = filter === 'active'
    ? orders.filter(o => !['completed', 'cancelled'].includes(o.status))
    : filter === 'completed'
      ? orders.filter(o => o.status === 'completed')
      : filter === 'cancelled'
        ? orders.filter(o => o.status === 'cancelled')
        : orders

  const activeCount = orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length

  return (
    <Layout business={business}>
      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <ShoppingBagIcon className="h-7 w-7 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
              {activeCount > 0 && (
                <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full bg-orange-600 text-white text-xs font-medium">
                  {activeCount} active
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Orders taken by your AI employees over the phone
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          {[
            { key: 'active', label: `Active (${activeCount})` },
            { key: 'all', label: 'All' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === f.key
                  ? 'bg-orange-100 text-orange-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="animate-pulse text-gray-400">Loading orders...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <ShoppingBagIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No orders</h3>
            <p className="text-xs text-gray-500">
              {filter === 'active'
                ? 'No active orders right now.'
                : 'Orders taken during calls will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <div
                key={order.id}
                className={`bg-white rounded-lg border transition-colors ${
                  order.status === 'pending' ? 'border-yellow-200' : 'border-gray-200'
                }`}
              >
                {/* Order Header */}
                <button
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mt-0.5 ${
                        order.order_type === 'delivery' ? 'bg-indigo-100' : 'bg-orange-100'
                      }`}>
                        {order.order_type === 'delivery'
                          ? <TruckIcon className="h-5 w-5 text-indigo-600" />
                          : <ShoppingBagIcon className="h-5 w-5 text-orange-600" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {order.customer_name}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || statusColors.pending}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {order.order_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''} &middot; ${Number(order.total).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</span>
                          {order.estimated_ready && (
                            <span>Ready: {format(new Date(order.estimated_ready), 'h:mm a')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      ${Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedId === order.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 ml-[52px]">
                    {/* Items */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-500">
                            <th className="text-left pb-2">Item</th>
                            <th className="text-center pb-2">Qty</th>
                            <th className="text-right pb-2">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {order.items.map((item, i) => (
                            <tr key={i}>
                              <td className="py-1.5 text-gray-700">
                                {item.name}
                                {item.modifiers?.length ? (
                                  <span className="text-xs text-gray-400 ml-1">
                                    ({item.modifiers.join(', ')})
                                  </span>
                                ) : null}
                                {item.specialInstructions && (
                                  <p className="text-xs text-gray-400 italic">{item.specialInstructions}</p>
                                )}
                              </td>
                              <td className="py-1.5 text-center text-gray-600">{item.quantity}</td>
                              <td className="py-1.5 text-right text-gray-600">${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="border-t border-gray-200 mt-2 pt-2 text-xs text-gray-500 space-y-0.5">
                        <div className="flex justify-between"><span>Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
                        {Number(order.tax) > 0 && <div className="flex justify-between"><span>Tax</span><span>${Number(order.tax).toFixed(2)}</span></div>}
                        {Number(order.delivery_fee) > 0 && <div className="flex justify-between"><span>Delivery fee</span><span>${Number(order.delivery_fee).toFixed(2)}</span></div>}
                        {Number(order.tip) > 0 && <div className="flex justify-between"><span>Tip</span><span>${Number(order.tip).toFixed(2)}</span></div>}
                        <div className="flex justify-between font-medium text-gray-900 text-sm pt-1 border-t border-gray-200">
                          <span>Total</span><span>${Number(order.total).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer info */}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                      {order.customer_phone && (
                        <a href={`tel:${order.customer_phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                          <PhoneIcon className="h-3.5 w-3.5" /> {order.customer_phone}
                        </a>
                      )}
                      {order.customer_email && <span>Email: {order.customer_email}</span>}
                      {order.delivery_address && (
                        <span>
                          Deliver to: {order.delivery_address.street}{order.delivery_address.city ? `, ${order.delivery_address.city}` : ''}
                          {order.delivery_address.instructions && ` (${order.delivery_address.instructions})`}
                        </span>
                      )}
                    </div>

                    {/* Status Actions */}
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <div className="flex items-center gap-2">
                        {/* Show next status button */}
                        {(() => {
                          const currentIdx = statusFlow.indexOf(order.status)
                          const nextStatus = currentIdx >= 0 && currentIdx < statusFlow.length - 1
                            ? statusFlow[currentIdx + 1]
                            : null
                          if (!nextStatus) return null
                          return (
                            <button
                              onClick={() => updateOrderStatus(order.id, nextStatus)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                              Mark {nextStatus.replace('_', ' ')}
                            </button>
                          )
                        })()}
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default function ProtectedOrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersPage />
    </ProtectedRoute>
  )
}

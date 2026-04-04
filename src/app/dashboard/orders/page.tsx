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
  pending: 'bg-accent/10 text-accent',
  confirmed: 'bg-brand-primary/10 text-brand-primary',
  preparing: 'bg-purple-500/10 text-purple-400',
  ready: 'bg-emerald-500/10 text-emerald-500',
  out_for_delivery: 'bg-indigo-500/10 text-indigo-400',
  completed: 'bg-surface-high text-text-secondary',
  cancelled: 'bg-[#93000a]/10 text-[#ffb4ab]',
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
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight">Orders</h1>
          <p className="text-text-secondary mt-1">Orders taken by your AI employees over the phone</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-low p-6 rounded-2xl">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Total Orders</p>
            <p className="text-3xl font-extrabold text-text-primary font-[family-name:var(--font-manrope)]">{orders.length.toLocaleString()}</p>
          </div>
          <div className="bg-surface-low p-6 rounded-2xl">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Active</p>
            <p className="text-3xl font-extrabold text-accent font-[family-name:var(--font-manrope)]">{activeCount}</p>
          </div>
          <div className="bg-surface-low p-6 rounded-2xl">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Completed</p>
            <p className="text-3xl font-extrabold text-emerald-500 font-[family-name:var(--font-manrope)]">{orders.filter(o => o.status === 'completed').length}</p>
          </div>
          <div className="bg-surface-low p-6 rounded-2xl">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Cancelled</p>
            <p className="text-3xl font-extrabold text-[#ffb4ab] font-[family-name:var(--font-manrope)]">{orders.filter(o => o.status === 'cancelled').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
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
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-text-secondary hover:bg-surface-high'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="bg-surface-low rounded-lg border border-[rgba(65,71,84,0.15)] p-12 text-center">
            <div className="animate-pulse text-text-muted">Loading orders...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-low rounded-lg border border-[rgba(65,71,84,0.15)] p-12 text-center">
            <ShoppingBagIcon className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <h3 className="text-sm font-medium text-text-primary mb-1">No orders</h3>
            <p className="text-xs text-text-secondary">
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
                className={`bg-surface-low rounded-lg border transition-colors ${
                  order.status === 'pending' ? 'border-yellow-200' : 'border-[rgba(65,71,84,0.15)]'
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
                        order.order_type === 'delivery' ? 'bg-indigo-500/10' : 'bg-accent/10'
                      }`}>
                        {order.order_type === 'delivery'
                          ? <TruckIcon className="h-5 w-5 text-indigo-400" />
                          : <ShoppingBagIcon className="h-5 w-5 text-orange-600" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">
                            {order.customer_name}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || statusColors.pending}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-high text-text-secondary">
                            {order.order_type}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mt-0.5">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''} &middot; ${Number(order.total).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                          <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</span>
                          {order.estimated_ready && (
                            <span>Ready: {format(new Date(order.estimated_ready), 'h:mm a')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-text-primary">
                      ${Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedId === order.id && (
                  <div className="px-4 pb-4 border-t border-[rgba(65,71,84,0.1)] pt-3 ml-[52px]">
                    {/* Items */}
                    <div className="bg-surface rounded-lg p-3 mb-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-text-secondary">
                            <th className="text-left pb-2">Item</th>
                            <th className="text-center pb-2">Qty</th>
                            <th className="text-right pb-2">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(65,71,84,0.15)]">
                          {order.items.map((item, i) => (
                            <tr key={i}>
                              <td className="py-1.5 text-text-primary">
                                {item.name}
                                {item.modifiers?.length ? (
                                  <span className="text-xs text-text-muted ml-1">
                                    ({item.modifiers.join(', ')})
                                  </span>
                                ) : null}
                                {item.specialInstructions && (
                                  <p className="text-xs text-text-muted italic">{item.specialInstructions}</p>
                                )}
                              </td>
                              <td className="py-1.5 text-center text-text-secondary">{item.quantity}</td>
                              <td className="py-1.5 text-right text-text-secondary">${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="border-t border-[rgba(65,71,84,0.15)] mt-2 pt-2 text-xs text-text-secondary space-y-0.5">
                        <div className="flex justify-between"><span>Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
                        {Number(order.tax) > 0 && <div className="flex justify-between"><span>Tax</span><span>${Number(order.tax).toFixed(2)}</span></div>}
                        {Number(order.delivery_fee) > 0 && <div className="flex justify-between"><span>Delivery fee</span><span>${Number(order.delivery_fee).toFixed(2)}</span></div>}
                        {Number(order.tip) > 0 && <div className="flex justify-between"><span>Tip</span><span>${Number(order.tip).toFixed(2)}</span></div>}
                        <div className="flex justify-between font-medium text-text-primary text-sm pt-1 border-t border-[rgba(65,71,84,0.15)]">
                          <span>Total</span><span>${Number(order.total).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer info */}
                    <div className="flex flex-wrap gap-4 text-xs text-text-secondary mb-3">
                      {order.customer_phone && (
                        <a href={`tel:${order.customer_phone}`} className="flex items-center gap-1 text-brand-primary hover:underline">
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
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-primary bg-brand-primary/5 rounded-lg hover:bg-brand-primary/10 transition-colors"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                              Mark {nextStatus.replace('_', ' ')}
                            </button>
                          )
                        })()}
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="px-3 py-1.5 text-xs font-medium text-[#ffb4ab] bg-[#93000a]/5 rounded-lg hover:bg-[#93000a]/10 transition-colors"
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

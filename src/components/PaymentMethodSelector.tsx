'use client'

import { useState } from 'react'
import { CreditCardIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'

interface PaymentMethodSelectorProps {
  selectedMethod: 'stripe' | 'square'
  onMethodChange: (method: 'stripe' | 'square') => void
  availableMethods?: {
    stripe?: boolean
    square?: boolean
  }
}

export default function PaymentMethodSelector({ 
  selectedMethod, 
  onMethodChange, 
  availableMethods = { stripe: true, square: true } 
}: PaymentMethodSelectorProps) {
  const methods = [
    {
      id: 'stripe' as const,
      name: 'Credit Card',
      description: 'Visa, Mastercard, Amex',
      icon: CreditCardIcon,
      available: availableMethods.stripe,
      colors: {
        selected: 'border-blue-500 bg-blue-50 text-blue-700',
        unselected: 'border-gray-200 hover:border-gray-300'
      }
    },
    {
      id: 'square' as const,
      name: 'Square',
      description: 'Card & Digital Payments',
      icon: BuildingStorefrontIcon,
      available: availableMethods.square,
      colors: {
        selected: 'border-green-500 bg-green-50 text-green-700',
        unselected: 'border-gray-200 hover:border-gray-300'
      }
    }
  ]

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Choose Payment Method
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {methods.map((method) => {
          if (!method.available) return null
          
          const isSelected = selectedMethod === method.id
          const Icon = method.icon
          
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onMethodChange(method.id)}
              className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                isSelected ? method.colors.selected : method.colors.unselected
              } ${!method.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={!method.available}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  isSelected 
                    ? method.id === 'stripe' ? 'bg-blue-100' : 'bg-green-100'
                    : 'bg-gray-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    isSelected 
                      ? method.id === 'stripe' ? 'text-blue-600' : 'text-green-600'
                      : 'text-gray-600'
                  }`} />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{method.name}</div>
                  <div className="text-xs text-gray-500">{method.description}</div>
                </div>
                {isSelected && (
                  <div className="ml-auto">
                    <div className={`w-4 h-4 rounded-full ${
                      method.id === 'stripe' ? 'bg-blue-600' : 'bg-green-600'
                    } flex items-center justify-center`}>
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
      
      {selectedMethod === 'stripe' && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💳 Secure payment processing powered by Stripe
          </p>
        </div>
      )}
      
      {selectedMethod === 'square' && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-700">
            🏪 Trusted payment processing by Square
          </p>
        </div>
      )}
    </div>
  )
}
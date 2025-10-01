'use client'

import { useState } from 'react'
import { 
  CreditCardIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import type { PaymentProcessor } from '../lib/supabase-types-mvp'

interface PaymentProcessorConfigProps {
  processor: Partial<PaymentProcessor> & { processor_type: 'square' | 'stripe' | 'paypal' }
  onSave: (config: Partial<PaymentProcessor>) => Promise<void>
  onTest?: (config: Partial<PaymentProcessor>) => Promise<boolean>
  onImportServices?: (processor: string, config: Partial<PaymentProcessor>) => Promise<void>
  isLoading?: boolean
  className?: string
  businessId?: string
}

export default function PaymentProcessorConfig({
  processor,
  onSave,
  onTest,
  onImportServices,
  isLoading = false,
  className = '',
  businessId
}: PaymentProcessorConfigProps) {
  const [config, setConfig] = useState<Partial<PaymentProcessor>>(processor)
  const [showSecrets, setShowSecrets] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle')
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)

  const validateConfig = () => {
    const newErrors: Record<string, string> = {}

    if (!config.api_key_public?.trim()) {
      newErrors.api_key_public = 'Public API key is required'
    }

    if (!config.api_key_secret?.trim()) {
      newErrors.api_key_secret = 'Secret API key is required'
    }

    if (config.processor_type === 'square' && !config.application_id?.trim()) {
      newErrors.application_id = 'Application ID is required for Square'
    }

    if (!config.account_id?.trim()) {
      newErrors.account_id = `${config.processor_type === 'square' ? 'Location' : 'Account'} ID is required`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleTest = async () => {
    if (!onTest || !validateConfig()) return

    setTestStatus('testing')
    try {
      const success = await onTest(config)
      setTestStatus(success ? 'success' : 'error')
    } catch (error) {
      setTestStatus('error')
    }
  }

  const handleSave = async () => {
    if (!validateConfig()) return

    try {
      await onSave(config)
      setTestStatus('idle')
    } catch (error) {
      console.error('Failed to save processor config:', error)
    }
  }

  const handleImportServices = async () => {
    if (!businessId || !config.api_key_secret) {
      alert('Please save your payment processor configuration first')
      return
    }

    setImportStatus('importing')
    setImportResult(null)
    
    try {
      const response = await fetch('/api/payments/import-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          processor: config.processor_type,
          apiKey: config.processor_type === 'stripe' ? config.api_key_secret : undefined,
          squareAccessToken: config.processor_type === 'square' ? config.api_key_secret : undefined
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setImportStatus('success')
      setImportResult({ imported: data.imported, skipped: data.skipped })
      
      if (onImportServices) {
        await onImportServices(config.processor_type!, config)
      }
    } catch (error) {
      console.error('Service import error:', error)
      setImportStatus('error')
    }
  }

  const updateField = (field: keyof PaymentProcessor, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    if (testStatus !== 'idle') {
      setTestStatus('idle')
    }
  }

  const processorInfo = {
    square: {
      name: 'Square',
      color: 'bg-blue-600',
      docs: 'https://developer.squareup.com/docs',
      fields: {
        api_key_public: 'Application ID',
        api_key_secret: 'Access Token',
        application_id: 'Application ID',
        account_id: 'Location ID'
      }
    },
    stripe: {
      name: 'Stripe',
      color: 'bg-indigo-600',
      docs: 'https://stripe.com/docs',
      fields: {
        api_key_public: 'Publishable Key',
        api_key_secret: 'Secret Key',
        account_id: 'Account ID'
      }
    },
    paypal: {
      name: 'PayPal',
      color: 'bg-blue-500',
      docs: 'https://developer.paypal.com/api/rest/',
      fields: {
        api_key_public: 'Client ID',
        api_key_secret: 'Client Secret',
        account_id: 'Merchant ID'
      }
    }
  }

  const info = processorInfo[config.processor_type || 'square']

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${info.color}`}>
              <CreditCardIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{info.name} Configuration</h3>
              <p className="text-sm text-gray-500">
                Configure your {info.name} payment processor
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {config.is_active && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="w-3 h-3 mr-1" />
                Active
              </span>
            )}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Environment
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!config.is_live_mode}
                  onChange={() => updateField('is_live_mode', false)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">Sandbox/Test</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={config.is_live_mode}
                  onChange={() => updateField('is_live_mode', true)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">Live/Production</span>
              </label>
            </div>
            {config.is_live_mode && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      You're configuring live/production mode. Real transactions will be processed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* API Keys */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="api_key_public" className="block text-sm font-medium text-gray-700">
                {info.fields.api_key_public} *
              </label>
              <input
                type="text"
                id="api_key_public"
                value={config.api_key_public || ''}
                onChange={(e) => updateField('api_key_public', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                  errors.api_key_public ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={`Enter your ${info.fields.api_key_public}`}
                disabled={isLoading}
              />
              {errors.api_key_public && (
                <p className="mt-1 text-sm text-red-600">{errors.api_key_public}</p>
              )}
            </div>

            <div>
              <label htmlFor="api_key_secret" className="block text-sm font-medium text-gray-700">
                {info.fields.api_key_secret} *
              </label>
              <div className="mt-1 relative">
                <input
                  type={showSecrets ? 'text' : 'password'}
                  id="api_key_secret"
                  value={config.api_key_secret || ''}
                  onChange={(e) => updateField('api_key_secret', e.target.value)}
                  className={`block w-full pr-10 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                    errors.api_key_secret ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={`Enter your ${info.fields.api_key_secret}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showSecrets ? (
                    <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.api_key_secret && (
                <p className="mt-1 text-sm text-red-600">{errors.api_key_secret}</p>
              )}
            </div>

            {config.processor_type === 'square' && (
              <div>
                <label htmlFor="application_id" className="block text-sm font-medium text-gray-700">
                  Application ID *
                </label>
                <input
                  type="text"
                  id="application_id"
                  value={config.application_id || ''}
                  onChange={(e) => updateField('application_id', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                    errors.application_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your Application ID"
                  disabled={isLoading}
                />
                {errors.application_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.application_id}</p>
                )}
              </div>
            )}

            {config.processor_type === 'paypal' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  PayPal Environment
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!config.is_live_mode}
                      onChange={() => updateField('is_live_mode', false)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700">Sandbox</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={config.is_live_mode}
                      onChange={() => updateField('is_live_mode', true)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700">Live</span>
                  </label>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="account_id" className="block text-sm font-medium text-gray-700">
                {info.fields.account_id} *
              </label>
              <input
                type="text"
                id="account_id"
                value={config.account_id || ''}
                onChange={(e) => updateField('account_id', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                  errors.account_id ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={`Enter your ${info.fields.account_id}`}
                disabled={isLoading}
              />
              {errors.account_id && (
                <p className="mt-1 text-sm text-red-600">{errors.account_id}</p>
              )}
            </div>
          </div>

          {/* Webhook Secret */}
          <div>
            <label htmlFor="webhook_secret" className="block text-sm font-medium text-gray-700">
              Webhook Secret (Optional)
            </label>
            <input
              type={showSecrets ? 'text' : 'password'}
              id="webhook_secret"
              value={config.webhook_secret || ''}
              onChange={(e) => updateField('webhook_secret', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Enter webhook signing secret"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Used to verify webhook authenticity. Recommended for production.
            </p>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-capture payments</label>
                <p className="text-xs text-gray-500">Automatically capture authorized payments</p>
              </div>
              <input
                type="checkbox"
                checked={config.auto_capture ?? true}
                onChange={(e) => updateField('auto_capture', e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable tips</label>
                <p className="text-xs text-gray-500">Allow customers to add tips during checkout</p>
              </div>
              <input
                type="checkbox"
                checked={config.allow_tips ?? true}
                onChange={(e) => updateField('allow_tips', e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Tip Percentages */}
          {config.allow_tips && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default tip percentages
              </label>
              <div className="flex space-x-2">
                {[15, 18, 20, 25].map(percentage => {
                  const isSelected = config.default_tip_percentages?.includes(percentage) ?? false
                  return (
                    <button
                      key={percentage}
                      type="button"
                      onClick={() => {
                        const current = config.default_tip_percentages || []
                        const updated = isSelected
                          ? current.filter(p => p !== percentage)
                          : [...current, percentage].sort((a, b) => a - b)
                        updateField('default_tip_percentages', updated)
                      }}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        isSelected
                          ? 'bg-purple-100 border-purple-300 text-purple-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      disabled={isLoading}
                    >
                      {percentage}%
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Test Status */}
          {testStatus !== 'idle' && (
            <div className={`p-3 rounded-md ${
              testStatus === 'success' ? 'bg-green-50 border border-green-200' :
              testStatus === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center">
                {testStatus === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-400" />}
                {testStatus === 'error' && <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />}
                {testStatus === 'testing' && <InformationCircleIcon className="h-5 w-5 text-blue-400 animate-spin" />}
                <div className="ml-3">
                  <p className={`text-sm ${
                    testStatus === 'success' ? 'text-green-700' :
                    testStatus === 'error' ? 'text-red-700' :
                    'text-blue-700'
                  }`}>
                    {testStatus === 'success' && 'Connection test successful!'}
                    {testStatus === 'error' && 'Connection test failed. Please check your configuration.'}
                    {testStatus === 'testing' && 'Testing connection...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Import Status */}
          {importStatus !== 'idle' && (
            <div className={`p-3 rounded-md ${
              importStatus === 'success' ? 'bg-green-50 border border-green-200' :
              importStatus === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center">
                {importStatus === 'success' && <SparklesIcon className="h-5 w-5 text-green-400" />}
                {importStatus === 'error' && <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />}
                {importStatus === 'importing' && <ArrowDownTrayIcon className="h-5 w-5 text-blue-400 animate-bounce" />}
                <div className="ml-3">
                  <p className={`text-sm ${
                    importStatus === 'success' ? 'text-green-700' :
                    importStatus === 'error' ? 'text-red-700' :
                    'text-blue-700'
                  }`}>
                    {importStatus === 'success' && importResult && `Successfully imported ${importResult.imported} services${importResult.skipped > 0 ? ` (${importResult.skipped} already existed)` : ''}!`}
                    {importStatus === 'error' && 'Service import failed. Please check your configuration.'}
                    {importStatus === 'importing' && 'Importing services from your catalog...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <a
              href={info.docs}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              View {info.name} documentation →
            </a>

            <div className="flex items-center space-x-3">
              {(config.processor_type === 'stripe' || config.processor_type === 'square') && businessId && (
                <button
                  type="button"
                  onClick={handleImportServices}
                  disabled={isLoading || importStatus === 'importing' || !config.api_key_secret}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-md text-sm font-medium hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 flex items-center space-x-2"
                  title="Import your existing service catalog"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>Import Services</span>
                </button>
              )}
              {onTest && (
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isLoading || testStatus === 'testing'}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-purple-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
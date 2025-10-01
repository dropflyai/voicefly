'use client'

import { useState } from 'react'
import Layout from '../../../components/Layout'
import {
  BuildingOfficeIcon,
  ClockIcon,
  BellIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  GlobeAltIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  MapPinIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface BusinessHours {
  [key: string]: { open: string; close: string; isOpen: boolean }
}

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('business')
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { open: '09:00', close: '18:00', isOpen: true },
    tuesday: { open: '09:00', close: '18:00', isOpen: true },
    wednesday: { open: '09:00', close: '18:00', isOpen: true },
    thursday: { open: '09:00', close: '18:00', isOpen: true },
    friday: { open: '09:00', close: '18:00', isOpen: true },
    saturday: { open: '09:00', close: '16:00', isOpen: true },
    sunday: { open: '11:00', close: '15:00', isOpen: false }
  })

  const [notifications, setNotifications] = useState({
    emailBookings: true,
    smsBookings: true,
    emailCancellations: true,
    smsCancellations: false,
    dailyReports: true,
    weeklyReports: true,
    marketingEmails: false
  })

  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const tabs = [
    { id: 'business', name: 'Business Profile', icon: BuildingOfficeIcon },
    { id: 'hours', name: 'Business Hours', icon: ClockIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'team', name: 'Team Access', icon: UserGroupIcon },
    { id: 'integrations', name: 'Integrations', icon: GlobeAltIcon }
  ]

  const updateBusinessHours = (day: string, field: string, value: string | boolean) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  const updateNotification = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your business settings and preferences
          </p>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0 mr-8">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    activeTab === tab.id
                      ? 'bg-brand-100 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <tab.icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'business' && (
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Business Profile</h2>
                    <button
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      className="btn-secondary"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      {isEditingProfile ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Business Name</label>
                      <input
                        type="text"
                        className="input-field"
                        defaultValue="dropfly"
                        disabled={!isEditingProfile}
                      />
                    </div>

                    <div>
                      <label className="label">Business Type</label>
                      <select
                        className="input-field"
                        defaultValue="nail_salon"
                        disabled={!isEditingProfile}
                      >
                        <option value="nail_salon">Nail Salon</option>
                        <option value="spa">Beauty Spa</option>
                        <option value="beauty_clinic">Beauty Clinic</option>
                        <option value="barbershop">Barbershop</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Phone Number</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <DevicePhoneMobileIcon className="h-4 w-4" />
                        </span>
                        <input
                          type="tel"
                          className="input-field rounded-l-none"
                          defaultValue="(555) 123-4567"
                          disabled={!isEditingProfile}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Email Address</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <EnvelopeIcon className="h-4 w-4" />
                        </span>
                        <input
                          type="email"
                          className="input-field rounded-l-none"
                          defaultValue="hello@bellanails.com"
                          disabled={!isEditingProfile}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="label">Business Address</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <MapPinIcon className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          className="input-field rounded-l-none"
                          defaultValue="123 Beauty Lane, Los Angeles, CA 90210"
                          disabled={!isEditingProfile}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Website</label>
                      <input
                        type="url"
                        className="input-field"
                        defaultValue="https://bellanails.com"
                        disabled={!isEditingProfile}
                      />
                    </div>

                    <div>
                      <label className="label">Timezone</label>
                      <select
                        className="input-field"
                        defaultValue="America/Los_Angeles"
                        disabled={!isEditingProfile}
                      >
                        <option value="America/Los_Angeles">Pacific (PT)</option>
                        <option value="America/Denver">Mountain (MT)</option>
                        <option value="America/Chicago">Central (CT)</option>
                        <option value="America/New_York">Eastern (ET)</option>
                      </select>
                    </div>
                  </div>

                  {isEditingProfile && (
                    <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="btn-primary"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'hours' && (
              <div className="card">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Business Hours</h2>
                  
                  <div className="space-y-4">
                    {daysOfWeek.map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-4">
                        <div className="w-24">
                          <span className="text-sm font-medium text-gray-700">{label}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateBusinessHours(key, 'isOpen', !businessHours[key].isOpen)}
                            className={clsx(
                              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                              businessHours[key].isOpen ? 'bg-brand-600' : 'bg-gray-200'
                            )}
                          >
                            <span
                              className={clsx(
                                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                businessHours[key].isOpen ? 'translate-x-5' : 'translate-x-0'
                              )}
                            />
                          </button>
                          <span className="text-sm text-gray-500">
                            {businessHours[key].isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>

                        {businessHours[key].isOpen && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="time"
                              value={businessHours[key].open}
                              onChange={(e) => updateBusinessHours(key, 'open', e.target.value)}
                              className="input-field w-32"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="time"
                              value={businessHours[key].close}
                              onChange={(e) => updateBusinessHours(key, 'close', e.target.value)}
                              className="input-field w-32"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Settings</h3>
                    <div className="space-y-2">
                      <button className="text-sm text-brand-600 hover:text-brand-700">
                        Copy Monday hours to all weekdays
                      </button>
                      <br />
                      <button className="text-sm text-brand-600 hover:text-brand-700">
                        Set weekend hours (9 AM - 4 PM)
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button className="btn-primary">
                      Save Business Hours
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="card">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Notifications</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'emailBookings', label: 'Email notifications for new bookings', description: 'Get notified when customers book appointments' },
                          { key: 'smsBookings', label: 'SMS notifications for new bookings', description: 'Receive text messages for urgent bookings' },
                          { key: 'emailCancellations', label: 'Email notifications for cancellations', description: 'Get notified when customers cancel appointments' },
                          { key: 'smsCancellations', label: 'SMS notifications for cancellations', description: 'Receive text messages for last-minute cancellations' }
                        ].map(({ key, label, description }) => (
                          <div key={key} className="flex items-start space-x-3">
                            <button
                              onClick={() => updateNotification(key, !notifications[key as keyof typeof notifications])}
                              className={clsx(
                                'mt-1 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                                notifications[key as keyof typeof notifications] ? 'bg-brand-600' : 'bg-gray-200'
                              )}
                            >
                              <span
                                className={clsx(
                                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                  notifications[key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'
                                )}
                              />
                            </button>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{label}</div>
                              <div className="text-sm text-gray-500">{description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Business Reports</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'dailyReports', label: 'Daily summary reports', description: 'Receive daily summaries of appointments and revenue' },
                          { key: 'weeklyReports', label: 'Weekly analytics reports', description: 'Get weekly insights on business performance' },
                          { key: 'marketingEmails', label: 'Marketing and feature updates', description: 'Stay informed about new features and tips' }
                        ].map(({ key, label, description }) => (
                          <div key={key} className="flex items-start space-x-3">
                            <button
                              onClick={() => updateNotification(key, !notifications[key as keyof typeof notifications])}
                              className={clsx(
                                'mt-1 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                                notifications[key as keyof typeof notifications] ? 'bg-brand-600' : 'bg-gray-200'
                              )}
                            >
                              <span
                                className={clsx(
                                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                  notifications[key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'
                                )}
                              />
                            </button>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{label}</div>
                              <div className="text-sm text-gray-500">{description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button className="btn-primary">
                      Save Notification Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="card">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Password & Security</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="label">Current Password</label>
                        <input type="password" className="input-field" />
                      </div>
                      
                      <div>
                        <label className="label">New Password</label>
                        <input type="password" className="input-field" />
                      </div>
                      
                      <div>
                        <label className="label">Confirm New Password</label>
                        <input type="password" className="input-field" />
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <button className="btn-primary">
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                    <p className="text-gray-600 mb-4">
                      Add an extra layer of security to your account with two-factor authentication.
                    </p>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">SMS Authentication</div>
                        <div className="text-sm text-gray-500">Receive codes via text message</div>
                      </div>
                      <button className="btn-secondary">
                        Enable
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Team Access</h2>
                    <button className="btn-primary">
                      <UserGroupIcon className="h-4 w-4 mr-2" />
                      Invite Team Member
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-brand-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">JS</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">John Smith</div>
                          <div className="text-sm text-gray-500">john@bellanails.com</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Owner
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-beauty-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">MR</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Maya Rodriguez</div>
                          <div className="text-sm text-gray-500">maya@bellanails.com</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Manager
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="card">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Integrations</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckIcon className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Google Calendar</h3>
                            <p className="text-sm text-gray-500">Sync appointments</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Connected
                        </span>
                      </div>
                      <button className="text-sm text-brand-600 hover:text-brand-700">
                        Configure
                      </button>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <EnvelopeIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Gmail</h3>
                            <p className="text-sm text-gray-500">Send email notifications</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Connected
                        </span>
                      </div>
                      <button className="text-sm text-brand-600 hover:text-brand-700">
                        Configure
                      </button>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <CreditCardIcon className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Stripe</h3>
                            <p className="text-sm text-gray-500">Process payments</p>
                          </div>
                        </div>
                        <button className="btn-secondary text-sm">
                          Connect
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Accept credit card payments and deposits
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <DevicePhoneMobileIcon className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Twilio SMS</h3>
                            <p className="text-sm text-gray-500">Send text reminders</p>
                          </div>
                        </div>
                        <button className="btn-secondary text-sm">
                          Connect
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Send appointment reminders via SMS
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
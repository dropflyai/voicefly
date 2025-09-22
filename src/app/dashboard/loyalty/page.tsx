"use client"

import { useState, useEffect } from 'react'
import { Star, Gift, Users, TrendingUp, Award, Crown, Target, Plus, Edit, Settings } from 'lucide-react'

interface LoyaltyMember {
  id: string
  customer_name: string
  email: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  points_balance: number
  points_earned: number
  points_redeemed: number
  join_date: string
  last_activity: string
  total_spent: number
}

interface LoyaltyProgram {
  id: string
  name: string
  description: string
  points_per_dollar: number
  tiers: {
    name: string
    min_points: number
    benefits: string[]
    multiplier: number
  }[]
}

export default function LoyaltyPage() {
  const [members, setMembers] = useState<LoyaltyMember[]>([])
  const [program, setProgram] = useState<LoyaltyProgram | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'program'>('overview')

  useEffect(() => {
    // Demo loyalty program data
    const demoProgram: LoyaltyProgram = {
      id: 'prog_1',
      name: 'VoiceFly Rewards',
      description: 'Earn points for every interaction and unlock exclusive benefits',
      points_per_dollar: 10,
      tiers: [
        {
          name: 'Bronze',
          min_points: 0,
          benefits: ['Basic support', 'Monthly newsletter'],
          multiplier: 1.0
        },
        {
          name: 'Silver',
          min_points: 1000,
          benefits: ['Priority support', 'Quarterly reports', '5% discount'],
          multiplier: 1.25
        },
        {
          name: 'Gold',
          min_points: 2500,
          benefits: ['Premium support', 'Custom integrations', '10% discount', 'Beta features'],
          multiplier: 1.5
        },
        {
          name: 'Platinum',
          min_points: 5000,
          benefits: ['Dedicated account manager', 'White-label options', '15% discount', 'Priority features'],
          multiplier: 2.0
        }
      ]
    }

    const demoMembers: LoyaltyMember[] = [
      {
        id: 'member_1',
        customer_name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        tier: 'gold',
        points_balance: 3450,
        points_earned: 4200,
        points_redeemed: 750,
        join_date: '2024-01-15',
        last_activity: '2024-06-14',
        total_spent: 42000
      },
      {
        id: 'member_2',
        customer_name: 'Michael Chen',
        email: 'michael.chen@bizorp.com',
        tier: 'silver',
        points_balance: 1250,
        points_earned: 1600,
        points_redeemed: 350,
        join_date: '2024-02-20',
        last_activity: '2024-06-13',
        total_spent: 16000
      },
      {
        id: 'member_3',
        customer_name: 'Jennifer Walsh',
        email: 'j.walsh@startup.io',
        tier: 'platinum',
        points_balance: 7800,
        points_earned: 9200,
        points_redeemed: 1400,
        join_date: '2023-11-10',
        last_activity: '2024-06-15',
        total_spent: 92000
      },
      {
        id: 'member_4',
        customer_name: 'David Rodriguez',
        email: 'david.r@consulting.com',
        tier: 'bronze',
        points_balance: 450,
        points_earned: 500,
        points_redeemed: 50,
        join_date: '2024-05-01',
        last_activity: '2024-06-10',
        total_spent: 5000
      }
    ]

    setProgram(demoProgram)
    setMembers(demoMembers)
  }, [])

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-orange-600 bg-orange-100'
      case 'silver': return 'text-gray-600 bg-gray-100'
      case 'gold': return 'text-yellow-600 bg-yellow-100'
      case 'platinum': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return <Award className="h-4 w-4 text-orange-500" />
      case 'silver': return <Star className="h-4 w-4 text-gray-500" />
      case 'gold': return <Crown className="h-4 w-4 text-yellow-500" />
      case 'platinum': return <Crown className="h-4 w-4 text-purple-500" />
      default: return <Award className="h-4 w-4 text-gray-500" />
    }
  }

  const totalMembers = members.length
  const totalPointsEarned = members.reduce((sum, m) => sum + m.points_earned, 0)
  const totalPointsRedeemed = members.reduce((sum, m) => sum + m.points_redeemed, 0)
  const averagePointsPerMember = totalMembers > 0 ? Math.round(totalPointsEarned / totalMembers) : 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loyalty Program</h1>
          <p className="text-gray-600">Manage customer rewards and loyalty tiers</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'members'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Members
              </button>
              <button
                onClick={() => setActiveTab('program')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'program'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Program Settings
              </button>
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Total Members</p>
                      <p className="text-3xl font-bold">{totalMembers}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Points Earned</p>
                      <p className="text-3xl font-bold">{totalPointsEarned.toLocaleString()}</p>
                    </div>
                    <Star className="h-8 w-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Points Redeemed</p>
                      <p className="text-3xl font-bold">{totalPointsRedeemed.toLocaleString()}</p>
                    </div>
                    <Gift className="h-8 w-8 text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Avg Points/Member</p>
                      <p className="text-3xl font-bold">{averagePointsPerMember}</p>
                    </div>
                    <Target className="h-8 w-8 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Tier Distribution */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Distribution by Tier</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {['bronze', 'silver', 'gold', 'platinum'].map((tier) => {
                    const count = members.filter(m => m.tier === tier).length
                    const percentage = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0
                    return (
                      <div key={tier} className="text-center">
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getTierColor(tier)} mb-2`}>
                          {getTierIcon(tier)}
                          <span className="ml-2 capitalize">{tier}</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{count}</div>
                        <div className="text-sm text-gray-500">{percentage}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Earned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Activity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">{member.customer_name}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getTierIcon(member.tier)}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(member.tier)}`}>
                              {member.tier}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {member.points_balance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.points_earned.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${(member.total_spent / 100).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(member.last_activity).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Program Settings Tab */}
          {activeTab === 'program' && program && (
            <div className="p-6">
              <div className="max-w-4xl">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Program Name</label>
                        <input
                          type="text"
                          defaultValue={program.name}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Points per Dollar</label>
                        <input
                          type="number"
                          defaultValue={program.points_per_dollar}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          rows={3}
                          defaultValue={program.description}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tier Configuration</h3>
                  <div className="space-y-4">
                    {program.tiers.map((tier, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {getTierIcon(tier.name.toLowerCase() as any)}
                            <h4 className="font-medium text-gray-900 capitalize">{tier.name}</h4>
                          </div>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Points</label>
                            <input
                              type="number"
                              defaultValue={tier.min_points}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Points Multiplier</label>
                            <input
                              type="number"
                              step="0.1"
                              defaultValue={tier.multiplier}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                            <div className="text-sm text-gray-600">
                              {tier.benefits.join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Save Changes
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
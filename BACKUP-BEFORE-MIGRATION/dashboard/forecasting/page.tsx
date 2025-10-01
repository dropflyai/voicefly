"use client"

import { TrendingUp, Target, Calculator } from 'lucide-react'

export default function ForecastingPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Revenue Forecasting</h1>
          <p className="text-gray-600">AI-powered revenue predictions and goal tracking</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Projected Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$125,000</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Goal Progress</p>
                <p className="text-2xl font-bold text-gray-900">73%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Confidence Score</p>
                <p className="text-2xl font-bold text-gray-900">87%</p>
              </div>
              <Calculator className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Forecasting Models</h3>
          <p className="text-gray-600">Advanced forecasting capabilities will be available here.</p>
        </div>
      </div>
    </div>
  )
}
"use client"

import { Brain, Upload, Play, BarChart3 } from 'lucide-react'

export default function AITrainingPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Training</h1>
          <p className="text-gray-600">Train and optimize your voice AI assistant performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Brain className="h-6 w-6 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold">Model Training</h3>
            </div>
            <p className="text-gray-600 mb-4">Upload conversation data to improve AI responses</p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Training Data
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Play className="h-6 w-6 text-green-500 mr-2" />
              <h3 className="text-lg font-semibold">Test Scenarios</h3>
            </div>
            <p className="text-gray-600 mb-4">Run simulated conversations to test AI performance</p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
              <Play className="h-4 w-4" />
              Run Test
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-6 w-6 text-purple-500 mr-2" />
              <h3 className="text-lg font-semibold">Performance Metrics</h3>
            </div>
            <p className="text-gray-600 mb-4">View AI accuracy and improvement metrics</p>
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
              <BarChart3 className="h-4 w-4" />
              View Metrics
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Model Accuracy</span>
              <span className="text-sm font-medium">94.2%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{width: '94.2%'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
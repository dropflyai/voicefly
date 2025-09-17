"use client"

import { useState } from 'react'
import { FileText, Download, Calendar, BarChart } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600">Generate and download detailed performance reports</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <BarChart className="h-6 w-6 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold">Call Performance Report</h3>
            </div>
            <p className="text-gray-600 mb-4">Detailed analysis of call metrics and outcomes</p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              Generate Report
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 text-green-500 mr-2" />
              <h3 className="text-lg font-semibold">Monthly Summary</h3>
            </div>
            <p className="text-gray-600 mb-4">Comprehensive monthly performance overview</p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              Generate Report
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-purple-500 mr-2" />
              <h3 className="text-lg font-semibold">Custom Report</h3>
            </div>
            <p className="text-gray-600 mb-4">Build your own custom analytics report</p>
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              Create Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
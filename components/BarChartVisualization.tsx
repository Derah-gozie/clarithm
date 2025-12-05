'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import ReactMarkdown from 'react-markdown'

interface BarChartData {
  chartType: string
  title: string
  xAxisLabel: string
  yAxisLabel: string
  data: Array<{ name: string; value: number }>
  insights: string
}

interface BarChartVisualizationProps {
  jsonData: string
}

export default function BarChartVisualization({ jsonData }: BarChartVisualizationProps) {
  let chartData: BarChartData

  try {
    // Try to parse the JSON
    chartData = JSON.parse(jsonData)
  } catch (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">Chart Generation Error</h3>
        <p className="text-red-600 text-sm">
          Failed to parse chart data. The AI may have returned invalid JSON.
        </p>
        <details className="mt-2">
          <summary className="text-red-700 text-sm cursor-pointer">Show raw response</summary>
          <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
            {jsonData}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{chartData.title}</h3>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              label={{ value: chartData.xAxisLabel, position: 'insideBottom', offset: -5 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              label={{ value: chartData.yAxisLabel, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" name={chartData.yAxisLabel} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      {chartData.insights && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-blue-900 font-semibold mb-2">Key Insights</h4>
          <div className="prose prose-sm max-w-none text-blue-800">
            <ReactMarkdown>{chartData.insights}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}

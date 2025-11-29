'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Dataset {
  id: string
  file_name: string
  prompt: string | null
  created_at: string
  file_size_bytes: number
  insights_status: 'pending' | 'processing' | 'completed' | 'failed' | null
  insights_markdown: string | null
  insights_generated_at: string | null
  insights_model: string | null
  insights_tokens_used: number | null
  insights_cost: number | null
  insights_error: string | null
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState('')
  const [generatingInsights, setGeneratingInsights] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      console.log('🏠 DASHBOARD: Checking authentication...')

      const { data: { user }, error } = await supabase.auth.getUser()

      console.log('🏠 DASHBOARD: Auth check result:', {
        user: user?.email,
        error: error?.message,
        hasUser: !!user
      })

      if (!user) {
        console.log('❌ DASHBOARD: No user found, redirecting to login')
        router.push('/')
        return
      }

      console.log('✅ DASHBOARD: User authenticated:', user.email)
      setUser(user)

      // Fetch datasets
      const { data } = await supabase
        .from('datasets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setDatasets(data)
      }

      setLoading(false)
    }

    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xls|xlsx)$/i)) {
        setError('Please select a CSV or Excel file')
        return
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }

      setFile(selectedFile)
      setError('')
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !user) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError('')

    try {
      const fileId = uuidv4()
      const filePath = `${user.id}/${fileId}/${file.name}`

      console.log('📤 UPLOAD: Starting upload...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        hasPrompt: !!prompt.trim(),
        promptLength: prompt.trim().length
      })

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      console.log('✅ UPLOAD: File uploaded to storage at:', filePath)

      // Insert metadata into database
      const dataToInsert = {
        user_id: user.id,
        file_name: file.name,
        storage_path: filePath,
        file_type: file.type || 'application/octet-stream',
        file_size_bytes: file.size,
        prompt: prompt.trim() || null,
        status: 'uploaded'
      }

      console.log('💾 UPLOAD: Saving to database:', dataToInsert)

      const { error: dbError, data: insertedData } = await supabase
        .from('datasets')
        .insert(dataToInsert)
        .select()

      if (dbError) throw dbError

      console.log('✅ UPLOAD: Saved to database:', insertedData)

      // Refresh datasets list
      const { data } = await supabase
        .from('datasets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setDatasets(data)
      }

      // Reset form
      setFile(null)
      setPrompt('')
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateInsights = async (datasetId: string) => {
    setGeneratingInsights(prev => ({ ...prev, [datasetId]: true }))
    setError('')

    try {
      console.log(`🤖 Generating insights for dataset: ${datasetId}`)

      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ datasetId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate insights')
      }

      const result = await response.json()
      console.log(`✅ Insights generated:`, result)

      // Refresh datasets to get updated insights
      const { data } = await supabase
        .from('datasets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setDatasets(data)
      }

    } catch (err: any) {
      console.error('Failed to generate insights:', err)
      setError(err.message || 'Failed to generate insights')
    } finally {
      setGeneratingInsights(prev => ({ ...prev, [datasetId]: false }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">Clarithm</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h2>
        <p className="text-gray-600 mb-8">Welcome, {user?.email}!</p>

        {/* Upload Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold mb-4">Upload Dataset</h3>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV or Excel file
              </label>
              <input
                id="file-input"
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileChange}
                disabled={uploading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What insights do you want? (Optional)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={uploading}
                placeholder="e.g., Analyze sales trends by region and identify top performers..."
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 resize-none"
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">
                  Describe what you want to learn from this data
                </p>
                <p className={`text-xs ${prompt.length > 900 ? 'text-orange-600' : 'text-gray-500'}`}>
                  {prompt.length}/1000
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </form>
        </div>

        {/* Datasets List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Your Datasets</h3>

          {datasets.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No datasets uploaded yet. Upload your first file above!
            </p>
          ) : (
            <div className="space-y-4">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{dataset.file_name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Uploaded {new Date(dataset.created_at).toLocaleDateString()} •
                        {' '}{(dataset.file_size_bytes / 1024).toFixed(2)} KB
                      </p>
                      {dataset.prompt && (
                        <p className="text-sm text-gray-700 mt-2 bg-blue-50 p-2 rounded">
                          <span className="font-medium">Prompt:</span> {dataset.prompt}
                        </p>
                      )}
                    </div>
                    <div>
                      {dataset.insights_status === 'completed' ? (
                        <div className="text-xs text-green-600 font-medium">
                          ✓ Insights Ready
                        </div>
                      ) : dataset.insights_status === 'processing' || generatingInsights[dataset.id] ? (
                        <div className="text-xs text-blue-600 font-medium animate-pulse">
                          Generating...
                        </div>
                      ) : dataset.insights_status === 'failed' ? (
                        <button
                          onClick={() => handleGenerateInsights(dataset.id)}
                          className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                        >
                          Retry
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGenerateInsights(dataset.id)}
                          disabled={generatingInsights[dataset.id]}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Generate Insights
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Insights Display */}
                  {dataset.insights_status === 'completed' && dataset.insights_markdown && (
                    <div className="mt-4 border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="text-sm font-semibold text-gray-900">AI Insights</h5>
                        <div className="text-xs text-gray-500">
                          {dataset.insights_model} • {dataset.insights_tokens_used?.toLocaleString()} tokens
                          {dataset.insights_cost && ` • $${dataset.insights_cost.toFixed(4)}`}
                        </div>
                      </div>
                      <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {dataset.insights_markdown}
                        </ReactMarkdown>
                      </div>
                      {dataset.insights_generated_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          Generated {new Date(dataset.insights_generated_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Error Display */}
                  {dataset.insights_status === 'failed' && dataset.insights_error && (
                    <div className="mt-4 border-t pt-4">
                      <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
                        <p className="font-medium">Failed to generate insights</p>
                        <p className="text-xs mt-1">{dataset.insights_error}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

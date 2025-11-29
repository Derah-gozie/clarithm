'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Check if already logged in
  useEffect(() => {
    console.log('🔍 LOGIN PAGE: Checking if already logged in...')
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        console.log('✅ LOGIN PAGE: User already logged in:', user.email, '- redirecting to dashboard')
        router.push('/dashboard')
      } else {
        console.log('ℹ️ LOGIN PAGE: No existing session')
      }
    })
  }, [supabase, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('🔐 LOGIN: Starting login for:', email)

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('🔐 LOGIN: Response received', { error: error?.message, user: data?.user?.email, session: !!data?.session })

    if (error) {
      console.error('❌ LOGIN: Error -', error.message)
      setError(error.message)
      setLoading(false)
    } else {
      console.log('✅ LOGIN: Success! Redirecting to dashboard...')
      console.log('📝 LOGIN: Session info:', {
        access_token: data.session?.access_token?.substring(0, 20) + '...',
        refresh_token: data.session?.refresh_token?.substring(0, 20) + '...',
        expires_at: data.session?.expires_at
      })
      window.location.href = '/dashboard'
    }
  }

  const handleSignup = async () => {
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    console.log('📝 SIGNUP: Starting signup for:', email)

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    })

    console.log('📝 SIGNUP: Response received', { error: error?.message, user: data?.user?.email, session: !!data?.session })

    if (error) {
      console.error('❌ SIGNUP: Error -', error.message)
      setError(error.message)
      setLoading(false)
    } else {
      console.log('✅ SIGNUP: Success! Redirecting to dashboard...')
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-blue-600">
          Clarithm
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Transform data into insights
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
            <button
              type="button"
              onClick={handleSignup}
              disabled={loading}
              className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Loading...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

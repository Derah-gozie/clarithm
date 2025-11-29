'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestAuthPage() {
  const [info, setInfo] = useState<any>({})

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()

      const sessionResult = await supabase.auth.getSession()
      const userResult = await supabase.auth.getUser()

      // Check localStorage
      const localStorageKeys = Object.keys(localStorage).filter(k =>
        k.includes('supabase') || k.includes('auth')
      )

      const localStorageData: any = {}
      localStorageKeys.forEach(key => {
        localStorageData[key] = localStorage.getItem(key)
      })

      setInfo({
        session: sessionResult.data.session ? {
          access_token: sessionResult.data.session.access_token.substring(0, 20) + '...',
          user_email: sessionResult.data.session.user.email
        } : null,
        sessionError: sessionResult.error?.message,
        user: userResult.data.user ? userResult.data.user.email : null,
        userError: userResult.error?.message,
        localStorage: localStorageData,
        cookies: document.cookie
      })
    }

    checkAuth()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Diagnostic</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
        {JSON.stringify(info, null, 2)}
      </pre>
    </div>
  )
}

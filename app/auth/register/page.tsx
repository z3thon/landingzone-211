'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GlassCard from '@/components/GlassCard'

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login since Discord handles both sign-in and sign-up
    router.replace('/auth/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md">
        <div className="text-center py-8">
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </GlassCard>
    </div>
  )
}

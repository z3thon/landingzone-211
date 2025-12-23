'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import GlassCard from '@/components/GlassCard'

export default function VerifyPage() {
  const [status, setStatus] = useState<'checking' | 'verified' | 'error'>('checking')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const checkVerification = async () => {
      const token = searchParams.get('token')
      const type = searchParams.get('type')

      if (token && type === 'signup') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup',
          })

          if (error) {
            setStatus('error')
          } else {
            setStatus('verified')
            setTimeout(() => {
              router.push('/dashboard')
            }, 2000)
          }
        } catch (error) {
          setStatus('error')
        }
      } else {
        // Check if user is already verified
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email_confirmed_at) {
          setStatus('verified')
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          setStatus('checking')
        }
      }
    }

    checkVerification()
  }, [searchParams, router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md text-center">
        {status === 'checking' && (
          <>
            <h1 className="text-3xl font-bold mb-4">Verifying Email</h1>
            <p className="text-gray-600">Please check your email and click the verification link.</p>
          </>
        )}
        
        {status === 'verified' && (
          <>
            <h1 className="text-3xl font-bold mb-4 text-green-600">Email Verified!</h1>
            <p className="text-gray-600">Your account has been verified. Redirecting...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <h1 className="text-3xl font-bold mb-4 text-red-600">Verification Failed</h1>
            <p className="text-gray-600 mb-4">
              There was an error verifying your email. Please try again or contact support.
            </p>
            <a href="/auth/login" className="text-blue-600 hover:underline">
              Go to Login
            </a>
          </>
        )}
      </GlassCard>
    </div>
  )
}



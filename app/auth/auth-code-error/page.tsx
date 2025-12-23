'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'

function AuthCodeErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const description = searchParams.get('description')
  const message = searchParams.get('message')

  const getErrorMessage = () => {
    if (message) return message
    if (description) return description
    if (error === 'no_code') return 'No authorization code was received from Discord.'
    if (error === 'config') return 'Discord OAuth not configured. Please check your environment variables.'
    if (error === 'token_exchange') return 'Failed to exchange authorization code for access token.'
    if (error === 'user_fetch') return 'Failed to fetch user information from Discord.'
    if (error === 'invalid_state') return 'Invalid OAuth state. This may be a security issue or expired session.'
    if (error === 'db_error') return message || 'Database error occurred while storing your information.'
    if (error === 'exception') return message || 'An unexpected error occurred during authentication.'
    return `Authentication error: ${error || 'Unknown error'}`
  }

  const errorMessage = getErrorMessage()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-4 text-red-600">Authentication Error</h1>
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold mb-2">Error Details:</p>
            <p className="text-red-700 text-sm">{errorMessage}</p>
          </div>
        )}

        <p className="text-gray-600 mb-6">
          There was an error during authentication. This could happen if:
        </p>
        <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
          <li>The authorization code expired or was invalid</li>
          <li>The redirect URI didn't match exactly</li>
          <li>There was a network error</li>
          <li>Discord OAuth configuration is incorrect</li>
        </ul>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm font-semibold mb-2">Troubleshooting Steps:</p>
          <ol className="text-blue-700 text-sm space-y-2 list-decimal list-inside">
            <li><strong>Verify Discord Redirect URI:</strong>
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="underline">Discord Developer Portal</a></li>
                <li>Select your application → OAuth2</li>
                <li>Ensure <code className="bg-blue-100 px-1 rounded">http://localhost:3000/auth/callback</code> is in the Redirects list</li>
                <li>For production, add your production URL as well</li>
              </ul>
            </li>
            <li><strong>Verify Environment Variables:</strong>
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>Check that <code className="bg-blue-100 px-1 rounded">DISCORD_CLIENT_ID</code> is set in your <code className="bg-blue-100 px-1 rounded">.env.local</code> file</li>
                <li>Check that <code className="bg-blue-100 px-1 rounded">DISCORD_CLIENT_SECRET</code> is set</li>
                <li>Check that <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_APP_URL</code> matches your current URL</li>
                <li>Restart your development server after changing environment variables</li>
              </ul>
            </li>
            <li><strong>Check Database Schema:</strong>
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>Ensure the <code className="bg-blue-100 px-1 rounded">profiles</code> table exists in Supabase</li>
                <li>Ensure the <code className="bg-blue-100 px-1 rounded">discord_users</code> table exists</li>
                <li>Verify foreign key constraints are set up correctly</li>
              </ul>
            </li>
            <li><strong>Check Server Logs:</strong>
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>Look at your terminal/console for detailed error messages</li>
                <li>Error details will help identify the specific issue</li>
              </ul>
            </li>
          </ol>
        </div>

        <div className="flex gap-4">
          <GlassButton variant="primary" href="/auth/login">
            Try Again
          </GlassButton>
          <GlassButton variant="outline" href="/">
            Go Home
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  )
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-4">Loading...</h1>
        </GlassCard>
      </div>
    }>
      <AuthCodeErrorContent />
    </Suspense>
  )
}

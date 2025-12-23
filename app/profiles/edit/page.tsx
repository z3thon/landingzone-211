'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    email: '',
    phone: '',
    street_1: '',
    street_2: '',
    city: '',
    state_region: '',
    postal_code: '',
    country: '',
    available: true,
    available_from: '',
    available_to: '',
    currency: 'USD',
  })

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        return
      }

      const data = profileData as {
        name: string | null;
        bio: string | null;
        email: string | null;
        phone: string | null;
        street_1: string | null;
        street_2: string | null;
        city: string | null;
        state_region: string | null;
        postal_code: string | null;
        country: string | null;
        [key: string]: any;
      } | null;

      if (!data) return;

      setProfile(data)
      setFormData({
        name: data.name || '',
        bio: data.bio || '',
        email: data.email || '',
        phone: data.phone || '',
        street_1: data.street_1 || '',
        street_2: data.street_2 || '',
        city: data.city || '',
        state_region: data.state_region || '',
        postal_code: data.postal_code || '',
        country: data.country || '',
        available: data.available ?? true,
        available_from: data.available_from || '',
        available_to: data.available_to || '',
        currency: data.currency || 'USD',
      })
      setLoading(false)
    }

    loadProfile()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const updateQuery = supabase
        .from('profiles')
        // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
        .update(formData)
        .eq('id', user.id)
      const { error } = await updateQuery

      if (error) throw error

      router.push(`/profiles/${user.id}`)
    } catch (error: any) {
      console.error('Error saving profile:', error)
      alert('Error saving profile: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <GlassCard>
          <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Basic Information</h2>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Address</h2>
              
              <div>
                <label htmlFor="street_1" className="block text-sm font-medium mb-2">
                  Street Address
                </label>
                <input
                  id="street_1"
                  type="text"
                  value={formData.street_1}
                  onChange={(e) => setFormData({ ...formData, street_1: e.target.value })}
                  className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="street_2" className="block text-sm font-medium mb-2">
                  Street Address 2
                </label>
                <input
                  id="street_2"
                  type="text"
                  value={formData.street_2}
                  onChange={(e) => setFormData({ ...formData, street_2: e.target.value })}
                  className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium mb-2">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="state_region" className="block text-sm font-medium mb-2">
                    State/Region
                  </label>
                  <input
                    id="state_region"
                    type="text"
                    value={formData.state_region}
                    onChange={(e) => setFormData({ ...formData, state_region: e.target.value })}
                    className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="postal_code" className="block text-sm font-medium mb-2">
                    Postal Code
                  </label>
                  <input
                    id="postal_code"
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium mb-2">
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                />
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Availability</h2>
              
              <div className="flex items-center gap-2">
                <input
                  id="available"
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="available" className="text-sm font-medium">
                  Available for work
                </label>
              </div>

              {formData.available && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="available_from" className="block text-sm font-medium mb-2">
                      Available From
                    </label>
                    <input
                      id="available_from"
                      type="time"
                      value={formData.available_from}
                      onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                      className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="available_to" className="block text-sm font-medium mb-2">
                      Available To
                    </label>
                    <input
                      id="available_to"
                      type="time"
                      value={formData.available_to}
                      onChange={(e) => setFormData({ ...formData, available_to: e.target.value })}
                      className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium mb-2">
                Currency Preference
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>

            <div className="flex gap-4">
              <GlassButton
                type="submit"
                variant="primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </GlassButton>
              <GlassButton
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}



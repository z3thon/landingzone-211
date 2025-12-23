import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import GlassCard from '@/components/GlassCard'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient()
  
  // Get profile
  const { data: profileData, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !profileData) {
    notFound()
  }

  const profile = profileData as {
    id: string;
    name: string;
    avatar_url: string | null;
    bio: string | null;
    email: string | null;
    city: string | null;
    country: string | null;
    available: boolean;
    [key: string]: any;
  }

  // Get profile skills
  const { data: skills } = await supabase
    .from('skills')
    .select(`
      *,
      skill_type:skill_types(*)
    `)
    .eq('profile_id', id)

  // Get certifications
  const { data: certifications } = await supabase
    .from('certifications')
    .select(`
      *,
      certification_type:certification_types(*)
    `)
    .eq('profile_id', id)

  // Get rates
  const { data: rates } = await supabase
    .from('rates')
    .select(`
      *,
      rate_type:rate_types(*)
    `)
    .eq('profile_id', id)
    .eq('status', 'active')

  // Get reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_profile_id_fkey(id, name, avatar_url)
    `)
    .eq('reviewee_profile_id', id)
    .eq('is_private', false)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get endorsements
  const { data: endorsements } = await supabase
    .from('endorsements')
    .select(`
      *,
      endorser:profiles!endorsements_endorser_profile_id_fkey(id, name, avatar_url),
      skill:skills(
        id,
        skill_type:skill_types(*)
      )
    `)
    .eq('endorsee_profile_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen p-8 pt-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Profile Header */}
        <GlassCard>
          <div className="flex items-start gap-6">
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{profile.name}</h1>
              {profile.bio && (
                <p className="text-gray-600 mb-4">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {profile.email && <span>📧 {profile.email}</span>}
                {profile.city && profile.country && (
                  <span>📍 {profile.city}, {profile.country}</span>
                )}
                {profile.available && <span>✅ Available</span>}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: any) => (
                <span
                  key={skill.id}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {skill.skill_type?.name}
                  {skill.endorsement_count > 0 && (
                    <span className="ml-2">⭐ {skill.endorsement_count}</span>
                  )}
                </span>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-4">Certifications</h2>
            <div className="space-y-3">
              {certifications.map((cert: any) => (
                <div key={cert.id} className="border-b border-gray-200 pb-3">
                  <h3 className="font-semibold">{cert.title}</h3>
                  <p className="text-sm text-gray-600">
                    {cert.certification_type?.name}
                    {cert.effective_date && (
                      <span className="ml-2">
                        ({new Date(cert.effective_date).getFullYear()})
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Rates */}
        {rates && rates.length > 0 && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-4">Rates</h2>
            <div className="space-y-3">
              {rates.map((rate: any) => (
                <div key={rate.id} className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">{rate.rate_type?.name}</span>
                    {rate.is_default && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                    {rate.is_coaching && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Coaching
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-bold">
                    {rate.currency} {rate.rate_per_hour.toFixed(2)}/hr
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-4">Reviews</h2>
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div key={review.id} className="border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    {review.reviewer?.avatar_url && (
                      <img
                        src={review.reviewer.avatar_url}
                        alt={review.reviewer.name}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{review.reviewer?.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700">{review.review_text}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Endorsements */}
        {endorsements && endorsements.length > 0 && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-4">Endorsements</h2>
            <div className="space-y-3">
              {endorsements.map((endorsement: any) => (
                <div key={endorsement.id} className="flex items-center gap-3">
                  {endorsement.endorser?.avatar_url && (
                    <img
                      src={endorsement.endorser.avatar_url}
                      alt={endorsement.endorser.name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm">
                    <span className="font-semibold">{endorsement.endorser?.name}</span>
                    {' '}endorsed{' '}
                    <span className="font-semibold">
                      {endorsement.skill?.skill_type?.name}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  )
}



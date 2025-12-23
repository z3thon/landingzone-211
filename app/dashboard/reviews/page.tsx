'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

interface Tab {
  id: string;
  label: string;
}

const tabs: Tab[] = [
  { id: 'received', label: 'Received' },
  { id: 'given', label: 'Given' },
  { id: 'endorsements', label: 'Endorsements' },
];

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState('received');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'received' 
        ? '/api/reviews/received'
        : activeTab === 'given'
        ? '/api/reviews/given'
        : '/api/endorsements';
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-4xl font-bold mb-2">Reviews & Feedback</h1>
        <p className="text-gray-600">View and manage your reviews and endorsements</p>
      </div>

      <GlassCard className="p-0">
        {/* Tabs */}
        <div className="flex border-b border-white/20 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              {activeTab === 'received' && <ReceivedTab data={data} />}
              {activeTab === 'given' && <GivenTab data={data} />}
              {activeTab === 'endorsements' && <EndorsementsTab data={data} />}
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function ReceivedTab({ data }: { data: any }) {
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) {
      setReviews(data.reviews || []);
      setStatistics(data.statistics);
      setProjects(data.projects || []);
    }
  }, [data]);

  useEffect(() => {
    fetchFilteredReviews();
  }, [filter, selectedProject, startDate, endDate]);

  const fetchFilteredReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);
      if (selectedProject) params.append('project_id', selectedProject);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`/api/reviews/received?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setReviews(result.reviews || []);
        setStatistics(result.statistics);
        setProjects(result.projects || []);
      }
    } catch (error) {
      console.error('Error fetching filtered reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard>
            <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
            <p className="text-2xl font-bold">{statistics.total}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm text-gray-600 mb-1">Public</p>
            <p className="text-2xl font-bold">{statistics.public}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm text-gray-600 mb-1">Private</p>
            <p className="text-2xl font-bold">{statistics.private}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm text-gray-600 mb-1">Anonymous</p>
            <p className="text-2xl font-bold">{statistics.anonymous}</p>
          </GlassCard>
        </div>
      )}

      {/* Filters */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Visibility</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="glass-input-enhanced px-4 py-2 rounded-lg"
              >
                <option value="all">All</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            {projects.length > 0 && (
              <div>
                <label className="block text-sm font-semibold mb-2">Project</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="glass-input-enhanced px-4 py-2 rounded-lg"
                >
                  <option value="">All Projects</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="glass-input-enhanced px-4 py-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="glass-input-enhanced px-4 py-2 rounded-lg"
              />
            </div>
            {(startDate || endDate || selectedProject) && (
              <div className="flex items-end">
                <GlassButton
                  variant="outline"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setSelectedProject('');
                  }}
                >
                  Clear Filters
                </GlassButton>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <GlassCard>
          <div className="text-center py-8">
            <p className="text-gray-600">No reviews found.</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review: any) => (
            <GlassCard key={review.id}>
              <div className="flex items-start gap-4">
                {review.reviewer?.avatar_url && !review.is_anonymous && (
                  <img
                    src={review.reviewer.avatar_url}
                    alt={review.reviewer.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {review.is_private && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Private
                      </span>
                    )}
                    {review.is_anonymous && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        Anonymous
                      </span>
                    )}
                    {review.project_approval?.project && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {review.project_approval.project.name}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">{review.review_text}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      From: {review.is_anonymous ? 'Anonymous' : review.reviewer?.name || 'Unknown'}
                    </span>
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

function GivenTab({ data }: { data: any }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>(data || []);

  useEffect(() => {
    setReviews(data || []);
  }, [data]);

  const handleCreateReview = async (formData: any) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews([newReview, ...reviews]);
        setShowCreateModal(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create review');
      }
    } catch (error) {
      console.error('Error creating review:', error);
      alert('Failed to create review');
    }
  };

  const handleUpdateReview = async (id: string, formData: any) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updated = await response.json();
        setReviews(reviews.map((r) => (r.id === id ? updated : r)));
        setEditingReview(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update review');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Failed to update review');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReviews(reviews.filter((r) => r.id !== id));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <GlassButton variant="primary" onClick={() => setShowCreateModal(true)}>
          Create Review
        </GlassButton>
      </div>

      {reviews.length === 0 ? (
        <GlassCard>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't given any reviews yet.</p>
            <GlassButton variant="primary" onClick={() => setShowCreateModal(true)}>
              Create Your First Review
            </GlassButton>
          </div>
        </GlassCard>
      ) : (
        reviews.map((review: any) => (
          <GlassCard key={review.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {review.is_private && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Private
                    </span>
                  )}
                  {review.is_anonymous && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      Anonymous
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-2">{review.review_text}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>To: {review.reviewee?.name || 'Unknown'}</span>
                  <span>{new Date(review.created_at).toLocaleDateString()}</span>
                  {review.project_approval?.project && (
                    <span>Project: {review.project_approval.project.name}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <GlassButton
                  variant="outline"
                  onClick={() => setEditingReview(review)}
                  className="text-sm py-2 px-4"
                >
                  Edit
                </GlassButton>
                <GlassButton
                  variant="outline"
                  onClick={() => handleDeleteReview(review.id)}
                  className="text-sm py-2 px-4 text-red-600 hover:text-red-700"
                >
                  Delete
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        ))
      )}

      {showCreateModal && (
        <ReviewModal
          onSave={handleCreateReview}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingReview && (
        <ReviewModal
          review={editingReview}
          onSave={(formData) => handleUpdateReview(editingReview.id, formData)}
          onClose={() => setEditingReview(null)}
        />
      )}
    </div>
  );
}

function ReviewModal({
  review,
  onSave,
  onClose,
}: {
  review?: any;
  onSave: (formData: any) => void;
  onClose: () => void;
}) {
  const [revieweeSearch, setRevieweeSearch] = useState(review?.reviewee?.name || '');
  const [revieweeId, setRevieweeId] = useState(review?.reviewee_profile_id || '');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [reviewText, setReviewText] = useState(review?.review_text || '');
  const [projectApprovalId, setProjectApprovalId] = useState(review?.project_approval_id || '');
  const [isPrivate, setIsPrivate] = useState(review?.is_private || false);
  const [isAnonymous, setIsAnonymous] = useState(review?.is_anonymous || false);
  const [projectApprovals, setProjectApprovals] = useState<any[]>([]);

  useEffect(() => {
    if (revieweeSearch.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetch(`/api/profiles/search?search=${encodeURIComponent(revieweeSearch)}`)
          .then((res) => res.json())
          .then((data) => setProfiles(data))
          .catch(console.error);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setProfiles([]);
    }
  }, [revieweeSearch]);

  useEffect(() => {
    if (revieweeId && !review) {
      fetch('/api/project-approvals?profile_id=' + revieweeId)
        .then((res) => res.json())
        .then((data) => setProjectApprovals(data || []))
        .catch(console.error);
    }
  }, [revieweeId, review]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!revieweeId || !reviewText.trim()) {
      alert('Please select a reviewee and enter review text');
      return;
    }

    onSave({
      reviewee_profile_id: revieweeId,
      review_text: reviewText,
      project_approval_id: projectApprovalId || null,
      is_private: isPrivate,
      is_anonymous: isAnonymous,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">{review ? 'Edit Review' : 'Create Review'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!review && (
            <div>
              <label className="block text-sm font-semibold mb-2">Review For *</label>
              <input
                type="text"
                value={revieweeSearch}
                onChange={(e) => setRevieweeSearch(e.target.value)}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                placeholder="Search for person..."
              />
              {profiles.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => {
                        setRevieweeId(profile.id);
                        setRevieweeSearch(profile.name);
                        setProfiles([]);
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-center gap-2 ${
                        revieweeId === profile.id
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {profile.avatar_url && (
                        <img src={profile.avatar_url} alt={profile.name} className="w-8 h-8 rounded-full" />
                      )}
                      <span>{profile.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {review && (
            <div>
              <label className="block text-sm font-semibold mb-2">Review For</label>
              <p className="text-gray-700">{review.reviewee?.name || 'Unknown'}</p>
            </div>
          )}

          {!review && projectApprovals.length > 0 && (
            <div>
              <label className="block text-sm font-semibold mb-2">Associated Project (Optional)</label>
              <select
                value={projectApprovalId}
                onChange={(e) => setProjectApprovalId(e.target.value)}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              >
                <option value="">None</option>
                {projectApprovals.map((pa: any) => (
                  <option key={pa.id} value={pa.id}>
                    {pa.project?.name || 'Unknown Project'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Review Text *</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              placeholder="Write your review..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="font-semibold">Private Review</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="font-semibold">Anonymous Review</span>
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <GlassButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={!revieweeId || !reviewText.trim()}>
              {review ? 'Update' : 'Create'} Review
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function EndorsementsTab({ data }: { data: any }) {
  const [sortBy, setSortBy] = useState<'date' | 'skill' | 'endorser'>('date');
  const [endorsements, setEndorsements] = useState<any[]>(data || []);

  useEffect(() => {
    setEndorsements(data || []);
  }, [data]);

  // Group endorsements by skill
  const groupedBySkill = endorsements.reduce((acc: any, endorsement: any) => {
    const skillId = endorsement.skill?.id || 'unknown';
    const skillName = endorsement.skill?.name || 'Unknown Skill';
    
    if (!acc[skillId]) {
      acc[skillId] = {
        skill: { id: skillId, name: skillName },
        endorsements: [],
      };
    }
    
    acc[skillId].endorsements.push(endorsement);
    return acc;
  }, {});

  const groupedArray = Object.values(groupedBySkill).map((group: any) => ({
    ...group,
    count: group.endorsements.length,
  }));

  // Sort grouped endorsements
  const sortedGroups = [...groupedArray].sort((a: any, b: any) => {
    if (sortBy === 'skill') {
      return a.skill.name.localeCompare(b.skill.name);
    } else if (sortBy === 'endorser') {
      const aEndorser = a.endorsements[0]?.endorser?.name || '';
      const bEndorser = b.endorsements[0]?.endorser?.name || '';
      return aEndorser.localeCompare(bEndorser);
    } else {
      // Sort by date (most recent first)
      const aDate = new Date(a.endorsements[0]?.created_at || 0).getTime();
      const bDate = new Date(b.endorsements[0]?.created_at || 0).getTime();
      return bDate - aDate;
    }
  });

  // Sort endorsements within each group
  sortedGroups.forEach((group: any) => {
    group.endorsements.sort((a: any, b: any) => {
      if (sortBy === 'endorser') {
        return (a.endorser?.name || '').localeCompare(b.endorser?.name || '');
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  });

  if (endorsements.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-8">
          <p className="text-gray-600">No endorsements received yet.</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold">Sort by:</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="glass-input-enhanced px-4 py-2 rounded-lg"
        >
          <option value="date">Date</option>
          <option value="skill">Skill Name</option>
          <option value="endorser">Endorser Name</option>
        </select>
      </div>

      {/* Grouped Endorsements */}
      <div className="space-y-6">
        {sortedGroups.map((group: any) => (
          <GlassCard key={group.skill.id}>
            <div className="mb-4 pb-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{group.skill.name}</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {group.count} endorsement{group.count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {group.endorsements.map((endorsement: any) => (
                <div
                  key={endorsement.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-white/10"
                >
                  {endorsement.endorser?.avatar_url && (
                    <img
                      src={endorsement.endorser.avatar_url}
                      alt={endorsement.endorser.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">
                      {endorsement.endorser?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(endorsement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

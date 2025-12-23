'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'skills',
    label: 'Skills',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: 'certifications',
    label: 'Certifications',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    id: 'rates',
    label: 'Rates',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'employment',
    label: 'Employment',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profiles/me');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <GlassCard>
          <div className="text-center py-12">
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-4xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your professional profile and information</p>
      </div>

      {/* Tabs */}
      <GlassCard className="p-0">
        <div className="flex border-b border-white/20 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab profile={profile} />}
          {activeTab === 'skills' && <SkillsTab />}
          {activeTab === 'certifications' && <CertificationsTab />}
          {activeTab === 'rates' && <RatesTab />}
          {activeTab === 'employment' && <EmploymentTab />}
        </div>
      </GlassCard>
    </div>
  );
}

function OverviewTab({ profile }: { profile: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Name</label>
            <input
              type="text"
              defaultValue={profile?.name || ''}
              className="glass-input-enhanced w-full px-4 py-3 rounded-lg"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              defaultValue={profile?.email || ''}
              className="glass-input-enhanced w-full px-4 py-3 rounded-lg"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Phone</label>
            <input
              type="tel"
              defaultValue={profile?.phone || ''}
              className="glass-input-enhanced w-full px-4 py-3 rounded-lg"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Avatar URL</label>
            <input
              type="url"
              defaultValue={profile?.avatar_url || ''}
              className="glass-input-enhanced w-full px-4 py-3 rounded-lg"
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-semibold mb-2">Bio</label>
          <textarea
            defaultValue={profile?.bio || ''}
            rows={4}
            className="glass-input-enhanced w-full px-4 py-3 rounded-lg"
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Address</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2">Street Address</label>
            <input
              type="text"
              defaultValue={profile?.street_1 || ''}
              className="glass-input-enhanced w-full px-4 py-3 rounded-lg"
              placeholder="123 Main St"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">City</label>
            <input
              type="text"
              defaultValue={profile?.city || ''}
              className="glass-input-enhanced w-full px-4 py-3 rounded-lg"
              placeholder="City"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">State/Region</label>
            <input
              type="text"
              defaultValue={profile?.state_region || ''}
              className="glass-input-enhanced w-full px-4 py-3 rounded-lg"
              placeholder="State"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Postal Code</label>
            <input
              type="text"
              defaultValue={profile?.postal_code || ''}
              className="glass-input-enhanced w-full px-4 py-3 rounded-lg"
              placeholder="12345"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Country</label>
            <input
              type="text"
              defaultValue={profile?.country || ''}
              className="glass-input-enhanced w-full px-4 py-3 rounded-lg"
              placeholder="Country"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Availability</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked={profile?.available ?? true}
                className="w-5 h-5 rounded"
              />
              <span className="font-semibold">Available for work</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Available From</label>
            <input
              type="time"
              defaultValue={profile?.available_from || ''}
              className="glass-input-enhanced w-full px-4 py-3 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Available To</label>
            <input
              type="time"
              defaultValue={profile?.available_to || ''}
              className="glass-input-enhanced w-full px-4 py-3 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <GlassButton variant="primary">Save Changes</GlassButton>
      </div>
    </div>
  );
}

function SkillsTab() {
  const [skills, setSkills] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any>(null);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [skillTypes, setSkillTypes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSkills();
    fetchSkillTypes();
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile/skills');
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills || []);
        setCommunities(data.communities || []);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillTypes = async () => {
    try {
      const response = await fetch(`/api/skill-types?search=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSkillTypes(data);
      }
    } catch (error) {
      console.error('Error fetching skill types:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSkillTypes();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleAddSkill = async (skillTypeId: string, description: string) => {
    try {
      const response = await fetch('/api/profile/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_type_id: skillTypeId, description }),
      });

      if (response.ok) {
        await fetchSkills();
        setShowAddModal(false);
        setSearchQuery('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add skill');
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('Failed to add skill');
    }
  };

  const handleUpdateSkill = async (skillId: string, description: string) => {
    try {
      const response = await fetch(`/api/profile/skills/${skillId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (response.ok) {
        await fetchSkills();
        setEditingSkill(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update skill');
      }
    } catch (error) {
      console.error('Error updating skill:', error);
      alert('Failed to update skill');
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    try {
      const response = await fetch(`/api/profile/skills/${skillId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSkills();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete skill');
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
      alert('Failed to delete skill');
    }
  };

  const handleToggleVisibility = async (skillId: string, communityId: string, visible: boolean) => {
    try {
      const response = await fetch(`/api/profile/skills/${skillId}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ community_id: communityId, visible }),
      });

      if (response.ok) {
        await fetchSkills();
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading skills...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Skills</h2>
        <GlassButton variant="primary" onClick={() => setShowAddModal(true)}>
          Add Skill
        </GlassButton>
      </div>

      {skills.length === 0 ? (
        <GlassCard>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You haven't added any skills yet.</p>
            <GlassButton variant="primary" onClick={() => setShowAddModal(true)}>
              Add Your First Skill
            </GlassButton>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {skills.map((skill: any) => (
            <GlassCard key={skill.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{skill.skill_type?.name || 'Unknown Skill'}</h3>
                    {skill.skill_type?.is_language && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Language
                      </span>
                    )}
                    {skill.endorsement_count > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {skill.endorsement_count} endorsement{skill.endorsement_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {editingSkill?.id === skill.id ? (
                    <EditSkillForm
                      skill={skill}
                      onSave={(description) => {
                        handleUpdateSkill(skill.id, description);
                      }}
                      onCancel={() => setEditingSkill(null)}
                    />
                  ) : (
                    <>
                      {skill.description && (
                        <p className="text-gray-600 mb-3">{skill.description}</p>
                      )}
                      <div className="flex gap-2">
                        <GlassButton
                          variant="outline"
                          onClick={() => setEditingSkill({ id: skill.id, description: skill.description })}
                        >
                          Edit Description
                        </GlassButton>
                        <GlassButton
                          variant="outline"
                          onClick={() => setExpandedSkill(expandedSkill === skill.id ? null : skill.id)}
                        >
                          {expandedSkill === skill.id ? 'Hide' : 'Manage'} Visibility
                        </GlassButton>
                        <GlassButton
                          variant="outline"
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </GlassButton>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {expandedSkill === skill.id && communities.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <h4 className="font-semibold mb-3">Community Visibility</h4>
                  <div className="space-y-2">
                    {communities.map((cm: any) => {
                      const visibility = skill.visibility?.find(
                        (v: any) => v.community_id === cm.community_id
                      );
                      const isVisible = visibility?.visible !== false;
                      return (
                        <div key={cm.community_id} className="flex items-center justify-between">
                          <span className="text-gray-700">
                            {cm.community?.name || 'Unknown Community'}
                          </span>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={(e) =>
                                handleToggleVisibility(skill.id, cm.community_id, e.target.checked)
                              }
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-gray-600">
                              {isVisible ? 'Visible' : 'Hidden'}
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddSkillModal
          skillTypes={skillTypes}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAdd={handleAddSkill}
          onClose={() => {
            setShowAddModal(false);
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
}

function EditSkillForm({
  skill,
  onSave,
  onCancel,
}: {
  skill: any;
  onSave: (description: string) => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState(skill.description || '');

  return (
    <div className="space-y-2">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
        placeholder="Skill description (optional)"
        rows={3}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
          if (e.key === 'Enter' && e.ctrlKey) {
            onSave(description);
          }
        }}
      />
      <div className="flex gap-2">
        <GlassButton variant="primary" onClick={() => onSave(description)}>
          Save
        </GlassButton>
        <GlassButton variant="outline" onClick={onCancel}>
          Cancel
        </GlassButton>
      </div>
    </div>
  );
}

function AddSkillModal({
  skillTypes,
  searchQuery,
  onSearchChange,
  onAdd,
  onClose,
}: {
  skillTypes: any[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAdd: (skillTypeId: string, description: string) => void;
  onClose: () => void;
}) {
  const [selectedSkillType, setSelectedSkillType] = useState<string>('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkillType) {
      onAdd(selectedSkillType, description);
      setSelectedSkillType('');
      setDescription('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">Add Skill</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Search Skill</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              placeholder="Type to search skills..."
            />
          </div>

          {skillTypes.length > 0 && (
            <div>
              <label className="block text-sm font-semibold mb-2">Select Skill</label>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {skillTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedSkillType(type.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedSkillType === type.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{type.name}</span>
                      {type.is_language && (
                        <span className="text-xs text-blue-600">Language</span>
                      )}
                    </div>
                    {type.description && (
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              placeholder="Describe your proficiency level or experience..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <GlassButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={!selectedSkillType}>
              Add Skill
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function CertificationsTab() {
  const [certifications, setCertifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCert, setEditingCert] = useState<any>(null);
  const [certificationTypes, setCertificationTypes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCertifications();
    fetchCertificationTypes();
  }, []);

  const fetchCertifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile/certifications');
      if (response.ok) {
        const data = await response.json();
        setCertifications(data);
      }
    } catch (error) {
      console.error('Error fetching certifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificationTypes = async () => {
    try {
      const response = await fetch(`/api/certification-types?search=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setCertificationTypes(data);
      }
    } catch (error) {
      console.error('Error fetching certification types:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCertificationTypes();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleAddCertification = async (formData: any) => {
    try {
      const response = await fetch('/api/profile/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCertifications();
        setShowAddModal(false);
        setSearchQuery('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add certification');
      }
    } catch (error) {
      console.error('Error adding certification:', error);
      alert('Failed to add certification');
    }
  };

  const handleUpdateCertification = async (id: string, formData: any) => {
    try {
      const response = await fetch(`/api/profile/certifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCertifications();
        setEditingCert(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update certification');
      }
    } catch (error) {
      console.error('Error updating certification:', error);
      alert('Failed to update certification');
    }
  };

  const handleDeleteCertification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;

    try {
      const response = await fetch(`/api/profile/certifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCertifications();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete certification');
      }
    } catch (error) {
      console.error('Error deleting certification:', error);
      alert('Failed to delete certification');
    }
  };

  const handleFileUpload = async (certId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/profile/certifications/${certId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchCertifications();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading certifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Certifications</h2>
        <GlassButton variant="primary" onClick={() => setShowAddModal(true)}>
          Add Certification
        </GlassButton>
      </div>

      {certifications.length === 0 ? (
        <GlassCard>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You haven't added any certifications yet.</p>
            <GlassButton variant="primary" onClick={() => setShowAddModal(true)}>
              Add Your First Certification
            </GlassButton>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert: any) => (
            <GlassCard key={cert.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{cert.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      cert.status === 'active' ? 'bg-green-100 text-green-800' :
                      cert.status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {cert.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">
                    {cert.certification_type?.name || 'Unknown Type'}
                  </p>
                  {cert.effective_date && (
                    <p className="text-sm text-gray-500">
                      Effective: {new Date(cert.effective_date).toLocaleDateString()}
                      {cert.end_date && ` - ${new Date(cert.end_date).toLocaleDateString()}`}
                    </p>
                  )}
                  {cert.file_url && (
                    <a
                      href={cert.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                    >
                      View Certificate →
                    </a>
                  )}
                  {cert.url && (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                    >
                      View Certificate →
                    </a>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <GlassButton
                    variant="outline"
                    onClick={() => setEditingCert(cert)}
                  >
                    Edit
                  </GlassButton>
                  <GlassButton
                    variant="outline"
                    onClick={() => handleDeleteCertification(cert.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {showAddModal && (
        <CertificationModal
          certificationTypes={certificationTypes}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSave={handleAddCertification}
          onClose={() => {
            setShowAddModal(false);
            setSearchQuery('');
          }}
        />
      )}

      {editingCert && (
        <CertificationModal
          certificationTypes={certificationTypes}
          certification={editingCert}
          onSave={(formData) => handleUpdateCertification(editingCert.id, formData)}
          onClose={() => setEditingCert(null)}
        />
      )}
    </div>
  );
}

function CertificationModal({
  certificationTypes,
  certification,
  searchQuery = '',
  onSearchChange,
  onSave,
  onClose,
}: {
  certificationTypes: any[];
  certification?: any;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSave: (formData: any) => void;
  onClose: () => void;
}) {
  const [selectedType, setSelectedType] = useState(certification?.certification_type_id || '');
  const [title, setTitle] = useState(certification?.title || '');
  const [attachmentType, setAttachmentType] = useState(certification?.attachment_type || '');
  const [fileUrl, setFileUrl] = useState(certification?.file_url || '');
  const [url, setUrl] = useState(certification?.url || '');
  const [effectiveDate, setEffectiveDate] = useState(
    certification?.effective_date ? certification.effective_date.split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    certification?.end_date ? certification.end_date.split('T')[0] : ''
  );
  const [status, setStatus] = useState(certification?.status || 'active');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType || !title) {
      alert('Certification type and title are required');
      return;
    }

    if (attachmentType === 'file' && !file && !fileUrl) {
      alert('Please upload a file or provide a file URL');
      return;
    }

    if (attachmentType === 'url' && !url) {
      alert('Please provide a URL');
      return;
    }

    let finalFileUrl = fileUrl;

    // If editing and file is selected, upload first
    if (certification && file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/profile/certifications/${certification.id}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to upload file');
        }

        const data = await response.json();
        finalFileUrl = data.file_url;
      } catch (error: any) {
        alert(error.message || 'Failed to upload file');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSave({
      certification_type_id: selectedType,
      title,
      attachment_type: attachmentType || null,
      file_url: attachmentType === 'file' ? finalFileUrl : null,
      url: attachmentType === 'url' ? url : null,
      effective_date: effectiveDate || null,
      end_date: endDate || null,
      status,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">
            {certification ? 'Edit Certification' : 'Add Certification'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {onSearchChange && (
            <div>
              <label className="block text-sm font-semibold mb-2">Search Certification Type</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                placeholder="Type to search..."
              />
            </div>
          )}

          {certificationTypes.length > 0 && (
            <div>
              <label className="block text-sm font-semibold mb-2">Certification Type *</label>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {certificationTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedType === type.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <span className="font-medium">{type.name}</span>
                    {type.description && (
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              placeholder="Certification title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Attachment Type</label>
            <select
              value={attachmentType}
              onChange={(e) => setAttachmentType(e.target.value)}
              className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
            >
              <option value="">None</option>
              <option value="file">File Upload</option>
              <option value="url">External URL</option>
            </select>
          </div>

          {attachmentType === 'file' && (
            <div>
              <label className="block text-sm font-semibold mb-2">Upload File</label>
              {certification ? (
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              ) : (
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                  placeholder="File URL (will be set after upload)"
                  disabled
                />
              )}
              {certification && file && (
                <p className="text-sm text-gray-600 mt-1">
                  File will be uploaded when you save
                </p>
              )}
            </div>
          )}

          {attachmentType === 'url' && (
            <div>
              <label className="block text-sm font-semibold mb-2">Certificate URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                placeholder="https://..."
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Effective Date</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end">
            <GlassButton type="button" variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={uploading || !selectedType || !title}>
              {uploading ? 'Uploading...' : certification ? 'Update' : 'Add'} Certification
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function RatesTab() {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRate, setEditingRate] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [rateTypes, setRateTypes] = useState<any[]>([]);
  const [expandedRate, setExpandedRate] = useState<string | null>(null);

  useEffect(() => {
    fetchRates();
    fetchRateTypes();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile/rates');
      if (response.ok) {
        const data = await response.json();
        setRates(data);
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRateTypes = async () => {
    try {
      const response = await fetch('/api/rate-types');
      if (response.ok) {
        const data = await response.json();
        setRateTypes(data);
      }
    } catch (error) {
      console.error('Error fetching rate types:', error);
    }
  };

  const handleAddRate = async (formData: any) => {
    try {
      const response = await fetch('/api/profile/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchRates();
        setShowAddModal(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add rate');
      }
    } catch (error) {
      console.error('Error adding rate:', error);
      alert('Failed to add rate');
    }
  };

  const handleUpdateRate = async (id: string, formData: any) => {
    try {
      const response = await fetch(`/api/profile/rates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchRates();
        setEditingRate(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update rate');
      }
    } catch (error) {
      console.error('Error updating rate:', error);
      alert('Failed to update rate');
    }
  };

  const handleArchiveRate = async (id: string) => {
    if (!confirm('Are you sure you want to archive this rate?')) return;

    try {
      const response = await fetch(`/api/profile/rates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchRates();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to archive rate');
      }
    } catch (error) {
      console.error('Error archiving rate:', error);
      alert('Failed to archive rate');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/profile/rates/${id}/set-default`, {
        method: 'PUT',
      });

      if (response.ok) {
        await fetchRates();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to set default rate');
      }
    } catch (error) {
      console.error('Error setting default rate:', error);
      alert('Failed to set default rate');
    }
  };

  const handleSetCoaching = async (id: string) => {
    try {
      const response = await fetch(`/api/profile/rates/${id}/set-coaching`, {
        method: 'PUT',
      });

      if (response.ok) {
        await fetchRates();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to set coaching rate');
      }
    } catch (error) {
      console.error('Error setting coaching rate:', error);
      alert('Failed to set coaching rate');
    }
  };

  const filteredRates = rates.filter((rate: any) => {
    if (filter === 'all') return true;
    return rate.status === filter;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading rates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Rates</h2>
        <GlassButton variant="primary" onClick={() => setShowAddModal(true)}>
          Add Rate
        </GlassButton>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'active', 'inactive', 'archived'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === f
                ? 'bg-blue-50 text-blue-700 border-2 border-blue-500'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredRates.length === 0 ? (
        <GlassCard>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? "You haven't added any rates yet."
                : `No ${filter} rates found.`}
            </p>
            {filter === 'all' && (
              <GlassButton variant="primary" onClick={() => setShowAddModal(true)}>
                Add Your First Rate
              </GlassButton>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filteredRates.map((rate: any) => (
            <GlassCard key={rate.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">
                      {rate.rate_type?.name || 'Unknown Type'}
                    </h3>
                    {rate.is_default_rate && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Default
                      </span>
                    )}
                    {rate.is_coaching_rate && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        Coaching
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      rate.status === 'active' ? 'bg-green-100 text-green-800' :
                      rate.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {rate.status}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {rate.currency} {rate.rate_per_hour.toFixed(2)}/hour
                  </p>
                  {rate.start_date && (
                    <p className="text-sm text-gray-600">
                      {new Date(rate.start_date).toLocaleDateString()}
                      {rate.end_date ? ` - ${new Date(rate.end_date).toLocaleDateString()}` : ' - Ongoing'}
                    </p>
                  )}
                  {rate.memo && (
                    <p className="text-gray-600 mt-2">{rate.memo}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {!rate.is_default_rate && (
                    <GlassButton
                      variant="outline"
                      onClick={() => handleSetDefault(rate.id)}
                      className="text-sm py-2 px-4"
                    >
                      Set Default
                    </GlassButton>
                  )}
                  {!rate.is_coaching_rate && (
                    <GlassButton
                      variant="outline"
                      onClick={() => handleSetCoaching(rate.id)}
                      className="text-sm py-2 px-4"
                    >
                      Set Coaching
                    </GlassButton>
                  )}
                  <GlassButton
                    variant="outline"
                    onClick={() => setEditingRate(rate)}
                    className="text-sm py-2 px-4"
                  >
                    Edit
                  </GlassButton>
                  {rate.status !== 'archived' && (
                    <GlassButton
                      variant="outline"
                      onClick={() => handleArchiveRate(rate.id)}
                      className="text-sm py-2 px-4 text-red-600 hover:text-red-700"
                    >
                      Archive
                    </GlassButton>
                  )}
                  {rate.previous_rate_id && (
                    <GlassButton
                      variant="outline"
                      onClick={() => setExpandedRate(expandedRate === rate.id ? null : rate.id)}
                      className="text-sm py-2 px-4"
                    >
                      {expandedRate === rate.id ? 'Hide' : 'Show'} History
                    </GlassButton>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {showAddModal && (
        <RateModal
          rateTypes={rateTypes}
          onSave={handleAddRate}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingRate && (
        <RateModal
          rateTypes={rateTypes}
          rate={editingRate}
          onSave={(formData) => handleUpdateRate(editingRate.id, formData)}
          onClose={() => setEditingRate(null)}
        />
      )}
    </div>
  );
}

function RateModal({
  rateTypes,
  rate,
  onSave,
  onClose,
}: {
  rateTypes: any[];
  rate?: any;
  onSave: (formData: any) => void;
  onClose: () => void;
}) {
  const [selectedType, setSelectedType] = useState(rate?.rate_type_id || '');
  const [ratePerHour, setRatePerHour] = useState(rate?.rate_per_hour?.toString() || '');
  const [currency, setCurrency] = useState(rate?.currency || 'USD');
  const [startDate, setStartDate] = useState(
    rate?.start_date ? rate.start_date.split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    rate?.end_date ? rate.end_date.split('T')[0] : ''
  );
  const [memo, setMemo] = useState(rate?.memo || '');
  const [isDefault, setIsDefault] = useState(rate?.is_default_rate || false);
  const [isCoaching, setIsCoaching] = useState(rate?.is_coaching_rate || false);
  const [status, setStatus] = useState(rate?.status || 'active');
  const [mounted, setMounted] = useState(false);

  // Lock body scroll when modal is open and set mounted state for portal
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      setMounted(false);
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType || !ratePerHour || !startDate) {
      alert('Rate type, rate per hour, and start date are required');
      return;
    }

    onSave({
      rate_type_id: selectedType,
      rate_per_hour: parseFloat(ratePerHour),
      currency,
      start_date: startDate,
      end_date: endDate || null,
      memo: memo || null,
      is_default: isDefault,
      is_coaching: isCoaching,
      status: rate ? status : 'active',
    });
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">{rate ? 'Edit Rate' : 'Add Rate'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">Rate Type *</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              required
            >
              <option value="">Select rate type</option>
              {rateTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Rate Per Hour *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={ratePerHour}
                onChange={(e) => setRatePerHour(e.target.value)}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">Memo</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {rate && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          {!rate && (
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="font-semibold text-gray-900">Set as default rate</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isCoaching}
                  onChange={(e) => setIsCoaching(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="font-semibold text-gray-900">Set as coaching rate</span>
              </label>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <GlassButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary">
              {rate ? 'Update' : 'Add'} Rate
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}

function EmploymentTab() {
  const [employment, setEmployment] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEmployment, setShowAddEmployment] = useState(false);
  const [showAddIndustry, setShowAddIndustry] = useState(false);
  const [editingEmployment, setEditingEmployment] = useState<any>(null);
  const [editingIndustry, setEditingIndustry] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empResponse, indResponse] = await Promise.all([
        fetch('/api/profile/employment'),
        fetch('/api/profile/industries'),
      ]);

      if (empResponse.ok) {
        const empData = await empResponse.json();
        setEmployment(empData);
      }

      if (indResponse.ok) {
        const indData = await indResponse.json();
        setIndustries(indData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployment = async (formData: any) => {
    try {
      const response = await fetch('/api/profile/employment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchData();
        setShowAddEmployment(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add employment');
      }
    } catch (error) {
      console.error('Error adding employment:', error);
      alert('Failed to add employment');
    }
  };

  const handleUpdateEmployment = async (id: string, formData: any) => {
    try {
      const response = await fetch(`/api/profile/employment/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchData();
        setEditingEmployment(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update employment');
      }
    } catch (error) {
      console.error('Error updating employment:', error);
      alert('Failed to update employment');
    }
  };

  const handleDeleteEmployment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employment record?')) return;

    try {
      const response = await fetch(`/api/profile/employment/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete employment');
      }
    } catch (error) {
      console.error('Error deleting employment:', error);
      alert('Failed to delete employment');
    }
  };

  const handleAddIndustry = async (formData: any) => {
    try {
      const response = await fetch('/api/profile/industries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchData();
        setShowAddIndustry(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add industry');
      }
    } catch (error) {
      console.error('Error adding industry:', error);
      alert('Failed to add industry');
    }
  };

  const handleUpdateIndustry = async (id: string, formData: any) => {
    try {
      const response = await fetch(`/api/profile/industries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchData();
        setEditingIndustry(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update industry');
      }
    } catch (error) {
      console.error('Error updating industry:', error);
      alert('Failed to update industry');
    }
  };

  const handleDeleteIndustry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this industry?')) return;

    try {
      const response = await fetch(`/api/profile/industries/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete industry');
      }
    } catch (error) {
      console.error('Error deleting industry:', error);
      alert('Failed to delete industry');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Employment Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Employment History</h2>
          <GlassButton variant="primary" onClick={() => setShowAddEmployment(true)}>
            Add Employment
          </GlassButton>
        </div>

        {employment.length === 0 ? (
          <GlassCard>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No employment history yet.</p>
              <GlassButton variant="primary" onClick={() => setShowAddEmployment(true)}>
                Add Employment
              </GlassButton>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {employment.map((emp: any) => (
              <GlassCard key={emp.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{emp.company?.name || 'Unknown Company'}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        emp.status === 'active' ? 'bg-green-100 text-green-800' :
                        emp.status === 'past' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {emp.status}
                      </span>
                      {emp.is_company_admin && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Admin
                        </span>
                      )}
                      {emp.is_verified && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">
                      {new Date(emp.start_date).toLocaleDateString()}
                      {emp.end_date ? ` - ${new Date(emp.end_date).toLocaleDateString()}` : ' - Present'}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <GlassButton
                      variant="outline"
                      onClick={() => setEditingEmployment(emp)}
                      className="text-sm py-2 px-4"
                    >
                      Edit
                    </GlassButton>
                    <GlassButton
                      variant="outline"
                      onClick={() => handleDeleteEmployment(emp.id)}
                      className="text-sm py-2 px-4 text-red-600 hover:text-red-700"
                    >
                      Delete
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Industries Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Industries</h2>
          <GlassButton variant="primary" onClick={() => setShowAddIndustry(true)}>
            Add Industry
          </GlassButton>
        </div>

        {industries.length === 0 ? (
          <GlassCard>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No industries added yet.</p>
              <GlassButton variant="primary" onClick={() => setShowAddIndustry(true)}>
                Add Industry
              </GlassButton>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {industries.map((ind: any) => (
              <GlassCard key={ind.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {ind.industry_type?.name || 'Unknown Industry'}
                    </h3>
                    <p className="text-gray-600">
                      {ind.from_date ? new Date(ind.from_date).toLocaleDateString() : 'N/A'}
                      {ind.to_date ? ` - ${new Date(ind.to_date).toLocaleDateString()}` : ' - Present'}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <GlassButton
                      variant="outline"
                      onClick={() => setEditingIndustry(ind)}
                      className="text-sm py-2 px-4"
                    >
                      Edit
                    </GlassButton>
                    <GlassButton
                      variant="outline"
                      onClick={() => handleDeleteIndustry(ind.id)}
                      className="text-sm py-2 px-4 text-red-600 hover:text-red-700"
                    >
                      Delete
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {showAddEmployment && (
        <EmploymentModal
          onSave={handleAddEmployment}
          onClose={() => setShowAddEmployment(false)}
        />
      )}

      {editingEmployment && (
        <EmploymentModal
          employment={editingEmployment}
          onSave={(formData) => handleUpdateEmployment(editingEmployment.id, formData)}
          onClose={() => setEditingEmployment(null)}
        />
      )}

      {showAddIndustry && (
        <IndustryModal
          onSave={handleAddIndustry}
          onClose={() => setShowAddIndustry(false)}
        />
      )}

      {editingIndustry && (
        <IndustryModal
          industry={editingIndustry}
          onSave={(formData) => handleUpdateIndustry(editingIndustry.id, formData)}
          onClose={() => setEditingIndustry(null)}
        />
      )}
    </div>
  );
}

function EmploymentModal({
  employment,
  onSave,
  onClose,
}: {
  employment?: any;
  onSave: (formData: any) => void;
  onClose: () => void;
}) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState(employment?.company_id || '');
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [startDate, setStartDate] = useState(
    employment?.start_date ? employment.start_date.split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    employment?.end_date ? employment.end_date.split('T')[0] : ''
  );
  const [status, setStatus] = useState(employment?.status || 'active');
  const [isAdmin, setIsAdmin] = useState(employment?.is_company_admin || false);

  useEffect(() => {
    if (companySearch) {
      const timeoutId = setTimeout(() => {
        fetch(`/api/companies?search=${encodeURIComponent(companySearch)}`)
          .then((res) => res.json())
          .then((data) => setCompanies(data))
          .catch(console.error);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setCompanies([]);
    }
  }, [companySearch]);

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCompanyName }),
      });

      if (response.ok) {
        const company = await response.json();
        setSelectedCompanyId(company.id);
        setShowNewCompany(false);
        setNewCompanyName('');
        setCompanySearch(company.name);
      }
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Failed to create company');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompanyId || !startDate) {
      alert('Company and start date are required');
      return;
    }

    onSave({
      company_id: selectedCompanyId,
      start_date: startDate,
      end_date: endDate || null,
      status,
      is_company_admin: isAdmin,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">
            {employment ? 'Edit Employment' : 'Add Employment'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Company *</label>
            {!showNewCompany ? (
              <>
                <input
                  type="text"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                  placeholder="Search for company..."
                />
                {companies.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {companies.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => {
                          setSelectedCompanyId(company.id);
                          setCompanySearch(company.name);
                          setCompanies([]);
                        }}
                        className={`w-full text-left p-2 rounded-lg ${
                          selectedCompanyId === company.id
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {company.name}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowNewCompany(true)}
                  className="mt-2 text-blue-600 hover:underline text-sm"
                >
                  + Create new company
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="glass-input-enhanced flex-1 px-4 py-2 rounded-lg"
                  placeholder="Company name"
                />
                <GlassButton type="button" variant="primary" onClick={handleCreateCompany}>
                  Create
                </GlassButton>
                <GlassButton type="button" variant="outline" onClick={() => setShowNewCompany(false)}>
                  Cancel
                </GlassButton>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
            >
              <option value="active">Active</option>
              <option value="past">Past</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="font-semibold">Company Admin</span>
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <GlassButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary">
              {employment ? 'Update' : 'Add'} Employment
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function IndustryModal({
  industry,
  onSave,
  onClose,
}: {
  industry?: any;
  onSave: (formData: any) => void;
  onClose: () => void;
}) {
  const [industryTypes, setIndustryTypes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(industry?.industry_type_id || '');
  const [fromDate, setFromDate] = useState(
    industry?.from_date ? industry.from_date.split('T')[0] : ''
  );
  const [toDate, setToDate] = useState(
    industry?.to_date ? industry.to_date.split('T')[0] : ''
  );

  useEffect(() => {
    fetch(`/api/industry-types?search=${encodeURIComponent(searchQuery)}`)
      .then((res) => res.json())
      .then((data) => setIndustryTypes(data))
      .catch(console.error);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType || !fromDate) {
      alert('Industry type and from date are required');
      return;
    }

    onSave({
      industry_type_id: selectedType,
      from_date: fromDate,
      to_date: toDate || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">
            {industry ? 'Edit Industry' : 'Add Industry'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Search Industry Type</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              placeholder="Type to search..."
            />
          </div>

          {industryTypes.length > 0 && (
            <div>
              <label className="block text-sm font-semibold mb-2">Select Industry Type *</label>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {industryTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedType === type.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <span className="font-medium">{type.name}</span>
                    {type.abbreviation && (
                      <span className="text-sm text-gray-600 ml-2">({type.abbreviation})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">From Date *</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <GlassButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary">
              {industry ? 'Update' : 'Add'} Industry
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

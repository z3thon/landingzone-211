'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

interface Tab {
  id: string;
  label: string;
}

const tabs: Tab[] = [
  { id: 'explore', label: 'Explore Projects' },
  { id: 'communities', label: 'Communities' },
  { id: 'applications', label: 'My Applications' },
];

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('explore');
  const [projects, setProjects] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'explore') {
      fetchProjects();
      // Fetch communities for the filter if not already loaded
      if (communities.length === 0 && !communitiesLoading) {
        fetchCommunities();
      }
    } else if (activeTab === 'communities') {
      fetchCommunities();
    } else {
      fetchApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'explore') {
      fetchProjects();
    }
  }, [selectedCommunities]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCommunities.length > 0) {
        params.append('community_ids', selectedCommunities.join(','));
      }
      const url = `/api/projects/public${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunities = async () => {
    setCommunitiesLoading(true);
    try {
      const response = await fetch('/api/communities');
      if (response.ok) {
        const data = await response.json();
        setCommunities(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setCommunitiesLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/project-approvals');
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingApps = applications?.filter((app: any) => !app.approved) || [];
  const approvedApps = applications?.filter((app: any) => app.approved) || [];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-4xl font-bold mb-2">Explore & Apply</h1>
        <p className="text-gray-600">Discover active projects and track your applications</p>
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
              {activeTab === 'explore' && (
                <div>
                  {/* Community Filter */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3">Filter by Communities</h2>
                    {communitiesLoading ? (
                      <p className="text-gray-600">Loading communities...</p>
                    ) : communities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {communities.map((community: any) => (
                          <button
                            key={community.id}
                            onClick={() => {
                              setSelectedCommunities(prev =>
                                prev.includes(community.id)
                                  ? prev.filter(id => id !== community.id)
                                  : [...prev, community.id]
                              );
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              selectedCommunities.includes(community.id)
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {community.logo_url && (
                              <img
                                src={community.logo_url}
                                alt={community.name}
                                className="w-4 h-4 inline-block mr-2 rounded-full"
                              />
                            )}
                            {community.name}
                            {selectedCommunities.includes(community.id) && (
                              <span className="ml-2">✓</span>
                            )}
                          </button>
                        ))}
                        {selectedCommunities.length > 0 && (
                          <button
                            onClick={() => setSelectedCommunities([])}
                            className="px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600">No communities available.</p>
                    )}
                  </div>

                  {/* Projects Grid */}
                  {projects && projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {projects.map((project: any) => (
                        <Link key={project.id} href={`/projects/${project.id}`}>
                          <GlassCard className="h-full hover:scale-105 transition-transform cursor-pointer">
                            <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                            {project.description && (
                              <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              {project.organizer?.avatar_url && (
                                <img
                                  src={project.organizer.avatar_url}
                                  alt={project.organizer.name}
                                  className="w-6 h-6 rounded-full"
                                />
                              )}
                              <span>{project.organizer?.name}</span>
                              {project.community && (
                                <>
                                  <span>•</span>
                                  <span>{project.community.name}</span>
                                </>
                              )}
                            </div>
                          </GlassCard>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-600">
                        {selectedCommunities.length > 0
                          ? 'No projects found in the selected communities.'
                          : 'No active projects available at the moment.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'communities' && (
                <div>
                  {communitiesLoading ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600">Loading communities...</p>
                    </div>
                  ) : communities && communities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {communities.map((community: any) => (
                        <div
                          key={community.id}
                          onClick={() => {
                            setSelectedCommunities([community.id]);
                            setActiveTab('explore');
                          }}
                        >
                          <GlassCard className="h-full hover:scale-105 transition-transform cursor-pointer">
                            <div className="flex items-center gap-3 mb-3">
                              {community.logo_url && (
                                <img
                                  src={community.logo_url}
                                  alt={community.name}
                                  className="w-12 h-12 rounded-full"
                                />
                              )}
                              <h3 className="text-xl font-bold">{community.name}</h3>
                            </div>
                            {community.description && (
                              <p className="text-gray-600 mb-4 line-clamp-3">{community.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>View Projects</span>
                              <span>→</span>
                            </div>
                          </GlassCard>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-600">No communities available at the moment.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'applications' && (
                <div className="space-y-6">
                  {/* Pending Applications */}
                  {pendingApps.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Pending Applications</h2>
                      <div className="space-y-4">
                        {pendingApps.map((app: any) => (
                          <Link key={app.id} href={`/projects/${app.project?.id}`}>
                            <GlassCard className="hover:scale-[1.02] transition-transform cursor-pointer">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold mb-2">{app.project?.name || 'Unknown Project'}</h3>
                                  {app.project?.description && (
                                    <p className="text-gray-600 mb-3 line-clamp-2">{app.project.description}</p>
                                  )}
                                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                    <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                                    {app.project?.community && (
                                      <span>Community: {app.project.community.name}</span>
                                    )}
                                  </div>
                                </div>
                                <span className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 font-semibold ml-4">
                                  Pending
                                </span>
                              </div>
                            </GlassCard>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approved Applications */}
                  {approvedApps.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Approved Applications</h2>
                      <div className="space-y-4">
                        {approvedApps.map((app: any) => (
                          <Link key={app.id} href={`/projects/${app.project?.id}`}>
                            <GlassCard className="hover:scale-[1.02] transition-transform cursor-pointer">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold mb-2">{app.project?.name || 'Unknown Project'}</h3>
                                  {app.project?.description && (
                                    <p className="text-gray-600 mb-3 line-clamp-2">{app.project.description}</p>
                                  )}
                                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                    <span>Approved: {app.approved_at ? new Date(app.approved_at).toLocaleDateString() : 'N/A'}</span>
                                    {app.project?.community && (
                                      <span>Community: {app.project.community.name}</span>
                                    )}
                                  </div>
                                </div>
                                <span className="px-4 py-2 rounded-full bg-green-100 text-green-800 font-semibold ml-4">
                                  Approved
                                </span>
                              </div>
                            </GlassCard>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {applications?.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-600 mb-4">You haven't applied to any projects yet.</p>
                      <GlassButton variant="primary" onClick={() => setActiveTab('explore')}>
                        Explore Projects
                      </GlassButton>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

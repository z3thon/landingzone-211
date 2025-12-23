'use client';

import { useState, useEffect, useMemo } from 'react';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

interface BotHealth {
  healthy: boolean;
  issues: string[];
}

interface Community {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  discord_invite_url: string | null;
  discord_server_id: string | null;
  coach_channel_id?: string | null;
  coach_channel_name?: string | null;
  botHealth?: BotHealth | null;
}

interface Membership {
  id: string;
  community_id: string;
  role: string;
  joined_at: string;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
  hasLandingZone: boolean;
  communityId: string | null;
  communityName: string | null;
}

interface ServerItem extends DiscordGuild {
  type: 'community' | 'discord_only';
  community?: Community;
  membership?: Membership;
}

interface Tab {
  id: string;
  label: string;
}

const tabs: Tab[] = [
  { id: 'my-servers', label: 'My Servers' },
  { id: 'my-communities', label: 'My Communities' },
  { id: 'explore', label: 'Explore Communities' },
];

export default function CommunitiesPage() {
  const [activeTab, setActiveTab] = useState('my-servers');
  
  // Separate data state for each tab
  const [myServersData, setMyServersData] = useState<{
    communities: Community[];
    discordGuilds: DiscordGuild[];
  }>({ communities: [], discordGuilds: [] });
  
  const [myCommunitiesData, setMyCommunitiesData] = useState<{
    communities: Community[];
    discordGuilds: DiscordGuild[];
  }>({ communities: [], discordGuilds: [] });
  
  const [exploreData, setExploreData] = useState<{
    communities: Community[];
    memberships: Membership[];
  }>({ communities: [], memberships: [] });
  
  // Track which tabs have been loaded
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());
  
  // Loading state per tab
  const [loading, setLoading] = useState<Record<string, boolean>>({
    'my-servers': false,
    'my-communities': false,
    'explore': false,
  });
  
  const [joining, setJoining] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [discordConnected, setDiscordConnected] = useState(false);
  const [repairing, setRepairing] = useState<string | null>(null);
  const [communityChannels, setCommunityChannels] = useState<Record<string, Array<{id: string, name: string, parent: {id: string, name: string} | null}>>>({});
  const [loadingCommunityChannels, setLoadingCommunityChannels] = useState<Record<string, boolean>>({});
  const [updatingChannel, setUpdatingChannel] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current tab's data
  const communities = activeTab === 'my-servers' ? myServersData.communities :
                     activeTab === 'my-communities' ? myCommunitiesData.communities :
                     exploreData.communities;
  
  const discordGuilds = activeTab === 'my-servers' ? myServersData.discordGuilds :
                       activeTab === 'my-communities' ? myCommunitiesData.discordGuilds :
                       [];
  
  const memberships = activeTab === 'explore' ? exploreData.memberships : [];

  // Fetch data based on active tab (only if not already loaded)
  useEffect(() => {
    if (!loadedTabs.has(activeTab)) {
      fetchDataForTab();
    }
  }, [activeTab]);

  // Load channels for owned communities when data is loaded
  useEffect(() => {
    if (discordGuilds.length > 0 && communities.length > 0 && activeTab === 'my-servers') {
      const processGuilds = async () => {
        await Promise.all(
          discordGuilds
            .filter(guild => guild.owner)
            .map(async (guild) => {
              const existingCommunity = communities.find(c => c.discord_server_id === guild.id);
              
              if (existingCommunity && !communityChannels[existingCommunity.id]) {
                loadChannelsForCommunity(existingCommunity.id, guild.id);
              }
            })
        );
      };
      processGuilds();
    }
  }, [discordGuilds, communities, activeTab]);

  const fetchDataForTab = async () => {
    setLoading(prev => ({ ...prev, [activeTab]: true }));
    try {
      // Check Discord connection status
      const discordStatusResponse = await fetch('/api/discord/status');
      const discordStatusData = discordStatusResponse.ok ? await discordStatusResponse.json() : null;
      const isDiscordConnected = discordStatusData !== null;
      const hasAccessToken = discordStatusData?.access_token !== null && discordStatusData?.access_token !== undefined;
      setDiscordConnected(isDiscordConnected);

      // Get user ID first
      const userResponse = await fetch('/api/profiles/me');
      let currentUserId: string | null = null;
      if (userResponse.ok) {
        const userData = await userResponse.json();
        currentUserId = userData.id;
        setUserId(currentUserId);
      }

      if (activeTab === 'my-servers') {
        // Tab 1: My Servers - only fetch guilds where user is owner
        if (isDiscordConnected && hasAccessToken) {
          const guildsResponse = await fetch('/api/discord/guilds');
          if (guildsResponse.ok) {
            const guildsData = await guildsResponse.json();
            const ownedGuilds = (guildsData.guilds || []).filter((g: DiscordGuild) => g.owner);

            // Fetch communities for owned guilds only
            let ownedCommunities: Community[] = [];
            if (ownedGuilds.length > 0) {
              const guildIds = ownedGuilds.map((g: DiscordGuild) => g.id);
              const communitiesResponse = await fetch('/api/communities');
              if (communitiesResponse.ok) {
                const communitiesData = await communitiesResponse.json();
                const filteredCommunities = (communitiesData.data || []).filter((c: Community) => 
                  c.discord_server_id && guildIds.includes(c.discord_server_id)
                );

                // Fetch bot status only for owned communities (lazy load)
                ownedCommunities = await Promise.all(
                  filteredCommunities.map(async (community: Community) => {
                    try {
                      const statusResponse = await fetch(`/api/discord/bot/status?community_id=${community.id}`);
                      if (statusResponse.ok) {
                        const statusData = await statusResponse.json();
                        return {
                          ...community,
                          coach_channel_id: statusData.coach_channel_id || null,
                          coach_channel_name: statusData.coach_channel_name || null,
                          botHealth: statusData.health || null,
                        };
                      }
                    } catch (error) {
                      console.error(`Error fetching bot status for community ${community.id}:`, error);
                    }
                    return community;
                  })
                );
              }
            }
            setMyServersData({ communities: ownedCommunities, discordGuilds: ownedGuilds });
          }
        } else {
          setMyServersData({ communities: [], discordGuilds: [] });
        }
      } else if (activeTab === 'my-communities') {
        // Tab 2: My Communities - fetch all Discord servers user has joined (excluding owned ones)
        if (isDiscordConnected && hasAccessToken) {
          const guildsResponse = await fetch('/api/discord/guilds');
          if (guildsResponse.ok) {
            const guildsData = await guildsResponse.json();
            // Filter out servers where user is owner (those are in My Servers tab)
            const joinedGuilds = (guildsData.guilds || []).filter((g: DiscordGuild) => !g.owner);

            // Fetch all communities to check which guilds have LandingZone
            const communitiesResponse = await fetch('/api/communities');
            let matchingCommunities: Community[] = [];
            if (communitiesResponse.ok) {
              const communitiesData = await communitiesResponse.json();
              const allCommunities = communitiesData.data || [];
              
              // Filter communities that match the joined guilds
              matchingCommunities = allCommunities.filter((c: Community) => 
                c.discord_server_id && joinedGuilds.some((g: DiscordGuild) => g.id === c.discord_server_id)
              );
            }
            
            setMyCommunitiesData({ communities: matchingCommunities, discordGuilds: joinedGuilds });
          }
        } else {
          setMyCommunitiesData({ communities: [], discordGuilds: [] });
        }
      } else if (activeTab === 'explore') {
        // Tab 3: Explore Communities - fetch all communities (no bot status initially)
        const communitiesResponse = await fetch('/api/communities');
        let allCommunities: Community[] = [];
        if (communitiesResponse.ok) {
          const communitiesData = await communitiesResponse.json();
          allCommunities = communitiesData.data || [];
        }

        // Fetch user memberships for join status
        let userMemberships: Membership[] = [];
        if (currentUserId) {
          const membershipsResponse = await fetch(`/api/communities?member_id=${currentUserId}`);
          if (membershipsResponse.ok) {
            const membershipsData = await membershipsResponse.json();
            const membershipPromises = (membershipsData.data || []).map(async (community: any) => {
              const membershipResponse = await fetch(`/api/communities?id=${community.id}`);
              if (membershipResponse.ok) {
                const membershipData = await membershipResponse.json();
                const userMembership = membershipData.members?.find(
                  (m: any) => m.profile.id === currentUserId
                );
                if (userMembership) {
                  return {
                    id: userMembership.id,
                    community_id: community.id,
                    role: userMembership.role,
                    joined_at: userMembership.joined_at,
                  };
                }
              }
              return null;
            });
            const membershipResults = await Promise.all(membershipPromises);
            userMemberships = membershipResults.filter((m): m is Membership => m !== null);
          }
        }
        
        setExploreData({ communities: allCommunities, memberships: userMemberships });
      }
      
      // Mark tab as loaded
      setLoadedTabs(prev => new Set(prev).add(activeTab));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(prev => ({ ...prev, [activeTab]: false }));
    }
  };

  // Combine Discord guilds and communities into a unified list for My Servers tab
  const serverItems = useMemo(() => {
    if (activeTab !== 'my-servers') return [];
    
    const items: ServerItem[] = [];

    // Add communities (servers with Landing Zone set up)
    communities.forEach((community) => {
      if (community.discord_server_id) {
        const guild = discordGuilds.find(g => g.id === community.discord_server_id);
        
        items.push({
          id: community.discord_server_id,
          name: community.name,
          icon: community.logo_url || guild?.icon || null,
          owner: guild?.owner || false,
          permissions: guild?.permissions || '',
          features: guild?.features || [],
          hasLandingZone: true,
          communityId: community.id,
          communityName: community.name,
          type: 'community',
          community,
        });
      }
    });

    // Add Discord-only servers (servers without Landing Zone)
    discordGuilds.forEach((guild) => {
      if (!items.some(item => item.id === guild.id)) {
        items.push({
          ...guild,
          type: 'discord_only',
        });
      }
    });

    // Sort: Landing Zone servers first, then alphabetically
    items.sort((a, b) => {
      if (a.hasLandingZone && !b.hasLandingZone) return -1;
      if (!a.hasLandingZone && b.hasLandingZone) return 1;
      return a.name.localeCompare(b.name);
    });

    return items;
  }, [communities, discordGuilds, activeTab]);

  // Create server items for My Communities tab (Discord servers user has joined)
  const myCommunitiesItems = useMemo(() => {
    if (activeTab !== 'my-communities') return [];
    
    const items: ServerItem[] = [];
    
    discordGuilds.forEach((guild) => {
      const community = communities.find(c => c.discord_server_id === guild.id);
      items.push({
        ...guild,
        type: community ? 'community' : 'discord_only',
        community,
        hasLandingZone: !!community,
        communityId: community?.id || null,
        communityName: community?.name || null,
      });
    });

    // Sort: Landing Zone servers first, then alphabetically
    items.sort((a, b) => {
      if (a.hasLandingZone && !b.hasLandingZone) return -1;
      if (!a.hasLandingZone && b.hasLandingZone) return 1;
      return a.name.localeCompare(b.name);
    });

    return items;
  }, [discordGuilds, communities, activeTab]);

  // Filter communities for Explore tab
  const filteredCommunities = useMemo(() => {
    if (activeTab !== 'explore') return [];
    
    let filtered = communities;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = communities.filter(community =>
        community.name.toLowerCase().includes(query) ||
        community.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [communities, searchQuery, activeTab]);

  const handleJoin = async (communityId: string) => {
    setJoining(communityId);
    try {
      const response = await fetch('/api/communities/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ community_id: communityId }),
      });

      if (response.ok) {
        // Refresh explore tab data by marking it as not loaded
        setLoadedTabs(prev => {
          const newSet = new Set(prev);
          newSet.delete('explore');
          return newSet;
        });
        // If we're on explore tab, refresh it
        if (activeTab === 'explore') {
          fetchDataForTab();
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to join community. Make sure you are a member of the Discord server.');
      }
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Failed to join community');
    } finally {
      setJoining(null);
    }
  };

  const handleConnectDiscord = async () => {
    try {
      const response = await fetch('/api/discord/connect');
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to initiate Discord connection');
      }
    } catch (error) {
      console.error('Error connecting Discord:', error);
      alert('Failed to connect Discord');
    }
  };

  const handleInviteBot = async (guild: ServerItem) => {
    try {
      const response = await fetch(`/api/discord/bot/invite-url?guild_id=${guild.id}`);
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to generate bot invite URL');
        return;
      }
      
      const data = await response.json();
      window.open(data.inviteUrl, '_blank');
    } catch (error) {
      console.error('Error getting invite URL:', error);
      alert('Failed to generate bot invite URL');
    }
  };

  const loadChannelsForCommunity = async (communityId: string, guildId: string, forceReload: boolean = false) => {
    if (!forceReload && communityChannels[communityId]) {
      return;
    }

    setLoadingCommunityChannels(prev => ({ ...prev, [communityId]: true }));
    
    try {
      const response = await fetch(`/api/discord/channels?guild_id=${guildId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCommunityChannels(prev => ({ ...prev, [communityId]: data.channels || [] }));
      } else {
        setCommunityChannels(prev => {
          const updated = { ...prev };
          delete updated[communityId];
          return updated;
        });
      }
    } catch (error: any) {
      setCommunityChannels(prev => {
        const updated = { ...prev };
        delete updated[communityId];
        return updated;
      });
    } finally {
      setLoadingCommunityChannels(prev => ({ ...prev, [communityId]: false }));
    }
  };

  const handleChannelChange = async (communityId: string | null, channelId: string, guildId: string, guildName: string) => {
    if (!channelId) {
      return;
    }

    let finalCommunityId = communityId;
    if (!finalCommunityId) {
      setUpdatingChannel('creating');
      try {
        const createResponse = await fetch('/api/communities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: guildName,
            discord_server_id: guildId,
          }),
        });
        
        if (!createResponse.ok) {
          const error = await createResponse.json();
          throw new Error(error.error || 'Failed to create community');
        }
        
        const createData = await createResponse.json();
        finalCommunityId = createData.id;
        
        // Update my-servers tab data
        const newCommunity: Community = {
          id: finalCommunityId!,
          name: guildName,
          description: null,
          logo_url: null,
          discord_invite_url: null,
          discord_server_id: guildId,
          coach_channel_id: null,
          coach_channel_name: null,
          botHealth: null,
        };
        setMyServersData(prev => ({
          ...prev,
          communities: [...prev.communities, newCommunity],
        }));
      } catch (error: any) {
        alert(error.message || 'Failed to create community');
        setUpdatingChannel(null);
        return;
      }
    }

    setUpdatingChannel(finalCommunityId);
    
    try {
      const botStartResponse = await fetch('/api/discord/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          community_id: finalCommunityId,
          discord_server_id: guildId,
          coach_channel_id: channelId,
        }),
      });

      if (!botStartResponse.ok) {
        const error = await botStartResponse.json();
        if (error.needsIntent) {
          alert(`${error.error}\n\n${error.details}\n\nAfter enabling the intent, wait a few seconds and try again.`);
        } else if (error.needsReinvite && error.inviteUrl) {
          const shouldReinvite = confirm(
            `${error.error}\n\n${error.details}\n\nClick OK to open the invite link, add the bot to your server, then try again.`
          );
          if (shouldReinvite) {
            window.open(error.inviteUrl, '_blank');
          }
        } else {
          throw new Error(error.error || 'Failed to set up bot');
        }
        setUpdatingChannel(null);
        return;
      }

      // Update my-servers tab data
      setMyServersData(prev => ({
        ...prev,
        communities: prev.communities.map(community => {
          if (community.id === finalCommunityId) {
            return {
              ...community,
              coach_channel_id: channelId,
              coach_channel_name: null,
            };
          }
          return community;
        }),
      }));

      // Refresh my-servers tab to get updated status
      setLoadedTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete('my-servers');
        return newSet;
      });
      if (activeTab === 'my-servers') {
        fetchDataForTab();
      }
      alert('Coach channel configured successfully!');
    } catch (error: any) {
      console.error('Error updating channel:', error);
      alert(error.message || 'Failed to configure coach channel');
      if (finalCommunityId) {
        await loadChannelsForCommunity(finalCommunityId, guildId);
      }
    } finally {
      setUpdatingChannel(null);
    }
  };

  const handleRepairBot = async (communityId: string, guildId?: string) => {
    setRepairing(communityId);
    try {
      const requestBody = { 
        community_id: communityId,
        discord_server_id: guildId,
      };
      const response = await fetch('/api/discord/bot/repair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update my-servers tab data
        setMyServersData(prev => ({
          ...prev,
          communities: prev.communities.map(community => {
            if (community.id === communityId) {
              return {
                ...community,
                coach_channel_id: result.channel_id || community.coach_channel_id,
                botHealth: { healthy: true, issues: [] },
              };
            }
            return community;
          }),
        }));
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          const statusResponse = await fetch(`/api/discord/bot/status?community_id=${communityId}`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setMyServersData(prev => ({
              ...prev,
              communities: prev.communities.map(community => {
                if (community.id === communityId) {
                  return {
                    ...community,
                    coach_channel_id: statusData.coach_channel_id || community.coach_channel_id,
                    coach_channel_name: statusData.coach_channel_name || community.coach_channel_name,
                    botHealth: statusData.health || community.botHealth,
                  };
                }
                return community;
              }),
            }));
          }
        } catch (error) {
          console.error('Error fetching updated bot status:', error);
        }
        
        if (guildId) {
          await loadChannelsForCommunity(communityId, guildId, true);
        }
        
        alert('Bot setup repaired successfully!');
      } else {
        const error = await response.json();
        
        if (error.needsIntent) {
          alert(
            `${error.error}\n\n${error.details}\n\nAfter enabling the intent, wait a few seconds and try again.`
          );
        } else if (error.needsReinvite && error.inviteUrl) {
          const shouldReinvite = confirm(
            'The bot is not in your Discord server. Click OK to open the invite link, then come back and click Repair again.'
          );
          if (shouldReinvite) {
            window.open(error.inviteUrl, '_blank');
          }
        } else {
          alert(error.error || 'Failed to repair bot setup');
        }
      }
    } catch (error) {
      console.error('Error repairing bot:', error);
      alert('Failed to repair bot setup');
    } finally {
      setRepairing(null);
    }
  };

  const renderMyServersTab = () => {
    if (!discordConnected) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Connect your Discord account to see servers you own.
          </p>
          <GlassButton variant="primary" onClick={handleConnectDiscord}>
            Connect Discord Account
          </GlassButton>
        </div>
      );
    }

    if (serverItems.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">
            You don't own any Discord servers yet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
          {serverItems.map((item) => {
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border-b border-gray-300 last:border-b-0 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {item.icon ? (
                    <img
                      src={item.icon}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-gray-500">
                        {item.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="mb-1">
                      <h3 className="text-xl font-bold">{item.name}</h3>
                    </div>
                    {item.community?.description && (
                      <p className="text-gray-600 mb-2 line-clamp-2">{item.community.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.hasLandingZone && (
                        <>
                          {item.community?.botHealth && !item.community.botHealth.healthy ? (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                              Setup Broken
                            </span>
                          ) : item.community?.botHealth === null && item.community?.discord_server_id ? (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                              Status Unknown
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              Landing Zone Installed
                            </span>
                          )}
                        </>
                      )}
                      {!item.hasLandingZone && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                          Not Set Up
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.hasLandingZone ? (
                    <>
                      {((item.community?.botHealth && !item.community.botHealth.healthy) || 
                        (item.community?.discord_server_id && item.community?.botHealth === null)) ? (
                        <GlassButton
                          variant="primary"
                          onClick={() => handleRepairBot(item.communityId!, item.id)}
                          disabled={repairing === item.communityId}
                          className="text-sm"
                        >
                          {repairing === item.communityId ? 'Repairing...' : 'Repair'}
                        </GlassButton>
                      ) : (
                        <>
                          {item.community && (
                            <div className="flex items-center gap-2">
                              {(() => {
                                const community = item.community;
                                const selectedChannel = community.coach_channel_id 
                                  ? communityChannels[item.communityId!]?.find(ch => ch.id === community.coach_channel_id)
                                  : null;
                                const displayText = selectedChannel 
                                  ? (selectedChannel.parent ? `${selectedChannel.parent.name} / ${selectedChannel.name}` : selectedChannel.name)
                                  : '-- Select Channel --';
                                
                                const textWidth = displayText.length * 7.5;
                                const padding = 60;
                                const calculatedWidth = Math.max(200, textWidth + padding);
                                
                                return (
                                  <select
                                    value={community.coach_channel_id || ''}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleChannelChange(item.communityId!, e.target.value, item.id, item.name);
                                      }
                                    }}
                                    disabled={updatingChannel === item.communityId || repairing === item.communityId}
                                    className="glass-input px-3 py-2 text-sm rounded-xl text-gray-900 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-white/30 focus:bg-white/30"
                                    style={{
                                      width: community.coach_channel_id 
                                        ? `${calculatedWidth}px`
                                        : '200px',
                                      minWidth: '200px',
                                    }}
                                  >
                                    {loadingCommunityChannels[item.communityId!] ? (
                                      <option>Loading channels...</option>
                                    ) : communityChannels[item.communityId!] && communityChannels[item.communityId!].length > 0 ? (
                                      <>
                                        <option value="">-- Select Channel --</option>
                                        {communityChannels[item.communityId!].map((channel) => (
                                          <option key={channel.id} value={channel.id}>
                                            {channel.parent ? `${channel.parent.name} / ${channel.name}` : channel.name}
                                          </option>
                                        ))}
                                      </>
                                    ) : (
                                      <option>No channels available</option>
                                    )}
                                  </select>
                                );
                              })()}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-sm text-gray-600">Invite Landing Zone Bot to Server</p>
                      <GlassButton
                        variant="primary"
                        onClick={() => handleInviteBot(item)}
                        className="text-sm"
                      >
                        Invite
                      </GlassButton>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
    );
  };

  const renderMyCommunitiesTab = () => {
    if (!discordConnected) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Connect your Discord account to see servers you've joined.
          </p>
          <GlassButton variant="primary" onClick={handleConnectDiscord}>
            Connect Discord Account
          </GlassButton>
        </div>
      );
    }

    if (myCommunitiesItems.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">
            You haven't joined any Discord servers yet (excluding servers you own).
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {myCommunitiesItems.map((item) => {
          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border-b border-gray-300 last:border-b-0 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                {item.icon ? (
                  <img
                    src={item.icon}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-gray-500">
                      {item.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="mb-1">
                    <h3 className="text-xl font-bold">{item.name}</h3>
                  </div>
                  {item.community?.description && (
                    <p className="text-gray-600 mb-2 line-clamp-2">{item.community.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.hasLandingZone ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        Landing Zone Installed
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                        Not on Landing Zone
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {item.hasLandingZone ? (
                  <span className="px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold">
                    On Landing Zone
                  </span>
                ) : (
                  <span className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 font-semibold">
                    Not Set Up
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderExploreTab = () => {
    return (
      <>
        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search communities..."
                className="glass-input-enhanced w-full pl-10 pr-4 py-3 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Communities List */}
        {filteredCommunities.length > 0 ? (
          <div className="space-y-4">
            {filteredCommunities.map((community) => {
              const membership = memberships.find(m => m.community_id === community.id);
              const isMember = !!membership;

              return (
                <div
                  key={community.id}
                  className="flex items-center justify-between p-4 border-b border-gray-300 last:border-b-0 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {community.logo_url ? (
                      <img
                        src={community.logo_url}
                        alt={community.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-gray-500">
                          {community.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="mb-1">
                        <h3 className="text-xl font-bold">{community.name}</h3>
                      </div>
                      {community.description && (
                        <p className="text-gray-600 mb-2 line-clamp-2">{community.description}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {community.discord_server_id && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            Landing Zone Installed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isMember ? (
                      <span className="px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold">
                        Member
                      </span>
                    ) : (
                      <GlassButton
                        variant="primary"
                        onClick={() => handleJoin(community.id)}
                        disabled={joining === community.id}
                        className="min-w-[140px]"
                      >
                        {joining === community.id ? 'Joining...' : 'Join Community'}
                      </GlassButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {searchQuery ? 'No communities found matching your search.' : 'No communities available.'}
            </p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-4xl font-bold mb-2">Communities</h1>
        <p className="text-gray-600">Browse and manage Discord communities</p>
      </div>

      {/* Tabs */}
      <GlassCard className="p-0">
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
          {loading[activeTab] ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              {activeTab === 'my-servers' && renderMyServersTab()}
              {activeTab === 'my-communities' && renderMyCommunitiesTab()}
              {activeTab === 'explore' && renderExploreTab()}
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

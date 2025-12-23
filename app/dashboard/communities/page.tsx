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

interface BotHealth {
  healthy: boolean;
  issues: string[];
}

interface ServerItem extends DiscordGuild {
  type: 'community' | 'discord_only';
  community?: Community;
  membership?: Membership;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [discordGuilds, setDiscordGuilds] = useState<DiscordGuild[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [discordConnected, setDiscordConnected] = useState(false);
  const [repairing, setRepairing] = useState<string | null>(null);
  // Removed modal states - using inline UI instead
  const [communityChannels, setCommunityChannels] = useState<Record<string, Array<{id: string, name: string, parent: {id: string, name: string} | null}>>>({});
  const [loadingCommunityChannels, setLoadingCommunityChannels] = useState<Record<string, boolean>>({});
  const [updatingChannel, setUpdatingChannel] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Load channels for owned communities when communities and discordGuilds are loaded
  // Also auto-detect bot presence and create community if bot is in server but community doesn't exist
  useEffect(() => {
    if (discordGuilds.length > 0) {
      const processGuilds = async () => {
        await Promise.all(
          discordGuilds.map(async (guild) => {
            if (guild.owner) {
              // Check if community exists for this guild
              const existingCommunity = communities.find(c => c.discord_server_id === guild.id);
              
              if (existingCommunity) {
                // Community exists - check if it needs auto-repair
                // If bot is in server but community doesn't have bot_enabled or role data, auto-repair
                const needsRepair = !existingCommunity.botHealth || 
                                  (existingCommunity.botHealth && !existingCommunity.botHealth.healthy) ||
                                  !existingCommunity.coach_role_id;
                
                if (needsRepair) {
                  // Check if bot is actually in server by trying to fetch channels
                  try {
                    const channelsCheckResponse = await fetch(`/api/discord/channels?guild_id=${guild.id}`);
                    if (channelsCheckResponse.ok) {
                      // Bot is in server - auto-repair to sync state
                      fetch('/api/discord/bot/repair', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          community_id: existingCommunity.id,
                          discord_server_id: guild.id,
                        }),
                      }).then(async (repairResponse) => {
                        if (repairResponse.ok) {
                          // Fetch updated status after repair
                          const statusResponse = await fetch(`/api/discord/bot/status?community_id=${existingCommunity.id}`);
                          if (statusResponse.ok) {
                            const statusData = await statusResponse.json();
                            // Update community state
                            setCommunities(prev => prev.map(c => 
                              c.id === existingCommunity.id 
                                ? {
                                    ...c,
                                    coach_channel_id: statusData.coach_channel_id || c.coach_channel_id,
                                    coach_channel_name: statusData.coach_channel_name || c.coach_channel_name,
                                    coach_role_id: statusData.coach_role_id || c.coach_role_id,
                                    botHealth: statusData.health || c.botHealth,
                                  }
                                : c
                            ));
                          }
                        }
                      }).catch(() => {
                        // Silently fail - repair will be available via button if needed
                      });
                    }
                  } catch {
                    // Bot not in server or error - that's fine
                  }
                }
                
                // Load channels if not already loaded
                if (!communityChannels[existingCommunity.id]) {
                  loadChannelsForCommunity(existingCommunity.id, guild.id);
                }
              } else {
                // No community exists - check if bot is in server by trying to fetch channels
                // If channels fetch succeeds, bot is likely in server, so create community
                // Silently fail if bot isn't in server (expected case)
                try {
                  const channelsResponse = await fetch(`/api/discord/channels?guild_id=${guild.id}`);
                  if (channelsResponse.ok) {
                    // Bot is in server - auto-create community
                    const channelsData = await channelsResponse.json();
                    if (channelsData.channels && channelsData.channels.length > 0) {
                      // Bot is in server and has channels - create community
                      const createResponse = await fetch('/api/communities', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: guild.name,
                          discord_server_id: guild.id,
                        }),
                      });
                      
                      if (createResponse.ok) {
                        const newCommunity = await createResponse.json();
                        
                        // Auto-repair: Sync bot state (role, bot_enabled, etc.) to Supabase
                        // This ensures Supabase knows about the bot setup that already exists in Discord
                        try {
                          const repairResponse = await fetch('/api/discord/bot/repair', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              community_id: newCommunity.id,
                              discord_server_id: guild.id,
                            }),
                          });
                          
                          if (repairResponse.ok) {
                            // Repair successful - fetch updated status
                            const statusResponse = await fetch(`/api/discord/bot/status?community_id=${newCommunity.id}`);
                            if (statusResponse.ok) {
                              const statusData = await statusResponse.json();
                              // Add to state with updated bot info
                              setCommunities(prev => {
                                // Check if already added (prevent duplicates)
                                if (prev.find(c => c.id === newCommunity.id)) {
                                  return prev.map(c => 
                                    c.id === newCommunity.id 
                                      ? {
                                          ...c,
                                          coach_channel_id: statusData.coach_channel_id || null,
                                          coach_channel_name: statusData.coach_channel_name || null,
                                          coach_role_id: statusData.coach_role_id || null,
                                          botHealth: statusData.health || null,
                                        }
                                      : c
                                  );
                                }
                                return [...prev, {
                                  id: newCommunity.id,
                                  name: guild.name,
                                  description: null,
                                  logo_url: null,
                                  discord_invite_url: null,
                                  discord_server_id: guild.id,
                                  coach_channel_id: statusData.coach_channel_id || null,
                                  coach_channel_name: statusData.coach_channel_name || null,
                                  botHealth: statusData.health || null,
                                }];
                              });
                            } else {
                              // Status check failed, but community was created - add it anyway
                              setCommunities(prev => {
                                if (prev.find(c => c.id === newCommunity.id)) {
                                  return prev;
                                }
                                return [...prev, {
                                  id: newCommunity.id,
                                  name: guild.name,
                                  description: null,
                                  logo_url: null,
                                  discord_invite_url: null,
                                  discord_server_id: guild.id,
                                  coach_channel_id: null,
                                  coach_channel_name: null,
                                  botHealth: null,
                                }];
                              });
                            }
                          } else {
                            // Repair failed, but community was created - add it anyway
                            setCommunities(prev => {
                              if (prev.find(c => c.id === newCommunity.id)) {
                                return prev;
                              }
                              return [...prev, {
                                id: newCommunity.id,
                                name: guild.name,
                                description: null,
                                logo_url: null,
                                discord_invite_url: null,
                                discord_server_id: guild.id,
                                coach_channel_id: null,
                                coach_channel_name: null,
                                botHealth: null,
                              }];
                            });
                          }
                        } catch (repairError) {
                          // Repair error - still add community
                          console.error('Auto-repair failed:', repairError);
                          setCommunities(prev => {
                            if (prev.find(c => c.id === newCommunity.id)) {
                              return prev;
                            }
                            return [...prev, {
                              id: newCommunity.id,
                              name: guild.name,
                              description: null,
                              logo_url: null,
                              discord_invite_url: null,
                              discord_server_id: guild.id,
                              coach_channel_id: null,
                              coach_channel_name: null,
                              botHealth: null,
                            }];
                          });
                        }
                        
                        // Load channels for the new community
                        loadChannelsForCommunity(newCommunity.id, guild.id);
                      }
                    }
                  }
                  // Silently ignore non-OK responses (bot not in server is expected)
                } catch (error) {
                  // Bot not in server or error - that's fine, user will invite bot
                  // Don't log errors - this is expected when bot isn't invited yet
                }
              }
            }
          })
        );
      };
      processGuilds();
    }
  }, [discordGuilds]); // Only depend on discordGuilds, not communities (to avoid infinite loops)

  const fetchData = async () => {
    setLoading(true);
    try {
      // Check Discord connection status
      const discordStatusResponse = await fetch('/api/discord/status');
      const discordStatusData = discordStatusResponse.ok ? await discordStatusResponse.json() : null;
      const isDiscordConnected = discordStatusData !== null;
      const hasAccessToken = discordStatusData?.access_token !== null && discordStatusData?.access_token !== undefined;
      setDiscordConnected(isDiscordConnected);

      // Fetch all communities, Discord guilds, and user's memberships in parallel
      // Only fetch guilds if Discord is connected AND has an access token
      const [communitiesResponse, userResponse, guildsResponse] = await Promise.all([
        fetch('/api/communities'),
        fetch('/api/profiles/me'),
        (isDiscordConnected && hasAccessToken) ? fetch('/api/discord/guilds') : Promise.resolve(null),
      ]);

      let communitiesWithHealth: Community[] = [];
      let guildsList: DiscordGuild[] = [];
      
      if (communitiesResponse.ok) {
        const communitiesData = await communitiesResponse.json();
        const communitiesList = communitiesData.data || [];
        
        // Fetch bot status/health for each community
        communitiesWithHealth = await Promise.all(
          communitiesList.map(async (community: Community) => {
            try {
              const statusResponse = await fetch(`/api/discord/bot/status?community_id=${community.id}`);
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                // #region agent log
                fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'communities/page.tsx:128',message:'Status data received',data:{community_id:community.id, bot_enabled:statusData.bot_enabled, hasHealth:!!statusData.health, healthHealthy:statusData.health?.healthy, healthIssues:statusData.health?.issues},timestamp:Date.now(),sessionId:'debug-session',runId:'fetch-1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                return {
                  ...community,
                  coach_channel_id: statusData.coach_channel_id || null,
                  coach_channel_name: statusData.coach_channel_name || null,
                  botHealth: statusData.health || null,
                };
              } else {
                // #region agent log
                fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'communities/page.tsx:137',message:'Status fetch failed',data:{community_id:community.id, status:statusResponse.status},timestamp:Date.now(),sessionId:'debug-session',runId:'fetch-1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
              }
            } catch (error: any) {
              // #region agent log
              fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'communities/page.tsx:140',message:'Status fetch exception',data:{community_id:community.id, error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'fetch-1',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
              console.error(`Error fetching bot status for community ${community.id}:`, error);
            }
            return community;
          })
        );
        
        setCommunities(communitiesWithHealth);
      }

      if (guildsResponse) {
        if (guildsResponse.ok) {
          const guildsData = await guildsResponse.json();
          console.log('Guilds data received:', guildsData);
          guildsList = guildsData.guilds || [];
          setDiscordGuilds(guildsList);
        } else {
          let errorData;
          try {
            const text = await guildsResponse.text();
            errorData = text ? JSON.parse(text) : { error: `HTTP ${guildsResponse.status}: ${guildsResponse.statusText}` };
          } catch (parseError) {
            errorData = { 
              error: `HTTP ${guildsResponse.status}: ${guildsResponse.statusText}`,
              parseError: parseError instanceof Error ? parseError.message : 'Failed to parse error response'
            };
          }
          
          console.error('Error fetching Discord guilds:', {
            status: guildsResponse.status,
            statusText: guildsResponse.statusText,
            error: errorData
          });
          
          // If it's a "no access token" error, show a helpful message
          if (errorData.code === 'NO_ACCESS_TOKEN' || guildsResponse.status === 400) {
            console.warn('Discord connected but access token missing. User needs to reconnect through Settings.');
            // Don't set discordConnected to false, but we know guilds won't work
          }
          // Still show communities even if guilds fail
        }
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        // Fetch user's memberships
        const membershipsResponse = await fetch(`/api/communities?member_id=${userData.id}`);
        if (membershipsResponse.ok) {
          const membershipsData = await membershipsResponse.json();
          // Fetch membership details for each community the user is a member of
          const membershipPromises = (membershipsData.data || []).map(async (community: any) => {
            const membershipResponse = await fetch(`/api/communities?id=${community.id}`);
            if (membershipResponse.ok) {
              const membershipData = await membershipResponse.json();
              const userMembership = membershipData.members?.find(
                (m: any) => m.profile.id === userData.id
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
          setMemberships(membershipResults.filter((m): m is Membership => m !== null));
        }
      }
      
      // After all data is loaded, load channels for communities where user is owner
      if (communitiesWithHealth.length > 0 && guildsList.length > 0) {
        communitiesWithHealth.forEach((community: Community) => {
          if (community.discord_server_id) {
            // Check if user is owner by finding the guild
            const guild = guildsList.find(g => g.id === community.discord_server_id);
            if (guild?.owner) {
              // Load channels for this community
              loadChannelsForCommunity(community.id, community.discord_server_id);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Combine Discord guilds and communities into a unified list
  const serverItems = useMemo(() => {
    const items: ServerItem[] = [];

    // Add communities (servers with Landing Zone set up)
    communities.forEach((community) => {
      if (community.discord_server_id) {
        const guild = discordGuilds.find(g => g.id === community.discord_server_id);
        const membership = memberships.find(m => m.community_id === community.id);
        
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
          membership,
        });
      }
    });

    // Add Discord-only servers (servers without Landing Zone)
    discordGuilds.forEach((guild) => {
      // Only add if not already added as a community
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
  }, [communities, discordGuilds, memberships]);

  // Filter by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return serverItems;
    
    const query = searchQuery.toLowerCase();
    return serverItems.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.communityName?.toLowerCase().includes(query) ||
      item.community?.description?.toLowerCase().includes(query)
    );
  }, [serverItems, searchQuery]);

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
        // Refresh data
        await fetchData();
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
      // Get bot invite URL from API (server-side)
      const response = await fetch(`/api/discord/bot/invite-url?guild_id=${guild.id}`);
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to generate bot invite URL');
        return;
      }
      
      const data = await response.json();
      
      // Open invite URL in new tab
      window.open(data.inviteUrl, '_blank');
    } catch (error) {
      console.error('Error getting invite URL:', error);
      alert('Failed to generate bot invite URL');
    }
  };


  const loadChannelsForCommunity = async (communityId: string, guildId: string, forceReload: boolean = false) => {
    // Don't reload if already loaded (unless forced)
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
        // Error fetching channels - bot might not be in server (expected case)
        // Only log if it's not a "bot not authorized" type error
        const status = response.status;
        if (status !== 401 && status !== 403 && status !== 404) {
          // Unexpected error - log it
          try {
            const errorData = await response.json();
            console.error('Failed to fetch channels:', errorData);
          } catch {
            // Ignore parse errors
          }
        }
        // Clear channels on error
        setCommunityChannels(prev => {
          const updated = { ...prev };
          delete updated[communityId];
          return updated;
        });
      }
    } catch (error: any) {
      // Network errors or other exceptions - only log if unexpected
      // Bot not in server is expected, so don't spam console
      if (error?.message && !error.message.includes('fetch')) {
        console.error('Error fetching channels:', error);
      }
      // Clear channels on error
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
      return; // Don't update if empty selection
    }

    // If no community ID, create it first
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
        
        // Add to state
        setCommunities(prev => [...prev, {
          id: finalCommunityId!,
          name: guildName,
          description: null,
          logo_url: null,
          discord_invite_url: null,
          discord_server_id: guildId,
          coach_channel_id: null,
          coach_channel_name: null,
          botHealth: null,
        }]);
      } catch (error: any) {
        alert(error.message || 'Failed to create community');
        setUpdatingChannel(null);
        return;
      }
    }

    setUpdatingChannel(finalCommunityId);
    
    try {
      // First, ensure bot is set up (creates coach role)
      const botStartResponse = await fetch('/api/discord/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          community_id: finalCommunityId,
          discord_server_id: guildId,
          coach_channel_id: channelId, // Set channel during setup
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

      // Update community state
      setCommunities(prev => prev.map(community => {
        if (community.id === finalCommunityId) {
          return {
            ...community,
            coach_channel_id: channelId,
            coach_channel_name: null, // Will be updated by status check
          };
        }
        return community;
      }));

      // Refresh data to get updated status
      await fetchData();
      
      // Show success message
      alert('Coach channel configured successfully!');
    } catch (error: any) {
      console.error('Error updating channel:', error);
      alert(error.message || 'Failed to configure coach channel');
      // Reload channels to reset dropdown
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
        
        // Update community state directly without reloading
        setCommunities(prev => prev.map(community => {
          if (community.id === communityId) {
            return {
              ...community,
              coach_channel_id: result.channel_id || community.coach_channel_id,
              coach_role_id: result.role_id || community.coach_role_id,
              discord_server_id: guildId || community.discord_server_id,
              botHealth: { healthy: true, issues: [] }, // Mark as healthy after repair
            };
          }
          return community;
        }));
        
        // Refresh bot health status for this community
        // Add a small delay to ensure database update has committed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          const statusResponse = await fetch(`/api/discord/bot/status?community_id=${communityId}`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setCommunities(prev => prev.map(community => {
              if (community.id === communityId) {
                return {
                  ...community,
                  coach_channel_id: statusData.coach_channel_id || community.coach_channel_id,
                  coach_channel_name: statusData.coach_channel_name || community.coach_channel_name,
                  coach_role_id: statusData.coach_role_id || community.coach_role_id,
                  botHealth: statusData.health || community.botHealth,
                };
              }
              return community;
            }));
          }
        } catch (error) {
          console.error('Error fetching updated bot status:', error);
        }
        
        // Reload channels for this community after repair (force reload)
        if (guildId) {
          await loadChannelsForCommunity(communityId, guildId, true);
        }
        
        alert('Bot setup repaired successfully!');
      } else {
        const error = await response.json();
        
        // Show helpful message if bot needs Server Members Intent
        if (error.needsIntent) {
          alert(
            `${error.error}\n\n${error.details}\n\nAfter enabling the intent, wait a few seconds and try again.`
          );
        }
        // Show helpful message if bot needs to be re-invited
        else if (error.needsReinvite && error.inviteUrl) {
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


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <GlassCard>
          <div className="text-center py-12">
            <p className="text-gray-600">Loading communities...</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Communities</h1>
        <p className="text-gray-600">Browse and join Discord communities</p>
      </div>

      {/* Search Bar */}
      <GlassCard>
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
          {!discordConnected && (
            <GlassButton variant="primary" onClick={handleConnectDiscord}>
              Connect Discord
            </GlassButton>
          )}
        </div>
      </GlassCard>

      {/* Discord Connection Prompt */}
      {!discordConnected && discordGuilds.length === 0 && (
        <GlassCard>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Connect your Discord account to see all servers you're part of and which ones have Landing Zone set up.
            </p>
            <GlassButton variant="primary" onClick={handleConnectDiscord}>
              Connect Discord Account
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Server List */}
      <GlassCard>
        {filteredItems.length > 0 ? (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const member = item.membership !== undefined;
              const role = item.membership?.role;
              const joinedDate = item.membership?.joined_at;

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
                        {member && joinedDate && (
                          <div className="text-sm text-gray-500">
                            <span>Joined {new Date(joinedDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {/* Tags moved below Joined date */}
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
                        {/* Show Server Owner if they own the Discord server, otherwise show community role */}
                        {item.owner ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            Server Owner
                          </span>
                        ) : member && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              role === 'owner'
                                ? 'bg-purple-100 text-purple-800'
                                : role === 'admin'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'Member'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.hasLandingZone ? (
                      <>
                        {/* Show repair button if: botHealth exists and is unhealthy, OR bot_enabled but no health check was performed */}
                        {((item.community?.botHealth && !item.community.botHealth.healthy) || 
                          (item.community?.discord_server_id && item.community?.botHealth === null)) ? (
                          <div className="flex items-end">
                            {item.owner && (
                              <GlassButton
                                variant="primary"
                                onClick={() => handleRepairBot(item.communityId!, item.id)}
                                disabled={repairing === item.communityId}
                                className="text-sm"
                              >
                                {repairing === item.communityId ? 'Repairing...' : 'Repair'}
                              </GlassButton>
                            )}
                          </div>
                        ) : (
                          <>
                            {/* Show channel selector for owners if bot is enabled */}
                            {item.owner && item.community && (
                              <div className="flex items-center gap-2">
                                {/* Coach Channel Dropdown */}
                                {(() => {
                                  const selectedChannel = item.community.coach_channel_id 
                                    ? communityChannels[item.communityId!]?.find(ch => ch.id === item.community.coach_channel_id)
                                    : null;
                                  const displayText = selectedChannel 
                                    ? (selectedChannel.parent ? `${selectedChannel.parent.name} / ${selectedChannel.name}` : selectedChannel.name)
                                    : '-- Select Channel --';
                                  
                                  // Calculate width based on text length (approximate)
                                  const textWidth = displayText.length * 7.5; // Approximate character width in pixels
                                  const padding = 60; // Padding + dropdown arrow
                                  const calculatedWidth = Math.max(200, textWidth + padding);
                                  
                                  return (
                                    <select
                                      value={item.community.coach_channel_id || ''}
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleChannelChange(item.communityId!, e.target.value, item.id, item.name);
                                        }
                                      }}
                                      disabled={updatingChannel === item.communityId || repairing === item.communityId}
                                      className="glass-input px-3 py-2 text-sm rounded-xl text-gray-900 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-white/30 focus:bg-white/30"
                                      style={{
                                        width: item.community.coach_channel_id 
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
                            {/* Only show Member tag if bot is not connected (no channel dropdown visible) */}
                            {member && !(item.owner && item.community) && (
                              <span className="px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold">
                                Member
                              </span>
                            )}
                            {!member && (
                              <GlassButton
                                variant="primary"
                                onClick={() => handleJoin(item.communityId!)}
                                disabled={joining === item.communityId}
                                className="min-w-[140px]"
                              >
                                {joining === item.communityId ? 'Joining...' : 'Join Community'}
                              </GlassButton>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        {item.owner && (
                          <>
                            {/* Show invite button or channel selector based on bot presence */}
                            {(() => {
                              // Check if community exists (which means bot is likely connected)
                              const community = communities.find(c => c.discord_server_id === item.id);
                              
                              if (community) {
                                // Bot is connected - show channel selector
                                return (
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={community.coach_channel_id || ''}
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleChannelChange(community.id, e.target.value, item.id, item.name);
                                        }
                                      }}
                                      disabled={updatingChannel === community.id || updatingChannel === 'creating'}
                                      className="glass-input px-3 py-2 text-sm rounded-xl text-gray-900 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-white/30 focus:bg-white/30"
                                      style={{ minWidth: '200px' }}
                                    >
                                      {loadingCommunityChannels[community.id] ? (
                                        <option>Loading channels...</option>
                                      ) : communityChannels[community.id] && communityChannels[community.id].length > 0 ? (
                                        <>
                                          <option value="">-- Select Channel --</option>
                                          {communityChannels[community.id].map((channel) => (
                                            <option key={channel.id} value={channel.id}>
                                              {channel.parent ? `${channel.parent.name} / ${channel.name}` : channel.name}
                                            </option>
                                          ))}
                                        </>
                                      ) : (
                                        <option>No channels available</option>
                                      )}
                                    </select>
                                    <GlassButton
                                      variant="outline"
                                      onClick={() => handleRefreshChannels(item.id, community.id)}
                                      disabled={loadingCommunityChannels[community.id]}
                                      className="px-3 py-2"
                                      title="Refresh channel list"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                    </GlassButton>
                                  </div>
                                );
                              }
                              
                              // Bot not connected yet - show invite button
                              return (
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
                              );
                            })()}
                          </>
                        )}
                        {!item.owner && (
                          <p className="text-sm text-gray-600">Not set up</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {searchQuery ? 'No communities found matching your search.' : 'No Discord servers found.'}
            </p>
            {!discordConnected && (
              <div className="mt-4">
                <GlassButton variant="primary" onClick={handleConnectDiscord}>
                  Connect Discord Account
                </GlassButton>
              </div>
            )}
          </div>
        )}
      </GlassCard>

    </div>
  );
}

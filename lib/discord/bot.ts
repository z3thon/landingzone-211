// Server-only module - Discord.js should only be used server-side
import 'server-only';

import { Client, GatewayIntentBits, VoiceState, ChannelType, Guild, GuildMember } from 'discord.js';
import { createServiceRoleClient } from '@/lib/supabase/server';

interface BotConfig {
  guildId: string;
  communityId: string;
  coachChannelName: string; // Name of the "Coach" voice channel to monitor
  coachRoleId: string; // Discord role ID for authorized coaches
  coachChannelId: string | null; // Discord channel ID of the coach voice channel (null if not configured)
}

interface ActiveSession {
  voiceChannelId: string;
  coachDiscordId: string;
  coachProfileId: string;
  attendeeDiscordId: string | null;
  attendeeProfileId: string | null;
  startedAt: Date;
  callSessionId: string | null;
}

class LandingZoneBot {
  public client: Client;
  private configs: Map<string, BotConfig> = new Map(); // guildId -> config
  private activeSessions: Map<string, ActiveSession> = new Map(); // voiceChannelId -> session
  private supabase = createServiceRoleClient();

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
      ],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.once('ready', () => {
      console.log(`Discord bot logged in as ${this.client.user?.tag}`);
    });

    this.client.on('voiceStateUpdate', async (oldState: VoiceState, newState: VoiceState) => {
      await this.handleVoiceStateUpdate(oldState, newState);
    });

    this.client.on('error', (error) => {
      console.error('Discord bot error:', error);
    });
  }

  /**
   * Create coach role and channel for a guild
   */
  async setupCoachRoleAndChannel(
    guildId: string,
    communityId: string,
    coachChannelId: string | null = null,
    coachChannelName: string = 'Coach'
  ): Promise<{ roleId: string; channelId: string } | null> {
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) {
        console.error(`Guild ${guildId} not found`);
        return null;
      }

      // Create or get coach role
      let coachRole = guild.roles.cache.find(role => role.name === 'Landing Zone Coach');
      
      if (!coachRole) {
        coachRole = await guild.roles.create({
          name: 'Landing Zone Coach',
          color: 0x00ff00, // Green color
          mentionable: false,
          reason: 'Landing Zone coach role for authorized coaches',
        });
        console.log(`Created coach role: ${coachRole.id}`);
      }

      // Use provided channel ID, or find/create coach voice channel, or skip channel setup
      let coachChannel: any = null;

      if (coachChannelId) {
        // Use the provided channel ID
        coachChannel = guild.channels.cache.get(coachChannelId);
        if (!coachChannel) {
          // Try fetching it
          try {
            coachChannel = await guild.channels.fetch(coachChannelId);
          } catch (error) {
            console.error(`Channel ${coachChannelId} not found`);
            return null;
          }
        }

        // Verify it's a voice channel
        if (coachChannel.type !== ChannelType.GuildVoice) {
          console.error(`Channel ${coachChannelId} is not a voice channel`);
          return null;
        }

        // Update permissions on the selected channel
        await coachChannel.permissionOverwrites.edit(guild.roles.everyone.id, {
          ViewChannel: false,
          Connect: false,
        });
        await coachChannel.permissionOverwrites.edit(coachRole.id, {
          ViewChannel: true,
          Connect: true,
        });
        console.log(`Configured selected coach channel: ${coachChannel.id}`);
      } else if (coachChannelName) {
        // Find or create coach voice channel by name (only if name provided)
        coachChannel = guild.channels.cache.find(
          channel => channel.name.toLowerCase() === coachChannelName.toLowerCase() && channel.type === ChannelType.GuildVoice
        ) as any;

        if (!coachChannel) {
          // Create in a category or root
          const category = guild.channels.cache.find(
            ch => ch.type === ChannelType.GuildCategory && ch.name === 'Coaching'
          ) || null;

          coachChannel = await guild.channels.create({
            name: coachChannelName,
            type: ChannelType.GuildVoice,
            parent: category?.id || null,
            permissionOverwrites: [
              {
                id: guild.roles.everyone.id,
                deny: ['ViewChannel', 'Connect'],
              },
              {
                id: coachRole.id,
                allow: ['ViewChannel', 'Connect'],
              },
            ],
            reason: 'Landing Zone coach voice channel',
          });
          console.log(`Created coach channel: ${coachChannel.id}`);
        } else {
          // Update permissions if channel exists
          await coachChannel.permissionOverwrites.edit(guild.roles.everyone.id, {
            ViewChannel: false,
            Connect: false,
          });
          await coachChannel.permissionOverwrites.edit(coachRole.id, {
            ViewChannel: true,
            Connect: true,
          });
          console.log(`Updated permissions for existing coach channel: ${coachChannel.id}`);
        }
      }
      // If neither coachChannelId nor coachChannelName provided, skip channel setup

      return {
        roleId: coachRole.id,
        channelId: coachChannel?.id || null,
      };
    } catch (error) {
      console.error('Error setting up coach role and channel:', error);
      return null;
    }
  }

  /**
   * Assign coach role to a Discord user
   */
  async assignCoachRole(guildId: string, discordUserId: string, roleId: string): Promise<boolean> {
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) {
        console.error(`Guild ${guildId} not found`);
        return false;
      }

      const member = await guild.members.fetch(discordUserId);
      if (!member) {
        console.error(`Member ${discordUserId} not found in guild`);
        return false;
      }

      const role = guild.roles.cache.get(roleId);
      if (!role) {
        console.error(`Role ${roleId} not found`);
        return false;
      }

      await member.roles.add(role, 'Landing Zone coach authorization');
      console.log(`Assigned coach role to ${member.user.tag}`);
      return true;
    } catch (error) {
      console.error('Error assigning coach role:', error);
      return false;
    }
  }

  /**
   * Remove coach role from a Discord user
   */
  async removeCoachRole(guildId: string, discordUserId: string, roleId: string): Promise<boolean> {
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) {
        console.error(`Guild ${guildId} not found`);
        return false;
      }

      const member = await guild.members.fetch(discordUserId).catch(() => null);
      if (!member) {
        // Member might have left the server, that's okay
        return true;
      }

      const role = guild.roles.cache.get(roleId);
      if (!role) {
        console.error(`Role ${roleId} not found`);
        return false;
      }

      await member.roles.remove(role, 'Landing Zone coach authorization removed');
      console.log(`Removed coach role from ${member.user.tag}`);
      return true;
    } catch (error) {
      console.error('Error removing coach role:', error);
      return false;
    }
  }

  /**
   * Check if bot setup is healthy (role and channel exist)
   */
  async checkHealth(
    guildId: string,
    roleId: string | null,
    channelId: string | null
  ): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check if bot is online
      if (!this.client.isReady()) {
        issues.push('Bot is not connected to Discord');
        return { healthy: false, issues };
      }

      // Fetch guild if not in cache
      let guild = this.client.guilds.cache.get(guildId);
      if (!guild) {
        try {
          guild = await this.client.guilds.fetch(guildId);
        } catch (error: any) {
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/discord/bot.ts:257',message:'Guild fetch failed in checkHealth',data:{guildId, error:error?.message, code:error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'health-1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          issues.push('Bot is not in the Discord server');
          return { healthy: false, issues };
        }
      }

      if (!guild) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/discord/bot.ts:265',message:'Guild still null after fetch in checkHealth',data:{guildId},timestamp:Date.now(),sessionId:'debug-session',runId:'health-1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        issues.push('Bot is not in the Discord server');
        return { healthy: false, issues };
      }

      // Check role exists
      if (roleId) {
        let role = guild.roles.cache.get(roleId);
        if (!role) {
          // Try fetching role
          try {
            await guild.roles.fetch(roleId);
            role = guild.roles.cache.get(roleId);
          } catch (error) {
            // Role doesn't exist
          }
        }
        if (!role) {
          issues.push('Coach role was deleted or not found');
        }
      } else {
        issues.push('Coach role ID not configured');
      }

      // Check channel exists
      if (channelId) {
        let channel = guild.channels.cache.get(channelId);
        if (!channel) {
          // Try fetching channel
          try {
            channel = await guild.channels.fetch(channelId) as any;
          } catch (error) {
            // Channel doesn't exist
          }
        }
        if (!channel) {
          issues.push('Coach voice channel was deleted or not found');
        }
      } else {
        issues.push('Coach channel ID not configured');
      }

      return {
        healthy: issues.length === 0,
        issues,
      };
    } catch (error) {
      console.error('Error checking bot health:', error);
      issues.push('Error checking bot health');
      return { healthy: false, issues };
    }
  }

  /**
   * Repair bot setup - recreate missing role and/or channel
   * This also handles cases where the bot was kicked and needs to be re-invited
   */
  async repairSetup(
    guildId: string,
    communityId: string,
    coachChannelName: string,
    existingRoleId: string | null,
    existingChannelId: string | null
  ): Promise<{ roleId: string; channelId: string } | null> {
    try {
      // Try to fetch guild - this will fail if bot is not in the server
      let guild = this.client.guilds.cache.get(guildId);
      
      if (!guild) {
        try {
          guild = await this.client.guilds.fetch(guildId);
        } catch (error: any) {
          console.error(`Guild ${guildId} not found - bot may need to be re-invited to the server`);
          // Return null so the API can provide a helpful error message
          return null;
        }
      }
      
      if (!guild) {
        console.error(`Guild ${guildId} not found - bot may need to be re-invited`);
        return null;
      }

      // Check/create role
      let coachRole = existingRoleId ? guild.roles.cache.get(existingRoleId) : null;
      
      if (!coachRole) {
        // Try to find by name first
        coachRole = guild.roles.cache.find(role => role.name === 'Landing Zone Coach');
        
        if (!coachRole) {
          try {
            coachRole = await guild.roles.create({
              name: 'Landing Zone Coach',
              color: 0x00ff00, // Green color
              mentionable: false,
              reason: 'Landing Zone coach role repair',
            });
            console.log(`Repaired coach role: ${coachRole.id}`);
          } catch (roleError: any) {
            throw roleError;
          }
        } else {
          console.log(`Found existing coach role: ${coachRole.id}`);
        }
      }

      // Check/create channel
      let coachChannel = existingChannelId ? guild.channels.cache.get(existingChannelId) as any : null;
      
      if (!coachChannel) {
        // Try to find by name
        coachChannel = guild.channels.cache.find(
          channel => channel.name.toLowerCase() === coachChannelName.toLowerCase() && channel.type === ChannelType.GuildVoice
        ) as any;

        if (!coachChannel) {
          // Create new channel
          const category = guild.channels.cache.find(
            ch => ch.type === ChannelType.GuildCategory && ch.name === 'Coaching'
          ) || null;

          try {
            coachChannel = await guild.channels.create({
              name: coachChannelName,
              type: ChannelType.GuildVoice,
              parent: category?.id || null,
              permissionOverwrites: [
                {
                  id: guild.roles.everyone.id,
                  deny: ['ViewChannel', 'Connect'],
                },
                {
                  id: coachRole.id,
                  allow: ['ViewChannel', 'Connect'],
                },
              ],
              reason: 'Landing Zone coach voice channel repair',
            });
            console.log(`Repaired coach channel: ${coachChannel.id}`);
          } catch (channelError: any) {
            throw channelError;
          }
        } else {
          // Update permissions on existing channel
          try {
            await coachChannel.permissionOverwrites.edit(guild.roles.everyone.id, {
              ViewChannel: false,
              Connect: false,
            });
            await coachChannel.permissionOverwrites.edit(coachRole.id, {
              ViewChannel: true,
              Connect: true,
            });
            console.log(`Updated permissions on existing channel: ${coachChannel.id}`);
          } catch (permError: any) {
            // Continue anyway - channel exists, permissions might be set manually
            console.warn('Failed to update channel permissions:', permError);
          }
        }
      } else {
        // Ensure permissions are correct on existing channel
        try {
          await coachChannel.permissionOverwrites.edit(guild.roles.everyone.id, {
            ViewChannel: false,
            Connect: false,
          });
          await coachChannel.permissionOverwrites.edit(coachRole.id, {
            ViewChannel: true,
            Connect: true,
          });
        } catch (permError: any) {
          // Continue anyway - channel exists
          console.warn('Failed to update channel permissions:', permError);
        }
      }

      return {
        roleId: coachRole.id,
        channelId: coachChannel.id,
      };
    } catch (error: any) {
      console.error('Error repairing bot setup:', error);
      return null;
    }
  }

  /**
   * Register a guild/community for bot monitoring
   */
  async registerGuild(config: BotConfig): Promise<void> {
    this.configs.set(config.guildId, config);
    console.log(`Registered guild ${config.guildId} for community ${config.communityId}`);
  }

  /**
   * Get bot config for a guild
   */
  getGuildConfig(guildId: string): BotConfig | undefined {
    return this.configs.get(guildId);
  }

  /**
   * Unregister a guild from bot monitoring
   */
  async unregisterGuild(guildId: string): Promise<void> {
    this.configs.delete(guildId);
    
    // Clean up any active sessions for this guild
    const guild = this.client.guilds.cache.get(guildId);
    if (guild) {
      for (const [channelId, session] of this.activeSessions.entries()) {
        const channel = guild.channels.cache.get(channelId);
        if (channel) {
          await this.cleanupSession(channelId);
        }
      }
    }
    
    console.log(`Unregistered guild ${guildId}`);
  }

  /**
   * Login the bot to Discord
   */
  async login(token: string): Promise<void> {
    await this.client.login(token);
  }

  /**
   * Logout the bot
   */
  async logout(): Promise<void> {
    // Clean up all active sessions
    for (const channelId of this.activeSessions.keys()) {
      await this.cleanupSession(channelId);
    }
    
    this.client.destroy();
  }

  /**
   * Handle voice state updates (join/leave events)
   */
  private async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const guildId = newState.guild.id;
    const config = this.configs.get(guildId);
    
    if (!config) {
      return; // Not monitoring this guild
    }

    const guild = newState.guild;
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    // User joined a voice channel
    if (newChannel && !oldChannel) {
      await this.handleVoiceJoin(newState, config, guild);
    }
    
    // User left a voice channel
    if (oldChannel && !newChannel) {
      await this.handleVoiceLeave(oldState, config);
    }
    
    // User moved between channels
    if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
      await this.handleVoiceMove(oldState, newState, config, guild);
    }
  }

  /**
   * Handle when a user joins a voice channel
   */
  private async handleVoiceJoin(
    state: VoiceState,
    config: BotConfig,
    guild: Guild
  ): Promise<void> {
    const channel = state.channel;
    if (!channel) return;

    const member = state.member;
    if (!member || member.user.bot) return; // Ignore bots

    // Check if user joined the "Coach" channel (by ID or name)
    if (channel.id === config.coachChannelId || channel.name.toLowerCase() === config.coachChannelName.toLowerCase()) {
      await this.handleCoachChannelJoin(member, channel, config, guild);
    }
    
    // Check if user joined a temporary coaching channel
    const session = this.activeSessions.get(channel.id);
    if (session) {
      await this.handleCoachingChannelJoin(member, channel, session, config);
    }
  }

  /**
   * Handle when a coach joins the "Coach" channel
   */
  private async handleCoachChannelJoin(
    member: GuildMember,
    channel: any,
    config: BotConfig,
    guild: Guild
  ): Promise<void> {
    try {
      // Verify user has coach role
      if (!member.roles.cache.has(config.coachRoleId)) {
        // Not authorized - move them out
        console.log(`User ${member.id} does not have coach role`);
        try {
          await member.voice.setChannel(null);
          await member.send('You are not authorized to use the Coach channel. Please set up a coaching rate in your Landing Zone profile first.');
        } catch (error) {
          console.error('Error removing unauthorized user:', error);
        }
        return;
      }

      // Get coach profile and rate
      const coachInfo = await this.getCoachInfo(member.id, config.communityId);
      if (!coachInfo) {
        console.log(`Could not get coach info for ${member.id}`);
        return;
      }

      const { profileId, hourlyRate } = coachInfo;

      // Create temporary voice channel
      const tempChannelName = `💰 $${hourlyRate}/hr - ${member.displayName}`.substring(0, 100); // Discord limit
      
      const tempChannel = await guild.channels.create({
        name: tempChannelName,
        type: ChannelType.GuildVoice,
        parent: channel.parent, // Same category as coach channel
        userLimit: 2, // Only coach + 1 attendee
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: ['ViewChannel', 'Connect'],
          },
          {
            id: member.id,
            allow: ['ViewChannel', 'Connect', 'ManageChannels'],
          },
        ],
        reason: 'Landing Zone coaching session',
      });

      // Move coach to the new channel (if they're still in a voice channel)
      if (member.voice.channel) {
        await member.voice.setChannel(tempChannel);
      }

      // Create session record
      const session: ActiveSession = {
        voiceChannelId: tempChannel.id,
        coachDiscordId: member.id,
        coachProfileId: profileId,
        attendeeDiscordId: null,
        attendeeProfileId: null,
        startedAt: new Date(),
        callSessionId: null,
      };

      this.activeSessions.set(tempChannel.id, session);

      // Report to server
      await this.reportVoiceChannelCreated(config.communityId, {
        discordChannelId: tempChannel.id,
        channelName: tempChannelName,
        coachDiscordId: member.id,
        coachProfileId: profileId,
        hourlyRate,
      });

      console.log(`Created coaching channel ${tempChannelName} for coach ${member.displayName}`);
    } catch (error) {
      console.error('Error handling coach channel join:', error);
    }
  }

  /**
   * Handle when someone joins a coaching channel
   */
  private async handleCoachingChannelJoin(
    member: GuildMember,
    channel: any,
    session: ActiveSession,
    config: BotConfig
  ): Promise<void> {
    // If coach joins their own channel, update permissions
    if (member.id === session.coachDiscordId) {
      // Coach rejoined - ensure they have permissions
      return;
    }

    // Someone else joined - this is an attendee
    const attendeeProfileId = await this.getProfileIdFromDiscordId(member.id);
    
    if (attendeeProfileId) {
      session.attendeeDiscordId = member.id;
      session.attendeeProfileId = attendeeProfileId;

      // Start call session
      await this.startCallSession(session, config.communityId);

      console.log(`Attendee ${member.displayName} joined coaching channel`);
    }
  }

  /**
   * Handle when a user leaves a voice channel
   */
  private async handleVoiceLeave(
    state: VoiceState,
    config: BotConfig
  ): Promise<void> {
    const channel = state.channel;
    if (!channel) return;

    const session = this.activeSessions.get(channel.id);
    if (!session) return;

    const member = state.member;
    if (!member) return;

    // If coach left, end session
    if (member.id === session.coachDiscordId) {
      await this.endCallSession(channel.id, config);
    }
    // If attendee left, check if channel is empty
    else if (member.id === session.attendeeDiscordId) {
      const voiceChannel = channel;
      const members = voiceChannel.members;
      
      // If only coach remains, end session
      if (members.size === 1 && members.has(session.coachDiscordId)) {
        await this.endCallSession(channel.id, config);
      } else {
        // Update session - attendee left but others remain
        session.attendeeDiscordId = null;
        session.attendeeProfileId = null;
      }
    }
  }

  /**
   * Handle when a user moves between channels
   */
  private async handleVoiceMove(
    oldState: VoiceState,
    newState: VoiceState,
    config: BotConfig,
    guild: Guild
  ): Promise<void> {
    // Handle leaving old channel
    await this.handleVoiceLeave(oldState, config);
    
    // Handle joining new channel
    await this.handleVoiceJoin(newState, config, guild);
  }

  /**
   * Get coach info (profile ID and hourly rate)
   */
  private async getCoachInfo(
    discordUserId: string,
    communityId: string
  ): Promise<{ profileId: string; hourlyRate: number } | null> {
    try {
      // Get profile ID from Discord user ID
      const { data: discordUser } = await this.supabase
        .from('discord_users')
        .select('profile_id')
        .eq('discord_user_id', discordUserId)
        .single();

      if (!discordUser) {
        return null;
      }

      // Check if user has coaching rate set
      const typedDiscordUser = discordUser as { profile_id: string; [key: string]: any };
      const { data: profileData } = await this.supabase
        .from('profiles')
        .select('id, coaching_rate_id')
        .eq('id', typedDiscordUser.profile_id)
        .single();

      const profile = profileData as { id: string; coaching_rate_id: string | null } | null;

      if (!profile || !profile.coaching_rate_id) {
        return null;
      }

      // Get the coaching rate
      const { data: rateData } = await this.supabase
        .from('rates')
        .select('rate_per_hour')
        .eq('id', profile.coaching_rate_id)
        .eq('status', 'active')
        .single();

      const rate = rateData as { rate_per_hour: number } | null;

      if (!rate) {
        return null;
      }

      // Verify user is member of the community
      const { data: membershipData } = await this.supabase
        .from('community_members')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('community_id', communityId)
        .single();

      const membership = membershipData as { id: string } | null;

      if (!membership) {
        return null;
      }

      return {
        profileId: profile.id,
        hourlyRate: parseFloat(rate.rate_per_hour.toString()),
      };
    } catch (error) {
      console.error('Error verifying coach:', error);
      return null;
    }
  }

  /**
   * Get profile ID from Discord user ID
   */
  private async getProfileIdFromDiscordId(discordUserId: string): Promise<string | null> {
    try {
      const { data: discordUserData } = await this.supabase
        .from('discord_users')
        .select('profile_id')
        .eq('discord_user_id', discordUserId)
        .single();

      const discordUser = discordUserData as { profile_id: string } | null;

      return discordUser?.profile_id || null;
    } catch (error) {
      console.error('Error getting profile ID:', error);
      return null;
    }
  }

  /**
   * Start a call session
   */
  private async startCallSession(session: ActiveSession, communityId: string): Promise<void> {
    if (session.callSessionId) {
      return; // Already started
    }

    try {
      // Get voice channel record
      const { data: voiceChannelData } = await this.supabase
        .from('voice_channels')
        .select('id')
        .eq('discord_channel_id', session.voiceChannelId)
        .single();

      const voiceChannel = voiceChannelData as { id: string } | null;

      if (!voiceChannel) {
        console.error('Voice channel not found in database');
        return;
      }

      // Create call session
      const insertQuery = this.supabase
        .from('call_sessions')
        // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
        .insert({
          voice_channel_id: voiceChannel.id,
          coach_profile_id: session.coachProfileId,
          attendee_profile_id: session.attendeeProfileId!,
          started_at: session.startedAt.toISOString(),
          status: 'active',
        })
        .select('id')
        .single();
      const { data: callSessionData, error } = await insertQuery;

      if (error) {
        console.error('Error creating call session:', error);
        return;
      }

      const callSession = callSessionData as { id: string } | null;
      if (!callSession) {
        console.error('Failed to create call session');
        return;
      }

      session.callSessionId = callSession.id;

      // Report to server
      await this.reportCallSessionStarted(communityId, {
        callSessionId: callSession.id,
        voiceChannelId: session.voiceChannelId,
        coachProfileId: session.coachProfileId,
        attendeeProfileId: session.attendeeProfileId!,
      });

      console.log(`Call session started: ${callSession.id}`);
    } catch (error) {
      console.error('Error starting call session:', error);
    }
  }

  /**
   * End a call session
   */
  private async endCallSession(voiceChannelId: string, config: BotConfig): Promise<void> {
    const session = this.activeSessions.get(voiceChannelId);
    if (!session) return;

    try {
      if (session.callSessionId) {
        // Update call session
        const endedAt = new Date();
        const durationMinutes = Math.floor(
          (endedAt.getTime() - session.startedAt.getTime()) / 60000
        );

        const updateQuery = this.supabase
          .from('call_sessions')
          // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
          .update({
            ended_at: endedAt.toISOString(),
            duration_minutes: durationMinutes,
            status: 'completed',
          })
          .eq('id', session.callSessionId);
        const { error } = await updateQuery;

        if (error) {
          console.error('Error updating call session:', error);
        }

        // Report to server
        await this.reportCallSessionEnded(config.communityId, {
          callSessionId: session.callSessionId,
          durationMinutes,
        });
      }

      // Delete the temporary voice channel
      const guild = this.client.guilds.cache.get(config.guildId);
      if (guild) {
        const channel = guild.channels.cache.get(voiceChannelId);
        if (channel) {
          await channel.delete();
        }
      }

      // Remove session
      this.activeSessions.delete(voiceChannelId);

      console.log(`Call session ended and channel deleted: ${voiceChannelId}`);
    } catch (error) {
      console.error('Error ending call session:', error);
    }
  }

  /**
   * Cleanup a session (when bot shuts down or guild unregisters)
   */
  private async cleanupSession(voiceChannelId: string): Promise<void> {
    const session = this.activeSessions.get(voiceChannelId);
    if (!session) return;

    // Find config for this session
    let config: BotConfig | undefined;
    for (const [guildId, cfg] of this.configs.entries()) {
      const guild = this.client.guilds.cache.get(guildId);
      if (guild) {
        const channel = guild.channels.cache.get(voiceChannelId);
        if (channel) {
          config = cfg;
          break;
        }
      }
    }

    if (config) {
      await this.endCallSession(voiceChannelId, config);
    }
  }

  /**
   * Report voice channel creation to server
   */
  private async reportVoiceChannelCreated(
    communityId: string,
    data: {
      discordChannelId: string;
      channelName: string;
      coachDiscordId: string;
      coachProfileId: string;
      hourlyRate: number;
    }
  ): Promise<void> {
    // This will be called by the API endpoint
    // For now, we'll create the voice channel record directly
    try {
      const insertQuery = this.supabase
        .from('voice_channels')
        // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
        .insert({
          community_id: communityId,
          discord_channel_id: data.discordChannelId,
          channel_name: data.channelName,
          coach_profile_id: data.coachProfileId,
          billing_rate_per_hour: data.hourlyRate,
          active: true,
        });
      const { error } = await insertQuery;

      if (error) {
        console.error('Error creating voice channel record:', error);
      }
    } catch (error) {
      console.error('Error reporting voice channel creation:', error);
    }
  }

  /**
   * Report call session started
   */
  private async reportCallSessionStarted(
    communityId: string,
    data: {
      callSessionId: string;
      voiceChannelId: string;
      coachProfileId: string;
      attendeeProfileId: string;
    }
  ): Promise<void> {
    // Already handled in startCallSession
    console.log('Call session started:', data);
  }

  /**
   * Report call session ended
   */
  private async reportCallSessionEnded(
    communityId: string,
    data: {
      callSessionId: string;
      durationMinutes: number;
    }
  ): Promise<void> {
    // Already handled in endCallSession
    console.log('Call session ended:', data);
  }
}

// Singleton instance
let botInstance: LandingZoneBot | null = null;

export function getBotInstance(): LandingZoneBot {
  if (!botInstance) {
    botInstance = new LandingZoneBot();
  }
  return botInstance;
}

export { LandingZoneBot };

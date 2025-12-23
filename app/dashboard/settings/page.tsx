'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const sections: Section[] = [
  {
    id: 'privacy',
    label: 'Privacy',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    id: 'account',
    label: 'Account',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'discord',
    label: 'Discord',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.97 12.97 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
  },
  {
    id: 'financial',
    label: 'Financial',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    id: 'voice',
    label: 'Voice/Coaching',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('privacy');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/profiles/me');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <GlassCard>
          <div className="text-center py-12">
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <GlassCard className="p-0">
          <nav className="p-4 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeSection === section.id
                    ? 'glass-button text-gray-900 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/10'
                }`}
              >
                {section.icon}
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </nav>
        </GlassCard>

        {/* Content */}
        <div className="lg:col-span-3">
          <GlassCard>
            {activeSection === 'privacy' && <PrivacySection settings={settings} />}
            {activeSection === 'account' && <AccountSection settings={settings} />}
            {activeSection === 'discord' && <DiscordSection />}
            {activeSection === 'financial' && <FinancialSection />}
            {activeSection === 'notifications' && <NotificationsSection />}
            {activeSection === 'voice' && <VoiceSection />}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function PrivacySection({ settings }: { settings: any }) {
  const privacySettings = settings?.privacy_settings || {};
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Privacy Settings</h2>
      <div className="space-y-4">
        {['email', 'phone', 'intro', 'portfolio', 'rate'].map((field) => (
          <div key={field} className="flex items-center justify-between">
            <div>
              <label className="font-semibold capitalize text-gray-900">{field} visibility</label>
              <p className="text-sm text-gray-600">Control who can see your {field}</p>
            </div>
            <select
              defaultValue={privacySettings[field] || 'public'}
              className="glass-input-enhanced px-4 py-2 rounded-lg"
            >
              <option value="public">Public</option>
              <option value="community">Community</option>
              <option value="private">Private</option>
            </select>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <GlassButton variant="primary">Save Privacy Settings</GlassButton>
      </div>
    </div>
  );
}

function AccountSection({ settings }: { settings: any }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    if (!confirm('Are you absolutely sure? This action cannot be undone!')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: deleteConfirm }),
      });

      if (response.ok) {
        alert('Account deleted. Redirecting to login...');
        window.location.href = '/auth/login';
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Account Info */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-gray-900">Account Information</h3>
        <GlassCard>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-600">Email</label>
              <p className="text-gray-900">{settings?.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Account Created</label>
              <p className="text-gray-900">
                {settings?.created_at ? new Date(settings.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Delete Account */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-red-600">Danger Zone</h3>
        <GlassCard className="border-2 border-red-200">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-red-600 mb-2">Delete Account</h4>
              <p className="text-sm text-gray-600 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
            </div>
            {!showDeleteConfirm ? (
              <GlassButton
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Delete Account
              </GlassButton>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-red-600">
                    Type DELETE to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="glass-input-enhanced w-full px-4 py-2 rounded-lg border-red-300"
                    placeholder="DELETE"
                  />
                </div>
                <div className="flex gap-2">
                  <GlassButton
                    variant="outline"
                    onClick={handleDeleteAccount}
                    disabled={loading || deleteConfirm !== 'DELETE'}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    {loading ? 'Deleting...' : 'Permanently Delete Account'}
                  </GlassButton>
                  <GlassButton
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirm('');
                    }}
                  >
                    Cancel
                  </GlassButton>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function DiscordSection() {
  const [discordStatus, setDiscordStatus] = useState<any>(null);
  const [guilds, setGuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [guildsLoading, setGuildsLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchDiscordStatus();
  }, []);

  useEffect(() => {
    // Only fetch guilds if Discord is connected AND has an access token
    if (discordStatus && discordStatus.access_token) {
      fetchGuilds();
    }
  }, [discordStatus]);

  const fetchDiscordStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/discord/status');
      if (response.ok) {
        const data = await response.json();
        setDiscordStatus(data);
      }
    } catch (error) {
      console.error('Error fetching Discord status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuilds = async () => {
    setGuildsLoading(true);
    try {
      const response = await fetch('/api/discord/guilds');
      if (response.ok) {
        const data = await response.json();
        setGuilds(data.guilds || []);
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error fetching Discord guilds:', error);
        
        // If access token is missing, don't show an alert - we'll show a message in the UI
        if (response.status === 400 && error.code === 'NO_ACCESS_TOKEN') {
          // This will be handled by the UI showing a reconnect message
          setGuilds([]);
        } else if (response.status === 401) {
          alert(error.error || 'Discord token expired. Please reconnect.');
        }
      }
    } catch (error) {
      console.error('Error fetching Discord guilds:', error);
    } finally {
      setGuildsLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/discord/connect');
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Invalid response from server');
          setConnecting(false);
        }
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Discord connect error:', error);
        alert(error.error || error.details || 'Failed to initiate Discord connection');
        setConnecting(false);
      }
    } catch (error: any) {
      console.error('Error connecting Discord:', error);
      alert(`Failed to connect Discord: ${error?.message || 'Unknown error'}`);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Discord account?')) return;

    try {
      const response = await fetch('/api/discord/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setDiscordStatus(null);
        setGuilds([]);
        alert('Discord account disconnected');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to disconnect Discord');
      }
    } catch (error) {
      console.error('Error disconnecting Discord:', error);
      alert('Failed to disconnect Discord');
    }
  };

  const handleCopyLink = () => {
    // Using getlandingzone.com as the default, but this can be changed to sewdiscord.com
    const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://getlandingzone.com'}/signup`;
    navigator.clipboard.writeText(signupUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading Discord status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Discord Integration</h2>

      {discordStatus ? (
        <div className="space-y-6">
          <GlassCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Discord Account Connected</h3>
                  <p className="text-gray-600">
                    Username: <span className="font-medium">{discordStatus.discord_username}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Discord ID: {discordStatus.discord_user_id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {discordStatus.verified ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                      Verified
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                      Not Verified
                    </span>
                  )}
                </div>
              </div>

              {discordStatus.verified && discordStatus.verified_at && (
                <p className="text-sm text-gray-600">
                  Verified on: {new Date(discordStatus.verified_at).toLocaleDateString()}
                </p>
              )}

              {!discordStatus.verified && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800 mb-2">
                    Your Discord account is not yet verified. Verification instructions will be provided here.
                  </p>
                </div>
              )}

              {discordStatus && !discordStatus.access_token && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800 mb-2">
                    Discord tokens are missing. This may happen if tokens expired. 
                    Please log out and log back in with Discord to refresh your tokens.
                  </p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Discord Servers Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Your Discord Servers</h3>
            
            {guildsLoading ? (
              <GlassCard>
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading your Discord servers...</p>
                </div>
              </GlassCard>
            ) : guilds.length === 0 ? (
              <GlassCard>
                <div className="text-center py-8">
                  <p className="text-gray-600">No Discord servers found.</p>
                </div>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {guilds.map((guild) => (
                  <GlassCard key={guild.id}>
                    <div className="flex items-start gap-4">
                      {guild.icon ? (
                        <img
                          src={guild.icon}
                          alt={guild.name}
                          className="w-16 h-16 rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl font-bold text-gray-500">
                            {guild.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{guild.name}</h4>
                          {guild.hasLandingZone ? (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              Landing Zone Installed
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                              Not Set Up
                            </span>
                          )}
                          {guild.owner && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                              Owner
                            </span>
                          )}
                        </div>
                        {guild.hasLandingZone ? (
                          <p className="text-sm text-gray-600">
                            This server has Landing Zone set up. Community: <span className="font-medium">{guild.communityName}</span>
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              Landing Zone is not set up for this server yet.
                            </p>
                            {guild.owner && (
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800 mb-2">
                                  As the server owner, you can set up Landing Zone for this server.
                                </p>
                                <GlassButton
                                  variant="primary"
                                  onClick={() => window.location.href = '/dashboard/communities'}
                                  className="text-sm"
                                >
                                  Set Up Landing Zone
                                </GlassButton>
                              </div>
                            )}
                            {!guild.owner && (
                              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-700 mb-2">
                                  Share this link with your server owner to get Landing Zone set up:
                                </p>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    readOnly
                                    value={`${process.env.NEXT_PUBLIC_APP_URL || 'https://getlandingzone.com'}/signup`}
                                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                                  />
                                  <GlassButton
                                    variant="outline"
                                    onClick={handleCopyLink}
                                    className="text-sm whitespace-nowrap"
                                  >
                                    {copiedLink ? 'Copied!' : 'Copy Link'}
                                  </GlassButton>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <GlassCard>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Your Discord account is connected through login. If you're having issues accessing Discord features, 
              please log out and log back in with Discord to refresh your tokens.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Discord integration is enabled automatically when you log in with Discord.
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function FinancialSection() {
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [escrowHoldings, setEscrowHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [transactionFilter, setTransactionFilter] = useState({
    type: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchFinancialData();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [transactionFilter]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // Get user ID from profile
      const profileRes = await fetch('/api/profiles/me');
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setUserId(profile.id);
      }

      const [balanceRes, payoutsRes, escrowRes] = await Promise.all([
        fetch('/api/tokens/balance'),
        fetch('/api/payouts'),
        fetch('/api/escrow'),
      ]);

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData);
      }

      if (payoutsRes.ok) {
        const payoutsData = await payoutsRes.json();
        setPayouts(payoutsData);
      }

      if (escrowRes.ok) {
        const escrowData = await escrowRes.json();
        setEscrowHoldings(escrowData);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (transactionFilter.type) params.append('type', transactionFilter.type);
      if (transactionFilter.status) params.append('status', transactionFilter.status);
      if (transactionFilter.startDate) params.append('start_date', transactionFilter.startDate);
      if (transactionFilter.endDate) params.append('end_date', transactionFilter.endDate);

      const response = await fetch(`/api/tokens/transactions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading financial data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Token Balance */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-gray-900">Token Balance</h3>
        <GlassCard>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Current Balance</p>
            <p className="text-4xl font-bold text-gray-900">
              {balance?.currency || 'USD'} {balance?.balance_usd?.toFixed(2) || '0.00'}
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-gray-900">Transaction History</h3>
        
        {/* Filters */}
        <GlassCard className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Type</label>
              <select
                value={transactionFilter.type}
                onChange={(e) => setTransactionFilter({ ...transactionFilter, type: e.target.value })}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              >
                <option value="">All Types</option>
                <option value="purchase">Purchase</option>
                <option value="call_payment">Call Payment</option>
                <option value="payout">Payout</option>
                <option value="refund">Refund</option>
                <option value="discount">Discount</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Status</label>
              <select
                value={transactionFilter.status}
                onChange={(e) => setTransactionFilter({ ...transactionFilter, status: e.target.value })}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Start Date</label>
              <input
                type="date"
                value={transactionFilter.startDate}
                onChange={(e) => setTransactionFilter({ ...transactionFilter, startDate: e.target.value })}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">End Date</label>
              <input
                type="date"
                value={transactionFilter.endDate}
                onChange={(e) => setTransactionFilter({ ...transactionFilter, endDate: e.target.value })}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              />
            </div>
          </div>
        </GlassCard>

        {transactions.length === 0 ? (
          <GlassCard>
            <div className="text-center py-8">
              <p className="text-gray-600">No transactions found.</p>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: any) => (
              <GlassCard key={tx.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold capitalize text-gray-900">{tx.type.replace('_', ' ')}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        tx.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {tx.from_profile_id === userId ? '-' : '+'}${tx.amount.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      {tx.from_profile && (
                        <span>From: {tx.from_profile.name}</span>
                      )}
                      {tx.to_profile && (
                        <span>To: {tx.to_profile.name}</span>
                      )}
                      {tx.call_session && (
                        <span>Call Session: {tx.call_session.duration_minutes} min</span>
                      )}
                      <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Payouts (for coaches) */}
      {payouts.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 text-gray-900">Payouts</h3>
          <div className="space-y-2">
            {payouts.map((payout: any) => (
              <GlassCard key={payout.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Net Amount: ${payout.net_amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                      Gross: ${payout.gross_amount.toFixed(2)} | 
                      Fees: ${(payout.community_fee + payout.platform_fee).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(payout.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                    payout.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {payout.status}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Escrow Holdings (for coaches) */}
      {escrowHoldings.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 text-gray-900">Escrow Holdings</h3>
          <div className="space-y-2">
            {escrowHoldings.map((holding: any) => (
              <GlassCard key={holding.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Amount: ${holding.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                      Hold until: {new Date(holding.hold_until).toLocaleDateString()}
                    </p>
                    {holding.call_session?.attendee_profile && (
                      <p className="text-sm text-gray-500">
                        Attendee: {holding.call_session.attendee_profile.name}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    holding.status === 'held' ? 'bg-yellow-100 text-yellow-800' :
                    holding.status === 'released' ? 'bg-green-100 text-green-800' :
                    holding.status === 'disputed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {holding.status}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsSection() {
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (category: string, key: string) => {
    setPreferences({
      ...preferences,
      [category]: {
        ...preferences[category],
        [key]: !preferences[category][key],
      },
    });
  };

  const handleFrequencyChange = (frequency: string) => {
    setPreferences({
      ...preferences,
      frequency,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        alert('Notification preferences saved successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading notification preferences...</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load preferences</p>
      </div>
    );
  }

  const notificationTypes = [
    { key: 'project_applications', label: 'Project Applications' },
    { key: 'review_received', label: 'Review Received' },
    { key: 'endorsement_received', label: 'Endorsement Received' },
    { key: 'payment_received', label: 'Payment Received' },
    { key: 'payout_processed', label: 'Payout Processed' },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>

      {/* Email Notifications */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-gray-900">Email Notifications</h3>
        <GlassCard>
          <div className="space-y-3">
            {notificationTypes.map((type) => (
              <div key={type.key} className="flex items-center justify-between">
                <label className="font-semibold text-gray-900">{type.label}</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email?.[type.key] || false}
                    onChange={() => handleToggle('email', type.key)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm text-gray-600">
                    {preferences.email?.[type.key] ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* In-App Notifications */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-gray-900">In-App Notifications</h3>
        <GlassCard>
          <div className="space-y-3">
            {notificationTypes.map((type) => (
              <div key={type.key} className="flex items-center justify-between">
                <label className="font-semibold text-gray-900">{type.label}</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.in_app?.[type.key] || false}
                    onChange={() => handleToggle('in_app', type.key)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm text-gray-600">
                    {preferences.in_app?.[type.key] ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Frequency */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-gray-900">Notification Frequency</h3>
        <GlassCard>
          <div className="space-y-3">
            {['immediate', 'daily', 'weekly'].map((freq) => (
              <label key={freq} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value={freq}
                  checked={preferences.frequency === freq}
                  onChange={() => handleFrequencyChange(freq)}
                  className="w-5 h-5"
                />
                <span className="font-semibold capitalize text-gray-900">{freq}</span>
                {freq === 'immediate' && (
                  <span className="text-sm text-gray-600">(Receive notifications as they happen)</span>
                )}
                {freq === 'daily' && (
                  <span className="text-sm text-gray-600">(Receive a daily digest)</span>
                )}
                {freq === 'weekly' && (
                  <span className="text-sm text-gray-600">(Receive a weekly summary)</span>
                )}
              </label>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="flex justify-end">
        <GlassButton variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </GlassButton>
      </div>
    </div>
  );
}

function VoiceSection() {
  const [voiceChannels, setVoiceChannels] = useState<any[]>([]);
  const [callSessions, setCallSessions] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionFilter, setSessionFilter] = useState({
    status: '',
    attendeeId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchData();
  }, [userId]);

  useEffect(() => {
    fetchCallSessions();
  }, [sessionFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get user ID from profile
      const profileRes = await fetch('/api/profiles/me');
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setUserId(profile.id);
      }

      const [channelsRes, communitiesRes] = await Promise.all([
        fetch('/api/voice-channels'),
        fetch('/api/communities?member_id=' + userId),
      ]);

      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();
        setVoiceChannels(channelsData);
      }

      if (communitiesRes.ok) {
        const communitiesData = await communitiesRes.json();
        setCommunities(communitiesData.data || communitiesData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCallSessions = async () => {
    try {
      const params = new URLSearchParams();
      if (sessionFilter.status) params.append('status', sessionFilter.status);
      if (sessionFilter.attendeeId) params.append('attendee_id', sessionFilter.attendeeId);
      if (sessionFilter.startDate) params.append('start_date', sessionFilter.startDate);
      if (sessionFilter.endDate) params.append('end_date', sessionFilter.endDate);

      const response = await fetch(`/api/call-sessions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCallSessions(data);
      }
    } catch (error) {
      console.error('Error fetching call sessions:', error);
    }
  };

  const handleAddChannel = async (formData: any) => {
    try {
      const response = await fetch('/api/voice-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchData();
        setShowAddChannel(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create voice channel');
      }
    } catch (error) {
      console.error('Error creating voice channel:', error);
      alert('Failed to create voice channel');
    }
  };

  const handleUpdateChannel = async (id: string, formData: any) => {
    try {
      const response = await fetch(`/api/voice-channels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchData();
        setEditingChannel(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update voice channel');
      }
    } catch (error) {
      console.error('Error updating voice channel:', error);
      alert('Failed to update voice channel');
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voice channel?')) return;

    try {
      const response = await fetch(`/api/voice-channels/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete voice channel');
      }
    } catch (error) {
      console.error('Error deleting voice channel:', error);
      alert('Failed to delete voice channel');
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    await handleUpdateChannel(id, { active });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading voice channels...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Voice Channels */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Voice Channels</h3>
          <GlassButton variant="primary" onClick={() => setShowAddChannel(true)}>
            Create Voice Channel
          </GlassButton>
        </div>

        {voiceChannels.length === 0 ? (
          <GlassCard>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You haven't created any voice channels yet.</p>
              <GlassButton variant="primary" onClick={() => setShowAddChannel(true)}>
                Create Your First Voice Channel
              </GlassButton>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {voiceChannels.map((channel: any) => (
              <GlassCard key={channel.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{channel.channel_name}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        channel.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {channel.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">
                      Community: {channel.community?.name || 'Unknown'}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      ${channel.billing_rate_per_hour.toFixed(2)}/hour
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Discord Channel ID: {channel.discord_channel_id}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <GlassButton
                      variant="outline"
                      onClick={() => handleToggleActive(channel.id, !channel.active)}
                      className="text-sm py-2 px-4"
                    >
                      {channel.active ? 'Deactivate' : 'Activate'}
                    </GlassButton>
                    <GlassButton
                      variant="outline"
                      onClick={() => setEditingChannel(channel)}
                      className="text-sm py-2 px-4"
                    >
                      Edit
                    </GlassButton>
                    <GlassButton
                      variant="outline"
                      onClick={() => handleDeleteChannel(channel.id)}
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

      {/* Call Sessions History */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-gray-900">Call Sessions History</h3>

        {/* Filters */}
        <GlassCard className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Status</label>
              <select
                value={sessionFilter.status}
                onChange={(e) => setSessionFilter({ ...sessionFilter, status: e.target.value })}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="terminated">Terminated</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Start Date</label>
              <input
                type="date"
                value={sessionFilter.startDate}
                onChange={(e) => setSessionFilter({ ...sessionFilter, startDate: e.target.value })}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">End Date</label>
              <input
                type="date"
                value={sessionFilter.endDate}
                onChange={(e) => setSessionFilter({ ...sessionFilter, endDate: e.target.value })}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <GlassButton
                variant="outline"
                onClick={() => setSessionFilter({ status: '', attendeeId: '', startDate: '', endDate: '' })}
              >
                Clear Filters
              </GlassButton>
            </div>
          </div>
        </GlassCard>

        {callSessions.length === 0 ? (
          <GlassCard>
            <div className="text-center py-8">
              <p className="text-gray-600">No call sessions found.</p>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {callSessions.map((session: any) => (
              <GlassCard key={session.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">{session.voice_channel?.channel_name || 'Unknown Channel'}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        session.status === 'terminated' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {session.coach_profile_id === userId ? (
                        <span>Attendee: {session.attendee_profile?.name || 'Unknown'}</span>
                      ) : (
                        <span>Coach: {session.coach_profile?.name || 'Unknown'}</span>
                      )}
                      <span>Duration: {session.duration_minutes || 0} min</span>
                      <span>Cost: ${session.total_cost?.toFixed(2) || '0.00'}</span>
                      <span>{new Date(session.started_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {showAddChannel && (
        <VoiceChannelModal
          communities={communities}
          onSave={handleAddChannel}
          onClose={() => setShowAddChannel(false)}
        />
      )}

      {editingChannel && (
        <VoiceChannelModal
          communities={communities}
          channel={editingChannel}
          onSave={(formData) => handleUpdateChannel(editingChannel.id, formData)}
          onClose={() => setEditingChannel(null)}
        />
      )}
    </div>
  );
}

function VoiceChannelModal({
  communities,
  channel,
  onSave,
  onClose,
}: {
  communities: any[];
  channel?: any;
  onSave: (formData: any) => void;
  onClose: () => void;
}) {
  const [communityId, setCommunityId] = useState(channel?.community_id || '');
  const [discordChannelId, setDiscordChannelId] = useState(channel?.discord_channel_id || '');
  const [channelName, setChannelName] = useState(channel?.channel_name || '');
  const [billingRate, setBillingRate] = useState(channel?.billing_rate_per_hour?.toString() || '');
  const [active, setActive] = useState(channel?.active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!communityId || !discordChannelId || !channelName || !billingRate) {
      alert('All fields are required');
      return;
    }

    onSave({
      community_id: communityId,
      discord_channel_id: discordChannelId,
      channel_name: channelName,
      billing_rate_per_hour: parseFloat(billingRate),
      active: channel ? active : true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">{channel ? 'Edit Voice Channel' : 'Create Voice Channel'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">Community *</label>
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              required
              disabled={!!channel}
            >
              <option value="">Select community</option>
              {communities.map((comm) => (
                <option key={comm.id} value={comm.id}>
                  {comm.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">Discord Channel ID *</label>
            <input
              type="text"
              value={discordChannelId}
              onChange={(e) => setDiscordChannelId(e.target.value)}
              className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              placeholder="123456789012345678"
              required
              disabled={!!channel}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">Channel Name *</label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              placeholder="Coaching Channel"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">Billing Rate Per Hour (USD) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={billingRate}
              onChange={(e) => setBillingRate(e.target.value)}
              className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              placeholder="50.00"
              required
            />
          </div>

          {channel && (
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="font-semibold text-gray-900">Active</span>
              </label>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <GlassButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary">
              {channel ? 'Update' : 'Create'} Channel
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
}

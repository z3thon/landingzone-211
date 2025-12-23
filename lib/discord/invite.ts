/**
 * Discord Bot Invite URL Generator
 * 
 * Generates the invite URL for the Discord bot with proper permissions.
 * Permission integer 8 = Administrator (required for creating channels and managing permissions)
 */

export function generateBotInviteUrl(clientId: string): string {
  const permissions = '8'; // Administrator permission
  const scopes = ['bot'];
  
  return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scopes.join('%20')}`;
}

/**
 * Permission flags breakdown:
 * - 8 = Administrator (includes all permissions)
 * 
 * Individual permissions that would be needed (but admin covers all):
 * - 16 = Manage Channels
 * - 1048576 = Manage Roles
 * - 32 = View Channels
 * - 1048576 = Connect (Voice)
 * - 16777216 = Move Members
 * 
 * Using admin (8) is simpler and ensures bot has all necessary permissions.
 */

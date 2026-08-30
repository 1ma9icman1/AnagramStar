import { DiscordSDK } from '@discord/embedded-app-sdk';

// Discord client ID from application (can be read from URL params or hardcoded default)
const queryParams = new URLSearchParams(window.location.search);
const clientId = queryParams.get('client_id') || '1542605910298460160';

let discordSdkInstance: DiscordSDK | null = null;
let isInitialized = false;

export async function initDiscordSdk(): Promise<{
  inDiscord: boolean;
  user?: { id: string; username: string; avatarUrl?: string; discriminator?: string };
}> {
  // Check if we are inside Discord's iframe environment or query params provide info
  const discordUsernameParam = queryParams.get('username') || queryParams.get('user') || queryParams.get('discord_user');
  const discordAvatarParam = queryParams.get('avatar');
  const discordIdParam = queryParams.get('user_id') || queryParams.get('id');

  const isInsideDiscordIframe =
    window.location.hostname.includes('discordsays.com') ||
    Boolean(queryParams.get('frame_id')) ||
    Boolean(queryParams.get('instance_id')) ||
    Boolean(discordUsernameParam);

  // If query parameters already have the player's Discord username
  if (discordUsernameParam) {
    return {
      inDiscord: true,
      user: {
        id: discordIdParam || 'discord-player',
        username: discordUsernameParam,
        avatarUrl: discordAvatarParam || undefined,
      },
    };
  }

  if (!isInsideDiscordIframe) {
    return { inDiscord: false };
  }

  try {
    if (!discordSdkInstance) {
      discordSdkInstance = new DiscordSDK(clientId);
    }

    if (!isInitialized) {
      // Promise with timeout to prevent hanging
      const readyPromise = discordSdkInstance.ready();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Discord SDK ready timeout')), 4000)
      );

      await Promise.race([readyPromise, timeoutPromise]);
      isInitialized = true;
    }

    // Try extracting user info from discord sdk instance or auth context if available
    let detectedName = 'Discord Player';
    let detectedId = discordSdkInstance.instanceId || 'discord-user';
    let avatarUrl: string | undefined = undefined;

    // Check discordSdk user info properties
    const sdkAny = discordSdkInstance as any;
    if (sdkAny.user?.username || sdkAny.user?.global_name) {
      detectedName = sdkAny.user.global_name || sdkAny.user.username;
      detectedId = sdkAny.user.id || detectedId;
      if (sdkAny.user.avatar) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${sdkAny.user.id}/${sdkAny.user.avatar}.png`;
      }
    } else if (sdkAny.currentUser?.username || sdkAny.currentUser?.global_name) {
      detectedName = sdkAny.currentUser.global_name || sdkAny.currentUser.username;
      detectedId = sdkAny.currentUser.id || detectedId;
      if (sdkAny.currentUser.avatar) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${sdkAny.currentUser.id}/${sdkAny.currentUser.avatar}.png`;
      }
    }

    return {
      inDiscord: true,
      user: {
        id: detectedId,
        username: detectedName,
        avatarUrl,
      },
    };
  } catch (err) {
    console.warn('Discord SDK initialization skipped or timed out:', err);
    return {
      inDiscord: isInsideDiscordIframe,
      user: discordUsernameParam
        ? { id: 'discord-player', username: discordUsernameParam }
        : undefined,
    };
  }
}

export function getDiscordSdk(): DiscordSDK | null {
  return discordSdkInstance;
}

export async function openDiscordInviteDialog(): Promise<boolean> {
  if (discordSdkInstance && isInitialized) {
    try {
      // Discord SDK built-in invite picker dialog
      if (discordSdkInstance.commands && typeof (discordSdkInstance.commands as any).openInviteDialog === 'function') {
        await (discordSdkInstance.commands as any).openInviteDialog();
        return true;
      }
    } catch (err) {
      console.warn('Discord SDK openInviteDialog failed:', err);
    }
  }
  return false;
}

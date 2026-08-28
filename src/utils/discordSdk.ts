import { DiscordSDK } from '@discord/embedded-app-sdk';

// Discord client ID from application (can be read from URL params or hardcoded default)
const queryParams = new URLSearchParams(window.location.search);
const clientId = queryParams.get('client_id') || '1542605910298460160';

let discordSdkInstance: DiscordSDK | null = null;
let isInitialized = false;

export async function initDiscordSdk(): Promise<{
  inDiscord: boolean;
  user?: { id: string; username: string; avatarUrl?: string };
}> {
  // Check if we are inside Discord's iframe environment
  const isInsideDiscordIframe =
    window.location.hostname.includes('discordsays.com') ||
    Boolean(queryParams.get('frame_id')) ||
    Boolean(queryParams.get('instance_id'));

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

    return {
      inDiscord: true,
      user: {
        id: discordSdkInstance.instanceId || 'discord-player',
        username: 'Discord Player',
      },
    };
  } catch (err) {
    console.warn('Discord SDK initialization skipped or timed out:', err);
    return { inDiscord: isInsideDiscordIframe };
  }
}

export function getDiscordSdk(): DiscordSDK | null {
  return discordSdkInstance;
}

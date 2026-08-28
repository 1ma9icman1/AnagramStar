import { calculateWordScore } from './dictionary';
import { PlayerProfile, SubmittedWord } from '../types/game';

export interface BotPreset {
  id: string;
  name: string;
  avatar: string;
  avatarBg: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Master';
  description: string;
  speedMin: number; // ms between words
  speedMax: number;
  wordCountRatio: number; // % of total valid words it finds
  preferLongWords: boolean;
}

export const DISCORD_BOTS: BotPreset[] = [
  {
    id: 'wumpus',
    name: 'Wumpus',
    avatar: '👾',
    avatarBg: '#5865F2',
    difficulty: 'Easy',
    description: 'Casual Discord mascot. Plays relaxed and finds mostly 3-4 letter words.',
    speedMin: 5000,
    speedMax: 9000,
    wordCountRatio: 0.25,
    preferLongWords: false,
  },
  {
    id: 'clyde',
    name: 'Clyde',
    avatar: '🤖',
    avatarBg: '#3BA55C',
    difficulty: 'Medium',
    description: 'Helpful AI bot. Quick at spotting 4-5 letter combos.',
    speedMin: 3500,
    speedMax: 6500,
    wordCountRatio: 0.45,
    preferLongWords: false,
  },
  {
    id: 'mee6',
    name: 'Mee6',
    avatar: '🛡️',
    avatarBg: '#FAA61A',
    difficulty: 'Hard',
    description: 'High-level server guardian. Fast typist with high vocabulary.',
    speedMin: 2200,
    speedMax: 4500,
    wordCountRatio: 0.70,
    preferLongWords: true,
  },
  {
    id: 'grandmaster',
    name: 'Word Master AI',
    avatar: '👑',
    avatarBg: '#EB459E',
    difficulty: 'Master',
    description: 'Unbeatable dictionary savant. Finds almost every anagram in seconds!',
    speedMin: 1200,
    speedMax: 2500,
    wordCountRatio: 0.92,
    preferLongWords: true,
  },
];

export function getBotFoundWords(bot: BotPreset, allValidWords: string[]): SubmittedWord[] {
  // Determine how many words this bot will find
  const count = Math.max(3, Math.floor(allValidWords.length * bot.wordCountRatio));
  
  // Sort candidate words based on preference
  let pool = [...allValidWords];
  if (bot.preferLongWords) {
    pool.sort((a, b) => b.length - a.length || Math.random() - 0.5);
  } else {
    // Bias towards shorter words for easy bots
    pool.sort((a, b) => a.length - b.length || Math.random() - 0.5);
  }

  const selected = pool.slice(0, count);
  // Sort found words by score descending just like GamePigeon
  return selected
    .map(w => ({
      word: w,
      score: calculateWordScore(w),
      length: w.length,
      timestamp: Date.now(),
    }))
    .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));
}

// Generate Discord formatted shareable text
export function generateDiscordShareText(
  player: PlayerProfile,
  score: number,
  words: SubmittedWord[],
  root: string,
  opponentScore?: number,
  opponentName?: string
): string {
  const lettersEmoji = root
    .toUpperCase()
    .split('')
    .map(ch => `:${ch.toLowerCase()}:`)
    .join(' ');

  const bestWord = words.length > 0 ? words[0] : null;
  const bestWordText = bestWord ? `⭐ **Best Word:** \`${bestWord.word}\` (+${bestWord.score} pts)` : '';
  
  let outcomeText = `🏆 **Score:** **${score.toLocaleString()}** pts (${words.length} words)`;
  if (opponentScore !== undefined && opponentName) {
    if (score > opponentScore) {
      outcomeText += `\n👑 **VICTORY** against **${opponentName}** (${opponentScore.toLocaleString()} pts)!`;
    } else if (score < opponentScore) {
      outcomeText += `\n💔 Defeated by **${opponentName}** (${opponentScore.toLocaleString()} pts)...`;
    } else {
      outcomeText += `\n🤝 **TIED** with **${opponentName}** (${opponentScore.toLocaleString()} pts)!`;
    }
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return [
    `🎮 **GAMEPIGEON ANAGRAMS BATTLE** 🎮`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 **Player:** **${player.name}**`,
    outcomeText,
    bestWordText,
    `🔤 **Letters:** ${lettersEmoji}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🔥 *Think you can beat my score? Play the same board here:*`,
    `🔗 ${shareUrl}`,
  ]
    .filter(Boolean)
    .join('\n');
}

// Encode match data into URL query parameter
export function encodeMatchShareUrl(root: string, score: number, wordsCount: number, playerName: string): string {
  if (typeof window === 'undefined') return '';
  const payload = {
    r: root,
    s: score,
    w: wordsCount,
    p: playerName,
    t: Date.now(),
  };
  const str = btoa(JSON.stringify(payload));
  const url = new URL(window.location.href);
  url.searchParams.set('challenge', str);
  return url.toString();
}

// Decode challenge from URL
export function decodeMatchChallenge(): { root: string; score: number; wordsCount: number; playerName: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('challenge');
    if (!code) return null;
    const json = JSON.parse(atob(code));
    if (json.r && typeof json.s === 'number') {
      return {
        root: json.r,
        score: json.s,
        wordsCount: json.w || 0,
        playerName: json.p || 'Challenger',
      };
    }
  } catch {
    // Malformed challenge
  }
  return null;
}

const STORAGE_KEY_PROFILE = 'gp_anagrams_profile_v1';
const STORAGE_KEY_SETTINGS = 'gp_anagrams_settings_v1';

export function loadSavedProfile(): PlayerProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (data) return JSON.parse(data);
  } catch {}
  return {
    name: 'You',
    avatarEmoji: '😎',
    avatarColor: '#5865F2',
    gamesPlayed: 0,
    highestScore: 0,
    totalWordsFound: 0,
  };
}

export function saveProfile(profile: PlayerProfile) {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  } catch {}
}

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
    id: 'trinity',
    name: 'Trinity.exe',
    avatar: '🕶️',
    avatarBg: '#052e16',
    difficulty: 'Easy',
    description: 'Matrix navigator. Deciphers fast 3-4 character password combos.',
    speedMin: 4500,
    speedMax: 8000,
    wordCountRatio: 0.28,
    preferLongWords: false,
  },
  {
    id: 'cypher',
    name: 'Cypher Daemon',
    avatar: '💻',
    avatarBg: '#0f172a',
    difficulty: 'Medium',
    description: 'Subnet crawler. Extracts 4-5 letter cryptograms with lethal speed.',
    speedMin: 3200,
    speedMax: 6000,
    wordCountRatio: 0.50,
    preferLongWords: false,
  },
  {
    id: 'morpheus',
    name: 'Morpheus AI',
    avatar: '💊',
    avatarBg: '#1e1b4b',
    difficulty: 'Hard',
    description: 'Nebuchadnezzar Captain. Cracks mainframe encryption buffers effortlessly.',
    speedMin: 2000,
    speedMax: 4000,
    wordCountRatio: 0.75,
    preferLongWords: true,
  },
  {
    id: 'agent_smith',
    name: 'Agent Smith',
    avatar: '🕴️',
    avatarBg: '#450a0a',
    difficulty: 'Master',
    description: 'System Sentinel. The ultimate firewall algorithm that computes every permutation.',
    speedMin: 1000,
    speedMax: 2200,
    wordCountRatio: 0.94,
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
    `🟢 **MATRIX CIPHER DECRYPTION DUEL** 🟢`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `⚡ **Operator:** **${player.name}**`,
    outcomeText,
    bestWordText,
    `💾 **Target Payload:** ${lettersEmoji}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💻 *Jack into the mainframe and crack this anagram seed:*`,
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

const STORAGE_KEY_PROFILE = 'matrix_anagrams_profile_v2';
const STORAGE_KEY_SETTINGS = 'matrix_anagrams_settings_v2';

export function loadSavedProfile(): PlayerProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (data) return JSON.parse(data);
  } catch {}
  return {
    name: 'Neo',
    avatarEmoji: '🕶️',
    avatarColor: '#052e16',
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

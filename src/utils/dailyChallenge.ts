import { PUZZLE_ROOTS, findAllValidAnagrams, calculateWordScore } from './dictionary';

export interface DailyChallengeInfo {
  dateKey: string; // "YYYY-MM-DD"
  dayNumber: number; // e.g. 242
  dateFormatted: string; // "Aug 30, 2026"
  fullDateFormatted: string; // "Sunday, August 30, 2026"
  root: string;
  rootWord: string;
  scrambled: string;
  allValidWords: string[];
  maxScore: number;
  totalPossibleWords: number;
  wordLength: 6 | 7;
  puzzle: {
    root: string;
    scrambled: string;
    allValidWords: string[];
    maxScore: number;
  };
}

export interface DailyChallengeRecord {
  dateKey: string;
  completed: boolean;
  score: number;
  wordCount: number;
  bestWord: string;
  timestamp: number;
}

// Format local or specified Date into "YYYY-MM-DD"
export function getTodayDateKey(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calculate Day Number from a fixed epoch (Jan 1, 2026 = Day #1)
export function getDayChallengeNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const epoch = new Date(2026, 0, 1);
  const diffTime = targetDate.getTime() - epoch.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diffDays, 1);
}

// Format human friendly date string
export function formatDailyDate(dateKey: string): { short: string; full: string } {
  const [year, month, day] = dateKey.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  
  const short = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const full = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return { short, full };
}

// Get time remaining until next daily challenge reset (midnight)
export function getTimeUntilDailyReset(): { hours: number; minutes: number; seconds: number; formatted: string } {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();

  const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const formatted = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

  return { hours, minutes, seconds, formatted };
}

// Fast string hash generator for deterministic seed
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Linear Congruential PRNG
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Fetch or generate the deterministic daily challenge for a given date
export function getDailyChallenge(dateKey = getTodayDateKey()): DailyChallengeInfo {
  const seed = hashString(`anagrams-daily-puzzle-seed-${dateKey}`);
  const rng = seededRandom(seed);

  // Filter 6 and 7 letter roots
  const roots = PUZZLE_ROOTS;
  const rootIndex = Math.floor(rng() * roots.length);
  const root = roots[rootIndex] || 'PLANET';
  const wordLength = (root.length === 7 ? 7 : 6) as 6 | 7;

  // Deterministically scramble letters with seeded PRNG
  const letters = root.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  // Ensure scrambled is distinct from root
  if (letters.join('') === root && letters.length > 2) {
    [letters[0], letters[letters.length - 1]] = [letters[letters.length - 1], letters[0]];
  }

  const scrambled = letters.join('');
  const allValidWords = findAllValidAnagrams(root);
  const maxScore = allValidWords.reduce((sum, w) => sum + calculateWordScore(w), 0);

  const dayNumber = getDayChallengeNumber(dateKey);
  const { short, full } = formatDailyDate(dateKey);

  return {
    dateKey,
    dayNumber,
    dateFormatted: short,
    fullDateFormatted: full,
    root,
    rootWord: root,
    scrambled,
    allValidWords,
    maxScore,
    totalPossibleWords: allValidWords.length,
    wordLength,
    puzzle: {
      root,
      scrambled,
      allValidWords,
      maxScore,
    },
  };
}

// Local storage helpers for player's daily progress
const DAILY_RECORD_PREFIX = 'anagram_daily_record_';

export function getDailyRecord(dateKey = getTodayDateKey()): DailyChallengeRecord | null {
  try {
    const raw = localStorage.getItem(`${DAILY_RECORD_PREFIX}${dateKey}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

export const getDailyChallengeRecord = getDailyRecord;

export function saveDailyRecord(
  dateKey: string,
  score: number,
  wordCount: number,
  bestWord: string
): DailyChallengeRecord {
  const record: DailyChallengeRecord = {
    dateKey,
    completed: true,
    score,
    wordCount,
    bestWord,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(`${DAILY_RECORD_PREFIX}${dateKey}`, JSON.stringify(record));
  } catch {}

  return record;
}

export const saveDailyChallengeRecord = saveDailyRecord;

// Generate clipboard-shareable score text for Daily Challenge
export function generateDailyShareText(
  dayNumber: number,
  dateFormatted: string,
  score: number,
  wordCount: number,
  bestWord: string
): string {
  const medals = score >= 3000 ? '🥇' : score >= 2000 ? '🥈' : score >= 1000 ? '🥉' : '🔤';
  return `${medals} Anagrams Daily Challenge #${dayNumber} (${dateFormatted})\n🏆 Score: ${score.toLocaleString()} pts\n📝 Words Found: ${wordCount}\n⭐ Best Word: ${bestWord || 'None'}\nPlay today's daily puzzle on Anagrams!`;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  avatarEmoji: string;
  avatarUrl?: string;
  score: number;
  wordCount: number;
  rootWord: string;
  bestWord?: string;
  timestamp: number;
  source: 'discord' | 'web';
  dateKey?: string;
}

const LOCAL_STORAGE_KEY = 'anagramstar_high_scores_v1';
const DAILY_STORAGE_PREFIX = 'anagramstar_daily_scores_';

// Seed entries so global leaderboard is vibrant right from the start
const INITIAL_SEEDS: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    playerName: 'ma9ic',
    avatarEmoji: '🧙‍♂️',
    score: 3400,
    wordCount: 18,
    rootWord: 'PLANET',
    bestWord: 'PLANET',
    timestamp: Date.now() - 3600000 * 2,
    source: 'discord',
  },
  {
    id: 'seed-2',
    playerName: 'Trinity',
    avatarEmoji: '🕶️',
    score: 2800,
    wordCount: 14,
    rootWord: 'STREAM',
    bestWord: 'MASTER',
    timestamp: Date.now() - 3600000 * 6,
    source: 'web',
  },
  {
    id: 'seed-3',
    playerName: 'Cipher',
    avatarEmoji: '💻',
    score: 2200,
    wordCount: 11,
    rootWord: 'CASTLE',
    bestWord: 'CASTLE',
    timestamp: Date.now() - 3600000 * 12,
    source: 'discord',
  },
  {
    id: 'seed-4',
    playerName: 'RetroGamer',
    avatarEmoji: '👾',
    score: 1600,
    wordCount: 8,
    rootWord: 'WASPRL',
    bestWord: 'SPRAWL',
    timestamp: Date.now() - 3600000 * 24,
    source: 'web',
  },
];

// Generate dynamic daily challenge seeds based on today's date
export function generateDailySeeds(dateKey: string, rootWord = 'PLANET'): LeaderboardEntry[] {
  return [
    {
      id: `daily-seed-1-${dateKey}`,
      playerName: 'ma9ic',
      avatarEmoji: '🧙‍♂️',
      score: 3200,
      wordCount: 16,
      rootWord,
      bestWord: rootWord,
      timestamp: Date.now() - 3600000 * 1.5,
      source: 'discord',
      dateKey,
    },
    {
      id: `daily-seed-2-${dateKey}`,
      playerName: 'Nova',
      avatarEmoji: '✨',
      score: 2600,
      wordCount: 13,
      rootWord,
      bestWord: rootWord,
      timestamp: Date.now() - 3600000 * 4,
      source: 'web',
      dateKey,
    },
    {
      id: `daily-seed-3-${dateKey}`,
      playerName: 'Echo',
      avatarEmoji: '🛰️',
      score: 1900,
      wordCount: 10,
      rootWord,
      bestWord: rootWord.substring(0, 5) || rootWord,
      timestamp: Date.now() - 3600000 * 7,
      source: 'discord',
      dateKey,
    },
    {
      id: `daily-seed-4-${dateKey}`,
      playerName: 'PixelFox',
      avatarEmoji: '🦊',
      score: 1400,
      wordCount: 7,
      rootWord,
      bestWord: rootWord.substring(0, 4) || rootWord,
      timestamp: Date.now() - 3600000 * 9,
      source: 'web',
      dateKey,
    },
  ];
}

export async function getHighScores(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch('/api/highscores');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.highScores) && data.highScores.length > 0) {
        return data.highScores;
      }
    }
  } catch (err) {
    console.warn('Could not fetch server high scores, falling back to local storage:', err);
  }

  // Fallback to localStorage
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      return JSON.parse(local);
    }
  } catch {}

  return INITIAL_SEEDS;
}

export async function submitHighScore(entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>): Promise<LeaderboardEntry[]> {
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: `score-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };

  // 1. Try submitting to server API datastore
  try {
    const res = await fetch('/api/highscores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.highScores)) {
        // Also cache locally
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.highScores));
        } catch {}
        return data.highScores;
      }
    }
  } catch (err) {
    console.warn('Could not save high score to server datastore:', err);
  }

  // 2. Fallback: Save to LocalStorage
  try {
    const current = await getHighScores();
    const updated = [newEntry, ...current]
      .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
      .slice(0, 50);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [newEntry];
  }
}

// -------------------------------------------------------------
// DAILY CHALLENGE LEADERBOARD
// -------------------------------------------------------------

export async function getDailyLeaderboard(dateKey: string, rootWord = 'PLANET'): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`/api/daily-leaderboard?date=${encodeURIComponent(dateKey)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.leaderboard) && data.leaderboard.length > 0) {
        return data.leaderboard;
      }
    }
  } catch (err) {
    console.warn('Could not fetch server daily leaderboard:', err);
  }

  // Fallback to local storage for today
  try {
    const local = localStorage.getItem(`${DAILY_STORAGE_PREFIX}${dateKey}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // Return initial daily seeds for this date
  return generateDailySeeds(dateKey, rootWord);
}

export async function submitDailyHighScore(
  dateKeyOrEntry: string | (Omit<LeaderboardEntry, 'id' | 'timestamp'> & { dateKey: string }),
  maybeEntry?: Omit<LeaderboardEntry, 'id' | 'timestamp'>
): Promise<LeaderboardEntry[]> {
  const entry = typeof dateKeyOrEntry === 'string'
    ? { ...maybeEntry!, dateKey: dateKeyOrEntry }
    : dateKeyOrEntry;
  const dateKey = entry.dateKey;
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: `daily-score-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };

  // 1. Try server submit
  try {
    const res = await fetch('/api/daily-leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.leaderboard)) {
        try {
          localStorage.setItem(`${DAILY_STORAGE_PREFIX}${dateKey}`, JSON.stringify(data.leaderboard));
        } catch {}
        return data.leaderboard;
      }
    }
  } catch (err) {
    console.warn('Could not submit daily score to server:', err);
  }

  // 2. Fallback to localStorage
  try {
    const current = await getDailyLeaderboard(dateKey, entry.rootWord);
    // Replace if same player already had an entry or append
    const filtered = current.filter(
      (item) => !(item.playerName.toLowerCase() === entry.playerName.toLowerCase() && item.source === entry.source)
    );
    const updated = [newEntry, ...filtered]
      .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
      .slice(0, 50);
    localStorage.setItem(`${DAILY_STORAGE_PREFIX}${dateKey}`, JSON.stringify(updated));
    return updated;
  } catch {
    return [newEntry];
  }
}

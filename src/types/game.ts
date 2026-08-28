export interface TileLetter {
  id: string;
  letter: string;
  originalIndex: number;
}

export interface SubmittedWord {
  word: string;
  score: number;
  length: number;
  timestamp: number;
}

export type GameState = 'lobby' | 'playing' | 'round_over' | 'results';

export type OpponentType = 'bot' | 'friend_async' | 'local_pass_play' | 'solo';

export interface Opponent {
  id: string;
  name: string;
  avatarUrl: string;
  avatarEmoji?: string;
  score: number;
  words: SubmittedWord[];
  isReady: boolean;
  statusText?: string;
}

export interface GameSettings {
  roundDuration: number; // in seconds, default 60
  wordLength: 6 | 7;
  soundEnabled: boolean;
  hapticFeedback: boolean;
  vibration: boolean;
}

export interface PlayerProfile {
  name: string;
  avatarEmoji: string;
  avatarColor: string;
  customAvatarUrl?: string;
  gamesPlayed: number;
  highestScore: number;
  totalWordsFound: number;
}

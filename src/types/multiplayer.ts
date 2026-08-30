import { GameSettings, PlayerProfile, SubmittedWord } from './game';

export type RoomStatus = 'waiting' | 'starting' | 'playing' | 'results';

export interface RoomPlayer {
  id: string;
  name: string;
  avatarEmoji: string;
  avatarColor: string;
  avatarUrl?: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  wordCount: number;
  latestWord?: string;
  latestWordScore?: number;
  words: SubmittedWord[];
  isFinished: boolean;
}

export interface RoomState {
  code: string;
  hostId: string;
  status: RoomStatus;
  players: RoomPlayer[];
  settings: GameSettings;
  puzzle: {
    root: string;
    scrambled: string;
    allValidWords: string[];
    maxScore: number;
  } | null;
  countdown: number;
  startedAt: number | null;
  winnerId: string | null;
}

export interface OpponentLiveUpdate {
  playerId: string;
  playerName: string;
  totalScore: number;
  wordCount: number;
  latestWord?: string;
  latestWordScore?: number;
}

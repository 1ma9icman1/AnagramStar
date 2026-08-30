import React, { useState, forwardRef, useImperativeHandle, useCallback, useEffect } from 'react';
import { WoodTile } from './WoodTile';
import { PlayerProfile, GameSettings, AppSkin } from '../types/game';
import { DISCORD_BOTS, BotPreset } from '../utils/discord';
import { sound } from '../utils/sound';
import { DailyChallengeInfo, DailyChallengeRecord, getTimeUntilDailyReset } from '../utils/dailyChallenge';

export interface LobbyViewHandle {
  handleAPress: () => void;
  handleBPress: () => void;
  handleSelectPress: () => void;
  handleStartPress: () => void;
  handleDpadPress: (dir: 'up' | 'down' | 'left' | 'right') => void;
}

interface LobbyViewProps {
  playerProfile: PlayerProfile;
  settings: GameSettings;
  incomingChallenge?: {
    challengerName: string;
    score: number;
    wordLength: number;
  } | null;
  onStartSolo: () => void;
  onStartBotMatch: (bot: BotPreset) => void;
  onStartPassPlay: (p1Name?: string, p2Name?: string) => void;
  onStartDailyChallenge?: () => void;
  onOpenDailyLeaderboard?: () => void;
  dailyInfo?: DailyChallengeInfo | null;
  dailyRecord?: DailyChallengeRecord | null;
  onOpenDiscordInvite: () => void;
  onAcceptIncomingChallenge?: () => void;
  onOpenProfile: () => void;
  onOpenHighScores?: () => void;
  onOpenSecretMenu?: () => void;
  isMa9icUnlocked?: boolean;
  onUpdateSettings: (settings: GameSettings) => void;
  onLoadChallenge: (code: string) => void;
  onOpenTwoPlayer?: (initialRoomCode?: string) => void;
  skin?: AppSkin;
}

export const LobbyView = forwardRef<LobbyViewHandle, LobbyViewProps>(({
  playerProfile,
  settings,
  incomingChallenge,
  onStartSolo,
  onStartBotMatch,
  onStartPassPlay,
  onStartDailyChallenge,
  onOpenDailyLeaderboard,
  dailyInfo,
  dailyRecord,
  onOpenDiscordInvite,
  onAcceptIncomingChallenge,
  onOpenProfile,
  onOpenHighScores,
  onOpenSecretMenu,
  isMa9icUnlocked = false,
  onUpdateSettings,
  onLoadChallenge,
  onOpenTwoPlayer,
  skin = 'gameboy',
}, ref) => {
  const isCyber = skin === 'cyber';
  const isNormal = skin === 'normal';
  const [activeTab, setActiveTab] = useState<'play' | 'bots' | 'pass_play' | 'settings'>('play');
  const [challengeInput, setChallengeInput] = useState('');
  const [selectedBot, setSelectedBot] = useState<BotPreset>(DISCORD_BOTS[0]);
  const [p1Callsign, setP1Callsign] = useState(playerProfile.name || 'P1');
  const [p2Callsign, setP2Callsign] = useState('P2');
  const [resetCountdown, setResetCountdown] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const { formatted } = getTimeUntilDailyReset();
      setResetCountdown(formatted);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabs: ('play' | 'bots' | 'pass_play' | 'settings')[] = ['play', 'bots', 'pass_play', 'settings'];

  const handleAPress = useCallback(() => {
    if (incomingChallenge && onAcceptIncomingChallenge) {
      onAcceptIncomingChallenge();
      return;
    }
    if (activeTab === 'play') {
      onStartSolo();
    } else if (activeTab === 'bots') {
      onStartBotMatch(selectedBot);
    } else if (activeTab === 'pass_play') {
      onStartPassPlay(p1Callsign, p2Callsign);
    } else if (activeTab === 'settings') {
      onOpenProfile();
    }
  }, [incomingChallenge, onAcceptIncomingChallenge, activeTab, onStartSolo, onStartBotMatch, selectedBot, onStartPassPlay, p1Callsign, p2Callsign, onOpenProfile]);

  const handleBPress = useCallback(() => {
    setActiveTab('play');
  }, []);

  const handleSelectPress = useCallback(() => {
    sound.playButtonClick();
    setActiveTab((prev) => {
      const idx = tabs.indexOf(prev);
      const next = tabs[(idx + 1) % tabs.length];
      return next;
    });
  }, [tabs]);

  const handleStartPress = useCallback(() => {
    handleAPress();
  }, [handleAPress]);

  const handleDpadPress = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (dir === 'left') {
      sound.playButtonClick();
      setActiveTab((prev) => {
        const idx = tabs.indexOf(prev);
        const next = tabs[(idx - 1 + tabs.length) % tabs.length];
        return next;
      });
    } else if (dir === 'right') {
      sound.playButtonClick();
      setActiveTab((prev) => {
        const idx = tabs.indexOf(prev);
        const next = tabs[(idx + 1) % tabs.length];
        return next;
      });
    } else if (dir === 'up' || dir === 'down') {
      if (activeTab === 'bots') {
        sound.playButtonClick();
        setSelectedBot((prev) => {
          const idx = DISCORD_BOTS.findIndex((b) => b.id === prev.id);
          const delta = dir === 'up' ? -1 : 1;
          const nextIdx = (idx + delta + DISCORD_BOTS.length) % DISCORD_BOTS.length;
          return DISCORD_BOTS[nextIdx];
        });
      }
    }
  }, [activeTab, tabs]);

  useImperativeHandle(ref, () => ({
    handleAPress,
    handleBPress,
    handleSelectPress,
    handleStartPress,
    handleDpadPress,
  }), [handleAPress, handleBPress, handleSelectPress, handleStartPress, handleDpadPress]);

  const titleLetters = ['A', 'N', 'A', 'G', 'R', 'A', 'M'];

  return (
    <div
      id="lobby-view-container"
      className={`relative w-full h-full flex flex-col justify-between p-2 sm:p-4 select-none ${
        isNormal
          ? 'text-slate-100 font-sans'
          : isCyber
          ? 'text-emerald-100 font-mono'
          : "text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace]"
      }`}
    >
      {/* Top Profile Strip */}
      <div
        className={`flex items-center justify-between pb-2 border-b-2 text-[8px] sm:text-[9px] ${
          isNormal
            ? 'border-amber-800/40 text-slate-300'
            : isCyber
            ? 'border-emerald-500/40'
            : 'border-[var(--lcd-darkest,#0f380f)]'
        }`}
      >
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2 text-left hover:underline cursor-pointer"
        >
          <span
            className={`p-1 rounded-lg flex items-center justify-center ${
              isNormal
                ? 'border border-amber-600 bg-gradient-to-b from-amber-200 to-amber-500 text-amber-950 shadow-xs text-sm'
                : isCyber
                ? 'border border-emerald-400 bg-emerald-950/60 shadow-[0_0_6px_rgba(0,255,102,0.3)]'
                : 'border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
            }`}
          >
            {playerProfile.avatarEmoji}
          </span>
          <div>
            <div className="font-bold truncate max-w-[120px] text-amber-100">{playerProfile.name}</div>
            <div className={`text-[7px] ${isNormal ? 'text-amber-400/80 font-semibold' : isCyber ? 'text-emerald-400/80' : 'text-[var(--lcd-dark,#306230)]'}`}>
              HI: {playerProfile.highestScore}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1.5">
          {onOpenDailyLeaderboard && (
            <button
              type="button"
              onClick={() => {
                sound.playButtonClick();
                onOpenDailyLeaderboard();
              }}
              className={`px-2 py-1 border cursor-pointer text-[7px] sm:text-[8px] active:scale-95 transition-all rounded font-bold flex items-center gap-1 ${
                dailyRecord
                  ? isNormal
                    ? 'border-emerald-600/70 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 shadow-xs'
                    : isCyber
                    ? 'border-emerald-400 bg-emerald-950 text-emerald-300'
                    : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] text-[var(--lcd-darkest,#0f380f)]'
                  : isNormal
                  ? 'border-amber-400/90 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 animate-pulse hover:brightness-110 shadow-sm'
                  : isCyber
                  ? 'border-[#00ff66] bg-[#00ff66]/20 text-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.4)] animate-pulse'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
              title="Open Today's Daily Challenge & Leaderboard"
            >
              <span>🌟</span>
              <span>DAILY</span>
            </button>
          )}

          {onOpenHighScores && (
            <button
              type="button"
              onClick={() => {
                sound.playButtonClick();
                onOpenHighScores();
              }}
              className={`px-2 py-1 border cursor-pointer text-[7px] sm:text-[8px] active:scale-95 transition-all rounded font-bold flex items-center gap-1 ${
                isNormal
                  ? 'border-amber-500/70 bg-slate-800 hover:bg-slate-700 text-amber-300 shadow-xs'
                  : isCyber
                  ? 'border-amber-400/70 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 shadow-[0_0_8px_rgba(251,191,36,0.2)]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] text-[var(--lcd-darkest,#0f380f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
              title="Open Global High Scores Datastore"
            >
              <span>🏆</span>
              <span className="hidden sm:inline">SCORES</span>
            </button>
          )}

          {onOpenSecretMenu && (
            <button
              type="button"
              onClick={() => {
                sound.playButtonClick();
                onOpenSecretMenu();
              }}
              className={`px-1.5 py-1 border cursor-pointer text-[7px] sm:text-[8px] active:scale-95 transition-all rounded font-bold ${
                isMa9icUnlocked
                  ? 'border-[#00ff66] bg-[#00ff66]/20 text-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.4)] animate-pulse'
                  : isNormal
                  ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : isCyber
                  ? 'border-emerald-600 bg-emerald-950/80 text-emerald-400 hover:bg-emerald-900'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] text-[var(--lcd-darkest,#0f380f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
              title="Open Secret Passphrase Menu"
            >
              {isMa9icUnlocked ? '★ MA9IC' : '🔑 SECRET'}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenProfile}
            className={`px-2 py-1 border cursor-pointer text-[8px] active:scale-95 transition-all rounded ${
              isNormal
                ? 'border-amber-700/60 bg-slate-800/80 hover:bg-slate-700 text-amber-200 shadow-xs'
                : isCyber
                ? 'border-emerald-500/60 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300'
                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
            }`}
          >
            [PROFILE]
          </button>
        </div>
      </div>

      {/* Main Center Area */}
      <div className="flex-1 flex flex-col items-center justify-between my-2 overflow-y-auto gb-scroll">
        {/* Title Logo Letters */}
        <div className="flex flex-col items-center mt-1 mb-2">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1.5">
            {titleLetters.map((ch, idx) => (
              <WoodTile
                key={`title-tile-${idx}`}
                letter={ch}
                size="mini"
                className="pointer-events-none"
                skin={skin}
              />
            ))}
          </div>
          <div
            className={`text-[8px] tracking-widest ${
              isNormal
                ? 'text-amber-300 font-extrabold tracking-widest'
                : isCyber
                ? 'text-emerald-400 font-bold matrix-glow-text'
                : 'text-[var(--lcd-dark,#306230)]'
            }`}
          >
            {isNormal ? '★ GAMEPIGEON ANAGRAMS ★' : isCyber ? '★ CYBER ANAGRAM MATRIX ★' : '★ 1989 WORD PUZZLE ★'}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 w-full mb-2 text-[7px] sm:text-[8px]">
          {(['play', 'bots', 'pass_play', 'settings'] as const).map((tab) => {
            const labels = { play: 'SOLO', bots: 'VS AI', pass_play: '2P DUEL', settings: 'OPT' };
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-1.5 border text-center cursor-pointer active:scale-95 transition-all rounded font-bold ${
                  isActive
                    ? isNormal
                      ? 'border-amber-400 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-md font-extrabold'
                      : isCyber
                      ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_10px_#00ff66]'
                      : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                    : isNormal
                    ? 'border-amber-900/40 bg-slate-800/80 text-amber-200 hover:bg-slate-700'
                    : isCyber
                    ? 'border-emerald-700 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50'
                    : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)]/20'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Incoming Challenge Banner */}
        {incomingChallenge && (
          <div
            className={`w-full mb-2 border-2 p-2 text-[8px] animate-pulse rounded-lg ${
              isNormal
                ? 'border-amber-400 bg-amber-950/80 text-amber-100 shadow-lg'
                : isCyber
                ? 'border-emerald-400 bg-emerald-950/90 text-emerald-200 shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
            }`}
          >
            <div className="flex justify-between items-center mb-1 font-bold">
              <span>! 1V1 DUEL INCOMING !</span>
              <span>TARGET: {incomingChallenge.score} PTS</span>
            </div>
            <div className="text-[7px] mb-1.5">FROM: {incomingChallenge.challengerName}</div>
            {onAcceptIncomingChallenge && (
              <button
                type="button"
                onClick={onAcceptIncomingChallenge}
                className={`w-full py-1.5 font-bold text-[8px] cursor-pointer rounded active:scale-95 transition-all ${
                  isNormal
                    ? 'bg-amber-400 text-amber-950 hover:bg-amber-300 font-extrabold shadow-sm'
                    : isCyber
                    ? 'bg-[#00ff66] text-black hover:bg-[#33ff88]'
                    : 'bg-[var(--lcd-bg-light,#9bbc0f)] text-[var(--lcd-darkest,#0f380f)]'
                }`}
              >
                ACCEPT & PLAY NOW
              </button>
            )}
          </div>
        )}

        {/* TAB 1: SOLO PLAY & DISCORD INVITE */}
        {activeTab === 'play' && (
          <div className="w-full flex flex-col gap-2">
            {/* Daily Challenge Card */}
            {dailyInfo && (
              <div
                className={`p-2.5 border-2 rounded-xl flex flex-col gap-1.5 shadow-sm transition-all ${
                  isNormal
                    ? 'border-amber-500/80 bg-gradient-to-br from-amber-950/70 via-slate-900/90 to-amber-950/50 text-amber-100'
                    : isCyber
                    ? 'border-[#00ff66]/70 bg-emerald-950/70 text-emerald-200 shadow-[0_0_12px_rgba(0,255,102,0.15)]'
                    : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)]/80 text-[var(--lcd-darkest,#0f380f)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-[8px] sm:text-[9px]">
                    <span className="text-amber-400">🌟</span>
                    <span>DAILY CHALLENGE #{dailyInfo.dayNumber}</span>
                  </div>
                  <span
                    className={`text-[6.5px] sm:text-[7px] px-1.5 py-0.5 rounded font-bold ${
                      dailyRecord
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse'
                    }`}
                  >
                    {dailyRecord ? `✓ ${dailyRecord.score.toLocaleString()} PTS` : 'NEW TODAY'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[7px] opacity-85">
                  <span>📅 {dailyInfo.dateFormatted}</span>
                  <span>⏳ Reset: {resetCountdown}</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playButtonClick();
                      if (onStartDailyChallenge) onStartDailyChallenge();
                    }}
                    className={`py-1.5 px-2 border font-bold text-[7.5px] sm:text-[8px] cursor-pointer active:scale-95 transition-all rounded text-center flex items-center justify-center gap-1 ${
                      isNormal
                        ? 'border-amber-400 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 font-extrabold shadow-xs hover:brightness-110'
                        : isCyber
                        ? 'border-[#00ff66] bg-[#00ff66] text-black font-bold hover:bg-[#33ff88]'
                        : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                    }`}
                  >
                    <span>▶</span>
                    <span>{dailyRecord ? 'REPLAY' : 'PLAY DAILY'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playButtonClick();
                      if (onOpenDailyLeaderboard) onOpenDailyLeaderboard();
                    }}
                    className={`py-1.5 px-2 border font-bold text-[7.5px] sm:text-[8px] cursor-pointer active:scale-95 transition-all rounded text-center flex items-center justify-center gap-1 ${
                      isNormal
                        ? 'border-amber-600/70 bg-slate-800/90 text-amber-200 hover:bg-slate-700'
                        : isCyber
                        ? 'border-emerald-500/60 bg-emerald-950 text-emerald-300 hover:bg-emerald-900'
                        : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] text-[var(--lcd-darkest,#0f380f)]'
                    }`}
                  >
                    <span>🏆</span>
                    <span>TODAY'S RANK</span>
                  </button>
                </div>
              </div>
            )}

            <button
              id="start-solo-game-button"
              type="button"
              onClick={onStartSolo}
              className={`w-full py-2 sm:py-2.5 border-2 font-bold text-[8px] sm:text-[9px] text-center cursor-pointer active:scale-95 transition-all rounded-lg ${
                isNormal
                  ? 'border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700 hover:text-white shadow-sm'
                  : isCyber
                  ? 'border-emerald-600 bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] text-[var(--lcd-darkest,#0f380f)] shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)]'
              }`}
            >
              ► START STANDARD RUN ({settings.roundDuration > 0 ? `${settings.roundDuration}s` : 'ZEN'})
            </button>

            {/* Online 2-Player Link Cable / Room Button */}
            {onOpenTwoPlayer && (
              <button
                id="lobby-open-2player-btn"
                type="button"
                onClick={() => onOpenTwoPlayer()}
                className={`w-full py-2 sm:py-2.5 border-2 font-bold text-[8px] sm:text-[9px] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all rounded-lg ${
                  isNormal
                    ? 'border-indigo-500/80 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-extrabold shadow-md hover:brightness-110'
                    : isCyber
                    ? 'border-emerald-400 bg-emerald-950 text-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.4)] hover:bg-emerald-900'
                    : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)]'
                }`}
              >
                <span>⚔️</span>
                <span>2-PLAYER ONLINE LOBBY (LINK CABLE)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenDiscordInvite}
              className={`w-full py-2 sm:py-2.5 border-2 font-bold text-[8px] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all rounded-lg ${
                isNormal
                  ? 'border-indigo-600/60 bg-gradient-to-r from-indigo-700/40 to-indigo-900/60 text-indigo-100 hover:from-indigo-600/50 hover:to-indigo-800/70 shadow-sm'
                  : isCyber
                  ? 'border-emerald-500/60 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 shadow-[0_0_8px_rgba(0,255,102,0.2)]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] text-[var(--lcd-darkest,#0f380f)] shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              <span>✉</span>
              <span>DISCORD 1V1 CHALLENGE</span>
            </button>

            {/* Load custom link or room code */}
            <div
              className={`border p-2 text-[7px] sm:text-[8px] rounded-lg ${
                isNormal
                  ? 'border-amber-900/40 bg-slate-900/80 text-slate-200'
                  : isCyber
                  ? 'border-emerald-900 bg-emerald-950/40 text-emerald-300'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              <div className={`mb-1 ${isNormal ? 'text-amber-300 font-bold' : isCyber ? 'text-emerald-400' : 'text-[var(--lcd-dark,#306230)]'}`}>
                ROOM CODE OR CHALLENGE URL:
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={challengeInput}
                  onChange={(e) => setChallengeInput(e.target.value)}
                  placeholder="e.g. ROOM CODE OR URL"
                  className={`flex-1 px-1.5 py-1 border text-[8px] outline-none rounded uppercase ${
                    isNormal
                      ? 'border-amber-700/60 bg-slate-950/80 text-amber-100 placeholder:text-slate-500 font-sans'
                      : isCyber
                      ? 'border-emerald-600/60 bg-black/60 text-emerald-200 placeholder:text-emerald-700'
                      : "border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = challengeInput.trim();
                    if (!val) return;
                    if (onOpenTwoPlayer && (val.length <= 6 || val.includes('duel=') || val.includes('room='))) {
                      const code = val.includes('=') ? val.split('=').pop() || val : val;
                      onOpenTwoPlayer(code.toUpperCase());
                    } else {
                      onLoadChallenge(val);
                    }
                  }}
                  className={`px-3 py-1 font-bold cursor-pointer rounded active:scale-95 transition-all ${
                    isNormal
                      ? 'bg-amber-500 text-amber-950 hover:bg-amber-400 font-extrabold'
                      : isCyber
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                  }`}
                >
                  JOIN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VS BOTS */}
        {activeTab === 'bots' && (
          <div className="w-full flex flex-col gap-1.5 text-[8px]">
            <div className={`text-[7px] ${isCyber ? 'text-emerald-400' : 'text-[var(--lcd-dark,#306230)]'}`}>
              SELECT AI OPPONENT:
            </div>
            <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto gb-scroll">
              {DISCORD_BOTS.map((bot) => (
                <button
                  key={bot.id}
                  type="button"
                  onClick={() => setSelectedBot(bot)}
                  className={`p-1.5 border flex items-center justify-between text-left cursor-pointer rounded-xs transition-all ${
                    selectedBot.id === bot.id
                      ? isCyber
                        ? 'border-emerald-400 bg-emerald-950 text-white shadow-[0_0_8px_rgba(0,255,102,0.3)]'
                        : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                      : isCyber
                      ? 'border-emerald-900 bg-black/40 text-emerald-400 hover:bg-emerald-950/40'
                      : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] text-[var(--lcd-darkest,#0f380f)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{bot.avatar}</span>
                    <div>
                      <div className="font-bold text-[8px]">{bot.name}</div>
                      <div className="text-[6px] opacity-80">{bot.difficulty.toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="text-[7px] font-bold">{bot.difficulty}</div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onStartBotMatch(selectedBot)}
              className={`w-full py-2 border font-bold text-[8px] mt-1 cursor-pointer active:scale-95 transition-all rounded ${
                isCyber
                  ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_12px_#00ff66] hover:bg-[#33ff88]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              ► DUEL {selectedBot.name.toUpperCase()}
            </button>
          </div>
        )}

        {/* TAB 3: 2-PLAYER DUEL (ONLINE & LOCAL) */}
        {activeTab === 'pass_play' && (
          <div className="w-full flex flex-col gap-2 text-[8px]">
            {/* Online Live Section */}
            <div
              className={`p-2 border rounded-lg flex flex-col gap-1.5 ${
                isNormal
                  ? 'border-indigo-600/50 bg-slate-900/80 text-slate-100 shadow-sm'
                  : isCyber
                  ? 'border-emerald-600 bg-emerald-950/40 text-emerald-200 shadow-[0_0_8px_rgba(0,255,102,0.15)]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] text-[var(--lcd-darkest,#0f380f)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-bold text-[7.5px] ${isNormal ? 'text-indigo-300' : isCyber ? 'text-emerald-400' : ''}`}>
                  🌐 REAL-TIME 1V1 ONLINE:
                </span>
                <span className="text-[6px] px-1 py-0.5 rounded border border-emerald-500/50 text-emerald-400 font-bold">
                  LINK CABLE READY
                </span>
              </div>

              <div className="text-[6.5px] opacity-80">
                Create a room to get a code & share link, or join a friend's live match!
              </div>

              {onOpenTwoPlayer && (
                <button
                  type="button"
                  onClick={() => onOpenTwoPlayer()}
                  className={`w-full py-1.5 border font-bold text-[8px] cursor-pointer active:scale-95 transition-all rounded ${
                    isNormal
                      ? 'border-indigo-400 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold shadow-xs hover:brightness-110'
                      : isCyber
                      ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_10px_#00ff66] hover:bg-[#33ff88]'
                      : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                  }`}
                >
                  ⚡ OPEN ONLINE 2-PLAYER LOBBY
                </button>
              )}
            </div>

            {/* Local Pass & Play Section */}
            <div
              className={`p-2 border rounded-lg flex flex-col gap-1.5 ${
                isNormal
                  ? 'border-amber-900/40 bg-slate-900/60 text-slate-200'
                  : isCyber
                  ? 'border-emerald-900 bg-black/40 text-emerald-300'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              <div className={`text-[7px] font-bold ${isNormal ? 'text-amber-300' : isCyber ? 'text-emerald-400' : 'text-[var(--lcd-dark,#306230)]'}`}>
                📱 PASS & PLAY (1 DEVICE):
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <div className="text-[6px] opacity-80 mb-0.5">PLAYER 1:</div>
                  <input
                    type="text"
                    maxLength={10}
                    value={p1Callsign}
                    onChange={(e) => setP1Callsign(e.target.value)}
                    className={`w-full px-1.5 py-1 border text-[7px] outline-none rounded ${
                      isNormal
                        ? 'border-slate-700 bg-slate-950 text-slate-100'
                        : isCyber
                        ? 'border-emerald-700 bg-black/60 text-emerald-200'
                        : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)]'
                    }`}
                  />
                </div>
                <div>
                  <div className="text-[6px] opacity-80 mb-0.5">PLAYER 2:</div>
                  <input
                    type="text"
                    maxLength={10}
                    value={p2Callsign}
                    onChange={(e) => setP2Callsign(e.target.value)}
                    className={`w-full px-1.5 py-1 border text-[7px] outline-none rounded ${
                      isNormal
                        ? 'border-slate-700 bg-slate-950 text-slate-100'
                        : isCyber
                        ? 'border-emerald-700 bg-black/60 text-emerald-200'
                        : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)]'
                    }`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => onStartPassPlay(p1Callsign, p2Callsign)}
                className={`w-full py-1.5 border font-bold text-[7.5px] mt-1 cursor-pointer active:scale-95 transition-all rounded ${
                  isNormal
                    ? 'border-slate-600 bg-slate-800 hover:bg-slate-700 text-amber-200'
                    : isCyber
                    ? 'border-emerald-700 bg-emerald-950 hover:bg-emerald-900 text-emerald-300'
                    : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                }`}
              >
                ► START PASS & PLAY DUEL
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="w-full flex flex-col gap-2 text-[7px] sm:text-[8px]">
            <div>
              <div className={`mb-1 ${isCyber ? 'text-emerald-400' : 'text-[var(--lcd-dark,#306230)]'}`}>
                ROUND TIMER:
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[30, 45, 60, 0].map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, roundDuration: duration })}
                    className={`py-1 border text-center cursor-pointer rounded-xs ${
                      settings.roundDuration === duration
                        ? isCyber
                          ? 'border-[#00ff66] bg-[#00ff66] text-black font-bold'
                          : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                        : isCyber
                        ? 'border-emerald-800 bg-black/40 text-emerald-400'
                        : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
                    }`}
                  >
                    {duration === 0 ? 'ZEN' : `${duration}s`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className={`mb-1 ${isCyber ? 'text-emerald-400' : 'text-[var(--lcd-dark,#306230)]'}`}>
                LETTER COUNT:
              </div>
              <div className="grid grid-cols-2 gap-1">
                {[6, 7].map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, wordLength: len as 6 | 7 })}
                    className={`py-1 border text-center cursor-pointer rounded-xs ${
                      settings.wordLength === len
                        ? isCyber
                          ? 'border-[#00ff66] bg-[#00ff66] text-black font-bold'
                          : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                        : isCyber
                        ? 'border-emerald-800 bg-black/40 text-emerald-400'
                        : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
                    }`}
                  >
                    {len} LETTERS
                  </button>
                ))}
              </div>
            </div>

            {/* Secret Passcode Screen Trigger */}
            {onOpenSecretMenu && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playButtonClick();
                    onOpenSecretMenu();
                  }}
                  className={`w-full py-1.5 border font-bold text-[7px] flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all rounded-xs ${
                    isMa9icUnlocked
                      ? 'border-[#00ff66] bg-[#00ff66]/20 text-[#00ff66] shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                      : isCyber
                      ? 'border-emerald-700 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60'
                      : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] text-[var(--lcd-darkest,#0f380f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
                  }`}
                >
                  <span>🔑</span>
                  <span>{isMa9icUnlocked ? '★ SECRET ROOT MENU (MA9IC UNLOCKED)' : 'ENTER SECRET PASSPHRASE...'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div
        className={`pt-1.5 border-t-2 flex items-center justify-between text-[7px] ${
          isCyber ? 'border-emerald-500/40 text-emerald-500' : 'border-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-dark,#306230)]'
        }`}
      >
        <span>STATUS: READY</span>
        {onOpenSecretMenu && (
          <button
            type="button"
            onClick={() => {
              sound.playButtonClick();
              onOpenSecretMenu();
            }}
            className="hover:underline cursor-pointer opacity-80 hover:opacity-100 flex items-center gap-1"
          >
            <span>🔒</span>
            <span>{isMa9icUnlocked ? 'ROOT: MA9IC' : 'SECRET MENU'}</span>
          </button>
        )}
        <span>HIGH SCORE: {playerProfile.highestScore}</span>
      </div>
    </div>
  );
});

LobbyView.displayName = 'LobbyView';


import React, { useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { WoodTile } from './WoodTile';
import { PlayerProfile, GameSettings, AppSkin } from '../types/game';
import { DISCORD_BOTS, BotPreset } from '../utils/discord';
import { sound } from '../utils/sound';

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
  onOpenDiscordInvite: () => void;
  onAcceptIncomingChallenge?: () => void;
  onOpenProfile: () => void;
  onUpdateSettings: (settings: GameSettings) => void;
  onLoadChallenge: (code: string) => void;
  skin?: AppSkin;
}

export const LobbyView = forwardRef<LobbyViewHandle, LobbyViewProps>(({
  playerProfile,
  settings,
  incomingChallenge,
  onStartSolo,
  onStartBotMatch,
  onStartPassPlay,
  onOpenDiscordInvite,
  onAcceptIncomingChallenge,
  onOpenProfile,
  onUpdateSettings,
  onLoadChallenge,
  skin = 'gameboy',
}, ref) => {
  const isCyber = skin === 'cyber';
  const [activeTab, setActiveTab] = useState<'play' | 'bots' | 'pass_play' | 'settings'>('play');
  const [challengeInput, setChallengeInput] = useState('');
  const [selectedBot, setSelectedBot] = useState<BotPreset>(DISCORD_BOTS[0]);
  const [p1Callsign, setP1Callsign] = useState(playerProfile.name || 'P1');
  const [p2Callsign, setP2Callsign] = useState('P2');

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
        isCyber
          ? 'text-emerald-100 font-mono'
          : "text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace]"
      }`}
    >
      {/* Top Profile Strip */}
      <div
        className={`flex items-center justify-between pb-2 border-b-2 text-[8px] sm:text-[9px] ${
          isCyber ? 'border-emerald-500/40' : 'border-[var(--lcd-darkest,#0f380f)]'
        }`}
      >
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2 text-left hover:underline cursor-pointer"
        >
          <span
            className={`p-1 rounded flex items-center justify-center ${
              isCyber
                ? 'border border-emerald-400 bg-emerald-950/60 shadow-[0_0_6px_rgba(0,255,102,0.3)]'
                : 'border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
            }`}
          >
            {playerProfile.avatarEmoji}
          </span>
          <div>
            <div className="font-bold truncate max-w-[120px]">{playerProfile.name}</div>
            <div className={`text-[7px] ${isCyber ? 'text-emerald-400/80' : 'text-[var(--lcd-dark,#306230)]'}`}>
              HI: {playerProfile.highestScore}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          className={`px-2 py-1 border cursor-pointer text-[8px] active:scale-95 transition-all ${
            isCyber
              ? 'border-emerald-500/60 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300'
              : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
          }`}
        >
          [PROFILE]
        </button>
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
              isCyber ? 'text-emerald-400 font-bold matrix-glow-text' : 'text-[var(--lcd-dark,#306230)]'
            }`}
          >
            {isCyber ? '★ CYBER ANAGRAM MATRIX ★' : '★ 1989 WORD PUZZLE ★'}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 w-full mb-2 text-[7px] sm:text-[8px]">
          <button
            type="button"
            onClick={() => setActiveTab('play')}
            className={`py-1.5 border text-center cursor-pointer active:scale-95 transition-all rounded-xs font-bold ${
              activeTab === 'play'
                ? isCyber
                  ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_10px_#00ff66]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                : isCyber
                ? 'border-emerald-700 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50'
                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)]/20'
            }`}
          >
            SOLO
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bots')}
            className={`py-1.5 border text-center cursor-pointer active:scale-95 transition-all rounded-xs font-bold ${
              activeTab === 'bots'
                ? isCyber
                  ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_10px_#00ff66]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                : isCyber
                ? 'border-emerald-700 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50'
                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)]/20'
            }`}
          >
            VS AI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pass_play')}
            className={`py-1.5 border text-center cursor-pointer active:scale-95 transition-all rounded-xs font-bold ${
              activeTab === 'pass_play'
                ? isCyber
                  ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_10px_#00ff66]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                : isCyber
                ? 'border-emerald-700 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50'
                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)]/20'
            }`}
          >
            2P DUEL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-1.5 border text-center cursor-pointer active:scale-95 transition-all rounded-xs font-bold ${
              activeTab === 'settings'
                ? isCyber
                  ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_10px_#00ff66]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                : isCyber
                ? 'border-emerald-700 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50'
                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)]/20'
            }`}
          >
            OPT
          </button>
        </div>

        {/* Incoming Challenge Banner */}
        {incomingChallenge && (
          <div
            className={`w-full mb-2 border-2 p-2 text-[8px] animate-pulse rounded ${
              isCyber
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
                className={`w-full py-1.5 font-bold text-[8px] cursor-pointer rounded-xs active:scale-95 transition-all ${
                  isCyber
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
            <button
              id="start-solo-game-button"
              type="button"
              onClick={onStartSolo}
              className={`w-full py-2.5 sm:py-3 border-2 font-bold text-[8px] sm:text-[9px] text-center cursor-pointer active:scale-95 transition-all rounded ${
                isCyber
                  ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_15px_#00ff66] hover:bg-[#33ff88]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)]'
              }`}
            >
              ► START SOLO RUN ({settings.roundDuration > 0 ? `${settings.roundDuration}s` : 'ZEN'})
            </button>

            <button
              type="button"
              onClick={onOpenDiscordInvite}
              className={`w-full py-2 sm:py-2.5 border-2 font-bold text-[8px] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all rounded ${
                isCyber
                  ? 'border-emerald-500/60 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 shadow-[0_0_8px_rgba(0,255,102,0.2)]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] text-[var(--lcd-darkest,#0f380f)] shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              <span>✉</span>
              <span>DISCORD 1V1 CHALLENGE</span>
            </button>

            {/* Load custom link */}
            <div
              className={`border p-2 text-[7px] sm:text-[8px] rounded ${
                isCyber
                  ? 'border-emerald-900 bg-emerald-950/40 text-emerald-300'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              <div className={`mb-1 ${isCyber ? 'text-emerald-400' : 'text-[var(--lcd-dark,#306230)]'}`}>
                PASTE CHALLENGE URL:
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={challengeInput}
                  onChange={(e) => setChallengeInput(e.target.value)}
                  placeholder="Paste match URL..."
                  className={`flex-1 px-1.5 py-1 border text-[8px] outline-none rounded-xs ${
                    isCyber
                      ? 'border-emerald-600/60 bg-black/60 text-emerald-200 placeholder:text-emerald-700'
                      : "border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => challengeInput.trim() && onLoadChallenge(challengeInput.trim())}
                  className={`px-3 py-1 font-bold cursor-pointer rounded-xs active:scale-95 transition-all ${
                    isCyber
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                  }`}
                >
                  GO
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

        {/* TAB 3: PASS & PLAY */}
        {activeTab === 'pass_play' && (
          <div className="w-full flex flex-col gap-1.5 text-[8px]">
            <div className={`text-[7px] ${isCyber ? 'text-emerald-400' : 'text-[var(--lcd-dark,#306230)]'}`}>
              PASS & PLAY (SAME DEVICE):
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <div className="text-[6px] opacity-80 mb-0.5">PLAYER 1:</div>
                <input
                  type="text"
                  maxLength={10}
                  value={p1Callsign}
                  onChange={(e) => setP1Callsign(e.target.value)}
                  className={`w-full px-1.5 py-1 border text-[7px] outline-none rounded-xs ${
                    isCyber
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
                  className={`w-full px-1.5 py-1 border text-[7px] outline-none rounded-xs ${
                    isCyber
                      ? 'border-emerald-700 bg-black/60 text-emerald-200'
                      : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)]'
                  }`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onStartPassPlay(p1Callsign, p2Callsign)}
              className={`w-full py-2 border font-bold text-[8px] mt-2 cursor-pointer active:scale-95 transition-all rounded ${
                isCyber
                  ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_12px_#00ff66] hover:bg-[#33ff88]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              ► START 2-PLAYER DUEL
            </button>
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
        <span>HIGH SCORE: {playerProfile.highestScore}</span>
      </div>
    </div>
  );
});

LobbyView.displayName = 'LobbyView';


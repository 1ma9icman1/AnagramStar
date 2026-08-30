import React, { useState } from 'react';
import { WoodTile } from './WoodTile';
import { PlayerProfile, GameSettings } from '../types/game';
import { DISCORD_BOTS, BotPreset } from '../utils/discord';

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
}

export const LobbyView: React.FC<LobbyViewProps> = ({
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
}) => {
  const [activeTab, setActiveTab] = useState<'play' | 'bots' | 'pass_play' | 'settings'>('play');
  const [challengeInput, setChallengeInput] = useState('');
  const [selectedBot, setSelectedBot] = useState<BotPreset>(DISCORD_BOTS[0]);
  const [p1Callsign, setP1Callsign] = useState(playerProfile.name || 'P1');
  const [p2Callsign, setP2Callsign] = useState('P2');

  const titleLetters = ['A', 'N', 'A', 'G', 'R', 'A', 'M'];

  return (
    <div
      id="lobby-view-container"
      className="relative w-full h-full flex flex-col justify-between p-2 sm:p-3 select-none text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace]"
    >
      {/* Top Profile Strip */}
      <div className="flex items-center justify-between pb-1.5 border-b-2 border-[var(--lcd-darkest,#0f380f)] text-[8px]">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-1.5 text-left hover:underline cursor-pointer"
        >
          <span className="p-0.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]">
            {playerProfile.avatarEmoji}
          </span>
          <div>
            <div className="font-bold truncate max-w-[90px]">{playerProfile.name}</div>
            <div className="text-[7px] text-[var(--lcd-dark,#306230)]">HI:{playerProfile.highestScore}</div>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          className="px-1.5 py-0.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)] cursor-pointer text-[7px]"
        >
          [EDIT]
        </button>
      </div>

      {/* Main Center Area */}
      <div className="flex-1 flex flex-col items-center justify-between my-2 overflow-y-auto gb-scroll">
        {/* Title Logo Letters */}
        <div className="flex flex-col items-center mt-1 mb-2">
          <div className="flex items-center justify-center gap-1 mb-1">
            {titleLetters.map((ch, idx) => (
              <WoodTile
                key={`title-tile-${idx}`}
                letter={ch}
                size="mini"
                className="pointer-events-none"
              />
            ))}
          </div>
          <div className="text-[7px] text-[var(--lcd-dark,#306230)] tracking-widest">
            ★ 1989 WORD PUZZLE ★
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="grid grid-cols-4 gap-1 w-full mb-2 text-[7px]">
          <button
            type="button"
            onClick={() => setActiveTab('play')}
            className={`py-1 border border-[var(--lcd-darkest,#0f380f)] text-center cursor-pointer ${
              activeTab === 'play'
                ? 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                : 'bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)]/20'
            }`}
          >
            SOLO
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bots')}
            className={`py-1 border border-[var(--lcd-darkest,#0f380f)] text-center cursor-pointer ${
              activeTab === 'bots'
                ? 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                : 'bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)]/20'
            }`}
          >
            VS AI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pass_play')}
            className={`py-1 border border-[var(--lcd-darkest,#0f380f)] text-center cursor-pointer ${
              activeTab === 'pass_play'
                ? 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                : 'bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)]/20'
            }`}
          >
            2P DUEL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-1 border border-[var(--lcd-darkest,#0f380f)] text-center cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                : 'bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)]/20'
            }`}
          >
            OPT
          </button>
        </div>

        {/* Incoming Challenge Banner */}
        {incomingChallenge && (
          <div className="w-full mb-2 border-2 border-[var(--lcd-darkest,#0f380f)] p-1.5 bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] text-[8px] animate-pulse">
            <div className="flex justify-between items-center mb-1">
              <span>! 1V1 DUEL !</span>
              <span>TARGET:{incomingChallenge.score}</span>
            </div>
            <div className="text-[7px] mb-1">FROM: {incomingChallenge.challengerName}</div>
            {onAcceptIncomingChallenge && (
              <button
                type="button"
                onClick={onAcceptIncomingChallenge}
                className="w-full py-1 bg-[var(--lcd-bg-light,#9bbc0f)] text-[var(--lcd-darkest,#0f380f)] font-bold text-[8px] cursor-pointer"
              >
                ACCEPT & PLAY
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
              className="w-full py-2.5 border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] font-bold text-[9px] text-center shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)] hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              ► START SOLO RUN ({settings.roundDuration > 0 ? `${settings.roundDuration}s` : 'ZEN'})
            </button>

            <button
              type="button"
              onClick={onOpenDiscordInvite}
              className="w-full py-2 border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] text-[var(--lcd-darkest,#0f380f)] font-bold text-[8px] flex items-center justify-center gap-1 shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)] cursor-pointer hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]"
            >
              ✉ DISCORD 1V1 INVITE
            </button>

            {/* Load custom link */}
            <div className="border border-[var(--lcd-darkest,#0f380f)] p-1.5 bg-[var(--lcd-bg-light,#9bbc0f)] text-[7px]">
              <div className="mb-1 text-[var(--lcd-dark,#306230)]">PASTE FRIEND CHALLENGE:</div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={challengeInput}
                  onChange={(e) => setChallengeInput(e.target.value)}
                  placeholder="Paste URL/Code..."
                  className="flex-1 px-1 py-0.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] text-[7px] font-['Press_Start_2P',monospace] outline-none"
                />
                <button
                  type="button"
                  onClick={() => challengeInput.trim() && onLoadChallenge(challengeInput.trim())}
                  className="px-2 py-0.5 bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] font-bold cursor-pointer"
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
            <div className="text-[7px] text-[var(--lcd-dark,#306230)]">SELECT AI RIVAL:</div>
            <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto gb-scroll">
              {DISCORD_BOTS.map((bot) => (
                <button
                  key={bot.id}
                  type="button"
                  onClick={() => setSelectedBot(bot)}
                  className={`p-1.5 border border-[var(--lcd-darkest,#0f380f)] flex items-center justify-between text-left cursor-pointer ${
                    selectedBot.id === bot.id
                      ? 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                      : 'bg-[var(--lcd-bg-light,#9bbc0f)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{bot.avatar}</span>
                    <div>
                      <div className="font-bold text-[8px]">{bot.name}</div>
                      <div className="text-[6px] opacity-80">{bot.difficulty.toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="text-[7px]">{bot.difficulty}</div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onStartBotMatch(selectedBot)}
              className="w-full py-2 border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] font-bold text-[8px] text-center shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)] cursor-pointer"
            >
              ► FIGHT {selectedBot.name.toUpperCase()}
            </button>
          </div>
        )}

        {/* TAB 3: 2-PLAYER PASS & PLAY */}
        {activeTab === 'pass_play' && (
          <div className="w-full flex flex-col gap-1.5 text-[8px]">
            <div className="border border-[var(--lcd-darkest,#0f380f)] p-1.5 bg-[var(--lcd-bg-light,#9bbc0f)] text-[7px] leading-relaxed">
              1 CONSOLE, 2 PLAYERS. SAME LETTERS, 60s EACH. HIGHEST SCORE WINS!
            </div>

            <div className="grid grid-cols-2 gap-1">
              <div>
                <div className="text-[6px] mb-0.5 text-[var(--lcd-dark,#306230)]">P1 NAME:</div>
                <input
                  type="text"
                  maxLength={10}
                  value={p1Callsign}
                  onChange={(e) => setP1Callsign(e.target.value)}
                  className="w-full px-1 py-0.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] text-[7px] font-['Press_Start_2P',monospace]"
                />
              </div>
              <div>
                <div className="text-[6px] mb-0.5 text-[var(--lcd-dark,#306230)]">P2 NAME:</div>
                <input
                  type="text"
                  maxLength={10}
                  value={p2Callsign}
                  onChange={(e) => setP2Callsign(e.target.value)}
                  className="w-full px-1 py-0.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] text-[7px] font-['Press_Start_2P',monospace]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onStartPassPlay(p1Callsign, p2Callsign)}
              className="w-full py-2 border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] font-bold text-[8px] text-center shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)] cursor-pointer mt-1"
            >
              ► START 2P DUEL
            </button>
          </div>
        )}

        {/* TAB 4: OPTIONS */}
        {activeTab === 'settings' && (
          <div className="w-full flex flex-col gap-1.5 text-[7px]">
            {/* Word Length */}
            <div className="flex items-center justify-between border-b border-[var(--lcd-dark,#306230)]/40 pb-1">
              <span>LETTERS:</span>
              <div className="flex gap-1">
                {[6, 7].map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, wordLength: len as 6 | 7 })}
                    className={`px-1.5 py-0.5 border border-[var(--lcd-darkest,#0f380f)] cursor-pointer ${
                      settings.wordLength === len
                        ? 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                        : 'bg-[var(--lcd-bg-light,#9bbc0f)]'
                    }`}
                  >
                    {len}L
                  </button>
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-between border-b border-[var(--lcd-dark,#306230)]/40 pb-1">
              <span>TIMER:</span>
              <div className="flex gap-1">
                {[60, 90, 0].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, roundDuration: dur })}
                    className={`px-1.5 py-0.5 border border-[var(--lcd-darkest,#0f380f)] cursor-pointer ${
                      settings.roundDuration === dur
                        ? 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                        : 'bg-[var(--lcd-bg-light,#9bbc0f)]'
                    }`}
                  >
                    {dur === 0 ? 'ZEN' : `${dur}s`}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between pb-1">
              <span>AUDIO:</span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                className={`px-2 py-0.5 border border-[var(--lcd-darkest,#0f380f)] cursor-pointer ${
                  settings.soundEnabled
                    ? 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                    : 'bg-[var(--lcd-bg-light,#9bbc0f)]'
                }`}
              >
                {settings.soundEnabled ? 'ON' : 'MUTED'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer info */}
      <div className="pt-1 border-t-2 border-[var(--lcd-darkest,#0f380f)] flex items-center justify-between text-[7px] text-[var(--lcd-dark,#306230)]">
        <span>PRESS [A] OR [START]</span>
        <span>©1989 NINTENDO</span>
      </div>
    </div>
  );
};

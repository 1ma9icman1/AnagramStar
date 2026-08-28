import React, { useState } from 'react';
import { Play, Bot, Users, Settings, Trophy, Volume2, VolumeX, Sparkles, Flame, User, Swords } from 'lucide-react';
import { WoodTile } from './WoodTile';
import { PlayerProfile, GameSettings, OpponentType } from '../types/game';
import { DISCORD_BOTS, BotPreset } from '../utils/discord';

interface LobbyViewProps {
  playerProfile: PlayerProfile;
  settings: GameSettings;
  onStartSolo: () => void;
  onStartBotMatch: (bot: BotPreset) => void;
  onStartPassPlay: () => void;
  onOpenProfile: () => void;
  onUpdateSettings: (settings: GameSettings) => void;
  onLoadChallenge: (code: string) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  playerProfile,
  settings,
  onStartSolo,
  onStartBotMatch,
  onStartPassPlay,
  onOpenProfile,
  onUpdateSettings,
  onLoadChallenge,
}) => {
  const [activeTab, setActiveTab] = useState<'play' | 'bots' | 'pass_play' | 'settings'>('play');
  const [challengeInput, setChallengeInput] = useState('');
  const [selectedBot, setSelectedBot] = useState<BotPreset>(DISCORD_BOTS[0]);

  const titleLetters = ['A', 'N', 'A', 'G', 'R', 'A', 'M', 'S'];

  return (
    <div
      id="lobby-view-container"
      className="relative w-full max-w-md mx-auto min-h-[92vh] sm:min-h-[85vh] flex flex-col justify-between p-4 sm:p-6 bg-diamond-pattern rounded-3xl shadow-2xl border-4 border-slate-700/60 overflow-hidden"
    >
      {/* Top Profile Card */}
      <div className="flex items-center justify-between bg-slate-900/60 p-2.5 sm:p-3 rounded-2xl border border-slate-700/60 shadow-lg backdrop-blur-xs select-none">
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-md border-2 border-emerald-500 group-hover:scale-105 transition"
            style={{ backgroundColor: playerProfile.avatarColor }}
          >
            {playerProfile.avatarEmoji}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition">
                {playerProfile.name}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono font-bold">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold">
              <span className="flex items-center gap-0.5 text-amber-400">
                <Trophy className="w-3 h-3" /> {playerProfile.highestScore.toLocaleString()} pts
              </span>
              <span>•</span>
              <span>{playerProfile.gamesPlayed} games</span>
            </div>
          </div>
        </button>

        <button
          onClick={onOpenProfile}
          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition border border-slate-700/60 cursor-pointer"
          title="Edit Profile"
        >
          <User className="w-4 h-4" />
        </button>
      </div>

      {/* Main Center Area: Animated Wooden Title & Game Modes */}
      <div className="flex-1 flex flex-col items-center justify-center my-3 select-none">
        {/* Animated Title Wood Tiles */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-2 scale-90 sm:scale-100">
          {titleLetters.map((ch, idx) => (
            <WoodTile
              key={`title-tile-${idx}`}
              letter={ch}
              size="small"
              className="pointer-events-none"
            />
          ))}
        </div>

        <p className="text-[11px] sm:text-xs font-black text-indigo-200/90 tracking-widest uppercase mb-5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>GamePigeon Classic for Discord</span>
          <Sparkles className="w-3 h-3 text-amber-300" />
        </p>

        {/* Mode Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/70 rounded-xl border border-slate-700/60 w-full mb-4">
          <button
            onClick={() => setActiveTab('play')}
            className={`py-2 rounded-lg text-xs font-black transition cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'play' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>SOLO</span>
          </button>

          <button
            onClick={() => setActiveTab('bots')}
            className={`py-2 rounded-lg text-xs font-black transition cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'bots' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>VS BOT</span>
          </button>

          <button
            onClick={() => setActiveTab('pass_play')}
            className={`py-2 rounded-lg text-xs font-black transition cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'pass_play' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>2-PLAYER</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 rounded-lg text-xs font-black transition cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>RULES</span>
          </button>
        </div>

        {/* Tab 1: Solo Rush */}
        {activeTab === 'play' && (
          <div className="w-full flex flex-col items-center gap-3">
            <button
              id="start-solo-game-button"
              type="button"
              onClick={onStartSolo}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-black text-lg uppercase tracking-wider shadow-2xl border-2 border-emerald-400/40 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Play className="w-6 h-6 fill-white" />
              <span>PLAY ANAGRAMS ({settings.roundDuration > 0 ? `${settings.roundDuration}s` : 'ZEN'})</span>
            </button>

            {/* Join Discord Challenge Link Input */}
            <div className="w-full bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 mt-1">
              <label className="block text-[11px] font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">
                Have a Discord Friend's Challenge Code?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={challengeInput}
                  onChange={e => setChallengeInput(e.target.value)}
                  placeholder="Paste challenge code or URL..."
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (challengeInput.trim()) {
                      onLoadChallenge(challengeInput.trim());
                    }
                  }}
                  disabled={!challengeInput.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Discord Bots */}
        {activeTab === 'bots' && (
          <div className="w-full flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {DISCORD_BOTS.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBot(b)}
                  className={`
                    p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer
                    ${selectedBot.id === b.id
                      ? 'bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-400'
                      : 'bg-slate-900/60 border-slate-700/60 hover:bg-slate-800/80'}
                  `}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xl shadow shrink-0"
                    style={{ backgroundColor: b.avatarBg }}
                  >
                    {b.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">{b.name}</div>
                    <div className="text-[10px] font-bold text-amber-300">{b.difficulty}</div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => onStartBotMatch(selectedBot)}
              className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] text-white font-black text-sm uppercase tracking-wider shadow-lg border border-indigo-400/40 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>DUEL {selectedBot.name.toUpperCase()} ({selectedBot.difficulty})</span>
            </button>
          </div>
        )}

        {/* Tab 3: Pass & Play Showdown */}
        {activeTab === 'pass_play' && (
          <div className="w-full bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 flex flex-col items-center text-center gap-2.5">
            <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-500 flex items-center justify-center text-2xl">
              ⚔️
            </div>
            <div>
              <h4 className="text-sm font-black text-white">2-Player Pass & Play</h4>
              <p className="text-xs text-slate-300/80 mt-0.5">
                Player 1 plays a 60-second scramble. Then Player 2 gets the exact same letter rack to see who scores higher!
              </p>
            </div>
            <button
              onClick={onStartPassPlay}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>START 2-PLAYER MATCH</span>
            </button>
          </div>
        )}

        {/* Tab 4: Rules & Settings */}
        {activeTab === 'settings' && (
          <div className="w-full bg-slate-900/70 p-3 rounded-xl border border-slate-700/60 space-y-3 text-left">
            {/* Scoring Table */}
            <div>
              <div className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Official GamePigeon Scoring Rules:
              </div>
              <div className="grid grid-cols-4 gap-1 text-center font-mono">
                <div className="bg-slate-800 p-1.5 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400">3 Letters</div>
                  <div className="text-xs font-black text-emerald-400">+100</div>
                </div>
                <div className="bg-slate-800 p-1.5 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400">4 Letters</div>
                  <div className="text-xs font-black text-emerald-400">+400</div>
                </div>
                <div className="bg-slate-800 p-1.5 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400">5 Letters</div>
                  <div className="text-xs font-black text-emerald-400">+1,200</div>
                </div>
                <div className="bg-slate-800 p-1.5 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400">6 Letters</div>
                  <div className="text-xs font-black text-emerald-400">+2,000</div>
                </div>
              </div>
            </div>

            {/* Timer Selection */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-300 mb-1 uppercase tracking-wider">
                Timer Duration
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[30, 60, 90, 0].map(duration => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, roundDuration: duration })}
                    className={`py-1 rounded text-xs font-bold transition cursor-pointer ${
                      settings.roundDuration === duration
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {duration === 0 ? 'Zen (∞)' : `${duration}s`}
                  </button>
                ))}
              </div>
            </div>

            {/* Word Length */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-300 mb-1 uppercase tracking-wider">
                Scramble Rack Size
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[6, 7].map(len => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, wordLength: len as 6 | 7 })}
                    className={`py-1 rounded text-xs font-bold transition cursor-pointer ${
                      settings.wordLength === len
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {len} Letters ({len === 6 ? 'Standard' : '7-Letter Master'})
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-300">Sound Effects & Chimes</span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  settings.soundEnabled
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-400/80 font-medium select-none pt-2">
        Type on keyboard or tap wooden tiles • Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-300 font-mono">Space</kbd> to shuffle
      </div>
    </div>
  );
};

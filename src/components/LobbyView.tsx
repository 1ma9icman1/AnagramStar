import React, { useState } from 'react';
import { Play, Bot, Users, Settings, Trophy, Volume2, VolumeX, Sparkles, Flame, User, Swords, Terminal, Cpu, ShieldAlert, Key, MessageSquare, Send } from 'lucide-react';
import { WoodTile } from './WoodTile';
import { PlayerProfile, GameSettings, OpponentType } from '../types/game';
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
  const [p1Callsign, setP1Callsign] = useState(playerProfile.name || 'Neo');
  const [p2Callsign, setP2Callsign] = useState('Trinity');

  const titleLetters = ['M', 'A', 'T', 'R', 'I', 'X', 'C', 'R'];

  return (
    <div
      id="lobby-view-container"
      className="relative w-full max-w-md mx-auto min-h-[92vh] sm:min-h-[85vh] flex flex-col justify-between p-4 sm:p-6 bg-matrix-pattern rounded-2xl shadow-[0_0_50px_rgba(0,255,102,0.15)] border border-[#00ff66]/50 overflow-hidden text-emerald-100"
    >
      {/* Top Cyber Operator Profile Bar */}
      <div className="flex items-center justify-between bg-black/80 p-2.5 sm:p-3 rounded-xl border border-[#00ff66]/40 shadow-[0_0_15px_rgba(0,255,102,0.15)] select-none">
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-xl sm:text-2xl shadow-[0_0_10px_#00ff66] border border-[#00ff66] bg-black group-hover:scale-105 transition"
            style={{ backgroundColor: playerProfile.avatarColor }}
          >
            {playerProfile.avatarEmoji}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-white group-hover:text-[#00ff66] transition font-['Orbitron',monospace]">
                {playerProfile.name}
              </span>
              <span className="text-[9px] bg-emerald-950/80 text-[#00ff66] border border-[#00ff66]/50 px-1.5 py-0.2 rounded font-mono font-bold">
                OPERATOR
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-emerald-400/80 font-mono font-bold">
              <span className="flex items-center gap-0.5 text-[#00ff66]">
                <Trophy className="w-3 h-3 text-[#00ff66]" /> {playerProfile.highestScore.toLocaleString()} BITS
              </span>
              <span>•</span>
              <span>{playerProfile.gamesPlayed} RUNS</span>
            </div>
          </div>
        </button>

        <button
          onClick={onOpenProfile}
          className="w-8 h-8 rounded-lg bg-black hover:bg-emerald-950/80 text-[#00ff66] flex items-center justify-center transition border border-[#00ff66]/40 cursor-pointer shadow-[0_0_8px_rgba(0,255,102,0.2)]"
          title="Configure Operator Persona"
        >
          <User className="w-4 h-4" />
        </button>
      </div>

      {/* Main Center Area: Cyber Display & Game Modes */}
      <div className="flex-1 flex flex-col items-center justify-center my-3 select-none">
        {/* Animated Cyber Title Keycaps */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-2 scale-90 sm:scale-100">
          {titleLetters.map((ch, idx) => (
            <WoodTile
              key={`title-tile-${idx}`}
              letter={ch}
              size="small"
              className="pointer-events-none shadow-[0_0_12px_rgba(0,255,102,0.4)]"
            />
          ))}
        </div>

        <p className="text-[10px] sm:text-xs font-mono font-bold text-emerald-400 tracking-widest uppercase mb-4 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-[#00ff66]" />
          <span className="matrix-glow-text">NEO DECRYPTION MAINFRAME</span>
          <Terminal className="w-3.5 h-3.5 text-[#00ff66]" />
        </p>

        {/* Mode Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-black/80 rounded-xl border border-[#00ff66]/30 w-full mb-3.5">
          <button
            onClick={() => setActiveTab('play')}
            className={`py-2 rounded-lg text-[11px] font-mono font-black transition cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'play' ? 'bg-[#003816] text-[#00ff66] border border-[#00ff66] shadow-[0_0_10px_rgba(0,255,102,0.3)]' : 'text-emerald-600 hover:text-emerald-300'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>SOLO</span>
          </button>

          <button
            onClick={() => setActiveTab('bots')}
            className={`py-2 rounded-lg text-[11px] font-mono font-black transition cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'bots' ? 'bg-[#003816] text-[#00ff66] border border-[#00ff66] shadow-[0_0_10px_rgba(0,255,102,0.3)]' : 'text-emerald-600 hover:text-emerald-300'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI AGENT</span>
          </button>

          <button
            onClick={() => setActiveTab('pass_play')}
            className={`py-2 rounded-lg text-[11px] font-mono font-black transition cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'pass_play' ? 'bg-[#003816] text-[#00ff66] border border-[#00ff66] shadow-[0_0_10px_rgba(0,255,102,0.3)]' : 'text-emerald-600 hover:text-emerald-300'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>2P DUEL</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 rounded-lg text-[11px] font-mono font-black transition cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'settings' ? 'bg-[#003816] text-[#00ff66] border border-[#00ff66] shadow-[0_0_10px_rgba(0,255,102,0.3)]' : 'text-emerald-600 hover:text-emerald-300'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>CONFIG</span>
          </button>
        </div>

        {/* Incoming Challenge Alert Banner */}
        {incomingChallenge && (
          <div className="w-full mb-3 bg-[#002a11] border-2 border-[#00ff66] p-3 rounded-xl shadow-[0_0_25px_rgba(0,255,102,0.4)] animate-pulse flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <div>
                  <div className="text-[10px] font-mono font-bold text-emerald-400">INCOMING 1V1 CHALLENGE</div>
                  <div className="text-xs font-['Orbitron',monospace] font-black text-white">
                    {incomingChallenge.challengerName}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-emerald-400 font-mono">TARGET TO BEAT</div>
                <div className="text-xs font-mono font-black text-[#00ff66]">
                  {incomingChallenge.score > 0 ? `${incomingChallenge.score.toLocaleString()} BITS` : 'LIVE MATCH'}
                </div>
              </div>
            </div>
            {onAcceptIncomingChallenge && (
              <button
                type="button"
                onClick={onAcceptIncomingChallenge}
                className="w-full py-2 bg-[#00ff66] hover:bg-[#55ff99] text-black font-['Orbitron',monospace] font-black text-xs uppercase tracking-wider rounded-lg shadow-[0_0_15px_#00ff66] transition cursor-pointer"
              >
                ACCEPT CHALLENGE & CRACK
              </button>
            )}
          </div>
        )}

        {/* Tab 1: Solo Rush & Discord 1v1 Invite */}
        {activeTab === 'play' && (
          <div className="w-full flex flex-col items-center gap-2.5">
            <button
              id="start-solo-game-button"
              type="button"
              onClick={onStartSolo}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-[#00ff66] to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-black font-black text-sm sm:text-base uppercase font-['Orbitron',monospace] tracking-wider shadow-[0_0_25px_#00ff66] border-2 border-white flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>SOLO RUN ({settings.roundDuration > 0 ? `${settings.roundDuration}s` : 'ZEN'})</span>
            </button>

            {/* Invite Discord Friend Button */}
            <button
              id="invite-discord-player-button"
              type="button"
              onClick={onOpenDiscordInvite}
              className="w-full py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] text-white font-['Orbitron',monospace] font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(88,101,242,0.4)] border border-[#7289da] flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>INVITE DISCORD FRIEND TO DUEL</span>
            </button>

            {/* Join Discord Challenge Link Input */}
            <div className="w-full bg-black/80 p-2.5 rounded-xl border border-[#00ff66]/40 shadow-[0_0_15px_rgba(0,255,102,0.1)]">
              <label className="block text-[9px] font-mono font-bold text-emerald-400 mb-1 uppercase tracking-wider">
                JOIN VIA CHALLENGE CODE OR URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={challengeInput}
                  onChange={e => setChallengeInput(e.target.value)}
                  placeholder="Paste challenge link or code..."
                  className="flex-1 px-2.5 py-1.5 bg-[#040e07] border border-[#00ff66]/40 rounded text-xs text-[#00ff66] font-mono focus:outline-hidden focus:border-[#00ff66] shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (challengeInput.trim()) {
                      onLoadChallenge(challengeInput.trim());
                    }
                  }}
                  disabled={!challengeInput.trim()}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-[#00ff66] hover:text-black disabled:opacity-40 text-white font-mono font-bold text-xs rounded transition border border-[#00ff66]/50 cursor-pointer"
                >
                  LOAD
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Discord Bots */}
        {activeTab === 'bots' && (
          <div className="w-full flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-matrix-scroll">
              {DISCORD_BOTS.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBot(b)}
                  className={`
                    p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer
                    ${selectedBot.id === b.id
                      ? 'bg-[#003816] border-[#00ff66] ring-2 ring-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                      : 'bg-black/70 border-[#00ff66]/30 hover:bg-emerald-950/40'}
                  `}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xl shadow border border-[#00ff66]/60 shrink-0 bg-black"
                    style={{ backgroundColor: b.avatarBg }}
                  >
                    {b.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-black text-white truncate">{b.name}</div>
                    <div className="text-[9px] font-mono font-bold text-[#00ff66]">{b.difficulty}</div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => onStartBotMatch(selectedBot)}
              className="w-full py-3.5 mt-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-black font-['Orbitron',monospace] font-black text-sm uppercase tracking-wider shadow-[0_0_20px_#00ff66] border border-white transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4 text-black" />
              <span>HACK vs {selectedBot.name.toUpperCase()}</span>
            </button>
          </div>
        )}

        {/* Tab 3: Pass & Play Showdown */}
        {activeTab === 'pass_play' && (
          <div className="w-full bg-black/80 p-3.5 rounded-xl border border-[#00ff66]/40 flex flex-col gap-3 shadow-[0_0_20px_rgba(0,255,102,0.15)] text-left">
            <div className="flex items-center gap-2 border-b border-[#00ff66]/20 pb-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-[#00ff66] flex items-center justify-center text-xl shadow-[0_0_10px_#00ff66]">
                ⚔️
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-['Orbitron',monospace] font-black text-[#00ff66]">2-PLAYER HARDWARE DUEL</h4>
                <p className="text-[10px] text-emerald-400 font-mono">Synchronized Pass & Play Head-to-Head</p>
              </div>
            </div>

            {/* Operator Callsign Inputs */}
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="bg-[#040e07] p-2 rounded-lg border border-[#00ff66]/30">
                <label className="block text-[9px] font-bold text-emerald-400 mb-1 uppercase">OPERATOR 1 (P1):</label>
                <input
                  type="text"
                  value={p1Callsign}
                  onChange={e => setP1Callsign(e.target.value)}
                  maxLength={14}
                  className="w-full px-2 py-1 bg-black border border-[#00ff66]/40 rounded text-xs text-[#00ff66] font-bold focus:outline-hidden focus:border-[#00ff66]"
                  placeholder="Player 1"
                />
              </div>

              <div className="bg-[#040e07] p-2 rounded-lg border border-[#00ff66]/30">
                <label className="block text-[9px] font-bold text-emerald-400 mb-1 uppercase">OPERATOR 2 (P2):</label>
                <input
                  type="text"
                  value={p2Callsign}
                  onChange={e => setP2Callsign(e.target.value)}
                  maxLength={14}
                  className="w-full px-2 py-1 bg-black border border-[#00ff66]/40 rounded text-xs text-[#00ff66] font-bold focus:outline-hidden focus:border-[#00ff66]"
                  placeholder="Player 2"
                />
              </div>
            </div>

            {/* Duel Workflow Description */}
            <div className="bg-[#021006] p-2 rounded-lg border border-[#00ff66]/20 text-[10px] font-mono text-emerald-300/80 space-y-1">
              <div className="text-[#00ff66] font-bold flex items-center gap-1">
                <span>⚡ PROTOCOL SEQUENCE:</span>
              </div>
              <p>1. <strong>{p1Callsign || 'P1'}</strong> cracks the 60s anagram cipher first.</p>
              <p>2. Hardware handoff intermission blinds P1's score.</p>
              <p>3. <strong>{p2Callsign || 'P2'}</strong> cracks the EXACT same scrambled rack.</p>
              <p>4. Decrypted results reveal head-to-head winner & words!</p>
            </div>

            <button
              id="start-2p-duel-button"
              type="button"
              onClick={() => onStartPassPlay(p1Callsign.trim() || 'Operator 1', p2Callsign.trim() || 'Operator 2')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 via-[#00ff66] to-emerald-600 hover:from-teal-400 hover:to-emerald-400 text-black font-['Orbitron',monospace] font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_#00ff66] border border-white transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-black" />
              <span>START {p1Callsign.toUpperCase() || 'P1'} vs {p2Callsign.toUpperCase() || 'P2'} DUEL</span>
            </button>

            <button
              type="button"
              onClick={onOpenDiscordInvite}
              className="w-full py-2.5 rounded-xl bg-[#5865F2]/90 hover:bg-[#5865F2] text-white font-mono font-bold text-xs flex items-center justify-center gap-2 border border-[#7289da] shadow-[0_0_12px_rgba(88,101,242,0.3)] transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>REMOTE FRIEND? SEND DISCORD 1V1 INVITE</span>
            </button>
          </div>
        )}

        {/* Tab 4: Rules & Settings */}
        {activeTab === 'settings' && (
          <div className="w-full bg-black/80 p-3 rounded-xl border border-[#00ff66]/40 space-y-3 text-left shadow-[0_0_15px_rgba(0,255,102,0.1)]">
            {/* Scoring Table */}
            <div>
              <div className="text-[10px] font-mono font-bold text-[#00ff66] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#00ff66]" /> DECRYPTION VALUE PROTOCOLS:
              </div>
              <div className="grid grid-cols-4 gap-1 text-center font-mono">
                <div className="bg-[#031508] p-1.5 rounded border border-[#00ff66]/40">
                  <div className="text-[9px] text-emerald-400">3 CHARS</div>
                  <div className="text-xs font-black text-[#00ff66]">+100b</div>
                </div>
                <div className="bg-[#031508] p-1.5 rounded border border-[#00ff66]/40">
                  <div className="text-[9px] text-emerald-400">4 CHARS</div>
                  <div className="text-xs font-black text-[#00ff66]">+400b</div>
                </div>
                <div className="bg-[#031508] p-1.5 rounded border border-[#00ff66]/40">
                  <div className="text-[9px] text-emerald-400">5 CHARS</div>
                  <div className="text-xs font-black text-[#00ff66]">+1.2kb</div>
                </div>
                <div className="bg-[#031508] p-1.5 rounded border border-[#00ff66]/40">
                  <div className="text-[9px] text-emerald-400">6 CHARS</div>
                  <div className="text-xs font-black text-[#00ff66]">+2.0kb</div>
                </div>
              </div>
            </div>

            {/* Timer Selection */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-emerald-400 mb-1 uppercase tracking-wider">
                DECRYPTION BUFFER TIMEOUT
              </label>
              <div className="grid grid-cols-4 gap-1 font-mono">
                {[30, 60, 90, 0].map(duration => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, roundDuration: duration })}
                    className={`py-1 rounded text-xs font-bold transition cursor-pointer border ${
                      settings.roundDuration === duration
                        ? 'bg-[#003816] text-[#00ff66] border-[#00ff66] shadow-[0_0_8px_#00ff66]'
                        : 'bg-[#031508] text-emerald-600 border-[#00ff66]/20 hover:text-emerald-300'
                    }`}
                  >
                    {duration === 0 ? 'ZEN (∞)' : `${duration}s`}
                  </button>
                ))}
              </div>
            </div>

            {/* Word Length */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-emerald-400 mb-1 uppercase tracking-wider">
                CIPHER RACK COMPLEXITY
              </label>
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                {[6, 7].map(len => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, wordLength: len as 6 | 7 })}
                    className={`py-1 rounded text-xs font-bold transition cursor-pointer border ${
                      settings.wordLength === len
                        ? 'bg-[#003816] text-[#00ff66] border-[#00ff66] shadow-[0_0_8px_#00ff66]'
                        : 'bg-[#031508] text-emerald-600 border-[#00ff66]/20 hover:text-emerald-300'
                    }`}
                  >
                    {len} KEYCAPS ({len === 6 ? 'STANDARD' : 'AGENT 7-CHAR'})
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between pt-1 font-mono">
              <span className="text-xs font-bold text-emerald-300">SYNTH SOUND & TELEMETRY</span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  settings.soundEnabled
                    ? 'bg-emerald-950 border-[#00ff66] text-[#00ff66] shadow-[0_0_8px_#00ff66]'
                    : 'bg-black border-emerald-900/60 text-emerald-700'
                }`}
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-[10px] font-mono text-emerald-500/80 font-medium select-none pt-2 space-y-1 border-t border-[#00ff66]/20">
        <div>
          Keyboard input active • Tap data keycaps • Press <kbd className="bg-black border border-[#00ff66]/40 px-1 py-0.2 rounded text-[9px] text-[#00ff66]">Space</kbd> to rotate buffer
        </div>
        <div className="flex items-center justify-center gap-3 text-[10px] text-emerald-600">
          <a href="/terms.html" target="_blank" rel="noreferrer" className="hover:text-[#00ff66] underline">
            Terms of Service
          </a>
          <span>•</span>
          <a href="/privacy.html" target="_blank" rel="noreferrer" className="hover:text-[#00ff66] underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
};


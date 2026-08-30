import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/sound';
import { PlayerProfile, AppSkin } from '../types/game';

interface SecretMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  onUnlockMa9ic: () => void;
  onSwitchToHackerGreen: () => void;
  playerProfile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
  currentSkin: AppSkin;
}

export const SecretMenuModal: React.FC<SecretMenuModalProps> = ({
  isOpen,
  onClose,
  isUnlocked,
  onUnlockMa9ic,
  onSwitchToHackerGreen,
  playerProfile,
  onUpdateProfile,
  currentSkin,
}) => {
  const [passcode, setPasscode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setPasscode('');
      setJustUnlocked(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmitPasscode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = passcode.trim().toLowerCase();

    if (!clean) {
      setErrorMsg('ENTER A SECRET WORD');
      sound.playInvalidWord();
      return;
    }

    if (clean === 'ma9ic') {
      // SUCCESS!
      setIsVerifying(true);
      setErrorMsg('');
      sound.playHackerUnlock();

      setTerminalLogs([
        '>> INITIATING MAINFRAME OVERRIDE...',
        '>> DECRYPTING CIPHER: "ma9ic"',
        '>> [✓] PASSPHRASE AUTHENTICATED: MA9IC ROOT IDENTIFIED',
        '>> [✓] UNLOCKING ALL RESTRICTED ASSETS & AVATARS',
        '>> [✓] INJECTING 999,999 PTS & GOD-TIER STATS',
        '>> [✓] SWITCHING SYSTEM TO HACKER GREEN THEME...',
      ]);

      setTimeout(() => {
        onUnlockMa9ic();
        setJustUnlocked(true);
        setIsVerifying(false);
      }, 900);
    } else {
      setErrorMsg(`ACCESS DENIED: "${clean.toUpperCase()}" INVALID`);
      sound.playInvalidWord();
      const inputEl = inputRef.current;
      if (inputEl) {
        inputEl.classList.add('animate-shake');
        setTimeout(() => inputEl.classList.remove('animate-shake'), 400);
      }
    }
  };

  const handleMaxStats = () => {
    sound.playValidWord(6);
    onUpdateProfile({
      ...playerProfile,
      name: playerProfile.name === 'PLAYER 1' || playerProfile.name === 'Neo' ? 'MA9IC WIZARD' : playerProfile.name,
      avatarEmoji: '🧙‍♂️',
      highestScore: 999999,
      totalWordsFound: 9999,
      gamesPlayed: 1337,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-gb-pop">
      <div
        id="secret-menu-modal"
        className="w-full max-w-lg border-2 border-[#00ff66] bg-[#030a05]/95 text-[#00ff66] font-mono shadow-[0_0_35px_rgba(0,255,102,0.35)] rounded-lg overflow-hidden flex flex-col"
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-[#00ff66]/40 bg-[#00ff66]/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00ff66] shadow-[0_0_8px_#00ff66] animate-pulse" />
            <span className="font-bold tracking-widest text-[11px] sm:text-xs">
              {isUnlocked || justUnlocked ? '★ SECRET ROOT CONSOLE (MA9IC)' : '🔒 RESTRICTED TERMINAL // SECRET MENU'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-0.5 border border-[#00ff66]/50 bg-black text-[#00ff66] text-xs hover:bg-[#00ff66] hover:text-black cursor-pointer rounded-xs transition-colors"
          >
            [ESC / X]
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 text-xs">
          {!isUnlocked && !justUnlocked ? (
            /* LOCKED: Enter Secret Word Screen */
            <div className="space-y-4">
              <div className="p-3 border border-[#00ff66]/30 bg-black/60 rounded text-[11px] space-y-1.5 text-emerald-300">
                <div className="text-[#00ff66] font-bold flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>CONFIDENTIAL MAINFRAME ACCESS</span>
                </div>
                <p className="text-emerald-400/80 leading-relaxed text-[10px] sm:text-[11px]">
                  Enter the secret word below. Authenticated credentials will unlock all features, avatars, developer cheats, and activate the Hacker Green theme.
                </p>
              </div>

              <form onSubmit={handleSubmitPasscode} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-emerald-400 mb-1 font-bold">
                    ENTER SECRET WORD:
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter secret word..."
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      className="flex-1 px-3 py-2 border-2 border-[#00ff66] bg-black text-[#00ff66] placeholder:text-emerald-800 text-sm font-mono tracking-widest outline-none shadow-[inset_0_0_10px_rgba(0,255,102,0.2)] rounded"
                    />
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="px-4 py-2 border-2 border-[#00ff66] bg-[#00ff66] text-black font-bold text-xs uppercase cursor-pointer hover:bg-[#33ff88] active:scale-95 transition-all rounded shadow-[0_0_15px_rgba(0,255,102,0.4)]"
                    >
                      {isVerifying ? 'VERIFYING...' : 'UNLOCK'}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-2 border border-red-500/80 bg-red-950/40 text-red-400 text-[10px] font-bold rounded flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>{errorMsg}</span>
                  </div>
                )}
              </form>

              {/* Quick helper buttons for testing / convenience */}
              <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between text-[9px] text-emerald-600">
                <span>AUTHENTICATION PROTOCOL v9.0</span>
                <button
                  type="button"
                  onClick={() => {
                    setPasscode('ma9ic');
                  }}
                  className="hover:underline cursor-pointer text-emerald-500"
                >
                  [Autofill &quot;ma9ic&quot;]
                </button>
              </div>
            </div>
          ) : (
            /* UNLOCKED: Hacker Green & Perks Hub */
            <div className="space-y-4">
              {/* Unlock Banner */}
              <div className="p-3 border-2 border-[#00ff66] bg-[#00ff66]/10 rounded shadow-[0_0_20px_rgba(0,255,102,0.2)] text-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-[#00ff66] flex items-center gap-2">
                    <span className="text-lg">🧙‍♂️</span>
                    <span>MA9IC OVERRIDE ACTIVE</span>
                  </div>
                  <span className="px-2 py-0.5 bg-[#00ff66] text-black font-bold text-[9px] rounded-xs">
                    ROOT UNLOCKED
                  </span>
                </div>
                <p className="text-[10px] text-emerald-300">
                  All system restrictions lifted. Switched to Hacker Green Matrix HUD.
                </p>
              </div>

              {/* Terminal Execution Log */}
              {terminalLogs.length > 0 && (
                <div className="p-2.5 border border-[#00ff66]/40 bg-black text-[9px] text-[#00ff66] font-mono rounded space-y-0.5 max-h-28 overflow-y-auto">
                  {terminalLogs.map((log, i) => (
                    <div key={i} className="animate-fade-in">{log}</div>
                  ))}
                </div>
              )}

              {/* Unlocked Capabilities Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                <div className="p-2.5 border border-[#00ff66]/40 bg-black/50 rounded space-y-1">
                  <div className="text-[#00ff66] font-bold flex items-center gap-1">
                    <span>👑</span>
                    <span>ALL AVATARS & EMOJIS</span>
                  </div>
                  <p className="text-emerald-400/80 text-[9px]">
                    18+ secret wizard, hacker, skull & neon icons unlocked in Profile Card.
                  </p>
                </div>

                <div className="p-2.5 border border-[#00ff66]/40 bg-black/50 rounded space-y-1">
                  <div className="text-[#00ff66] font-bold flex items-center gap-1">
                    <span>💻</span>
                    <span>HACKER GREEN THEME</span>
                  </div>
                  <p className="text-emerald-400/80 text-[9px]">
                    Cyber Deck terminal UI with Matrix rain, high-contrast glow & retro CRT FX.
                  </p>
                </div>
              </div>

              {/* Cheats & Developer Actions */}
              <div className="p-3 border border-[#00ff66]/40 bg-black/40 rounded space-y-2">
                <div className="text-[10px] font-bold text-[#00ff66] uppercase tracking-wider">
                  ⚡ QUICK HACK CONTROLS:
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleMaxStats}
                    className="px-2.5 py-1.5 border border-[#00ff66] bg-[#00ff66]/20 hover:bg-[#00ff66] hover:text-black text-[#00ff66] font-bold text-[9px] rounded cursor-pointer transition-colors"
                  >
                    ✦ MAX PROFILE STATS (999k PTS)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playHackerUnlock();
                      onSwitchToHackerGreen();
                    }}
                    className="px-2.5 py-1.5 border border-[#00ff66] bg-[#00ff66]/20 hover:bg-[#00ff66] hover:text-black text-[#00ff66] font-bold text-[9px] rounded cursor-pointer transition-colors"
                  >
                    ✦ FORCE HACKER GREEN THEME
                  </button>
                </div>
              </div>

              {/* Developer Note (The rest will program later) */}
              <div className="p-2.5 border border-dashed border-[#00ff66]/50 bg-[#00ff66]/5 rounded text-[10px] text-emerald-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>🛠️</span>
                  <span>The rest will program later.</span>
                </span>
                <span className="text-[8px] text-emerald-500 font-bold">STAGE: READY</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#00ff66]/30 bg-black/70 flex items-center justify-between text-[9px] text-emerald-500">
          <span>STATUS: {isUnlocked || justUnlocked ? 'UNLOCKED (MA9IC)' : 'LOCKED'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#00ff66] text-black font-bold cursor-pointer rounded hover:bg-[#33ff88]"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};

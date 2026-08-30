import React from 'react';
import { MatrixRain } from './MatrixRain';
import { sound } from '../utils/sound';

interface CyberConsoleProps {
  children: React.ReactNode;
  onOpenSkinSelect?: () => void;
  onToggleSound?: () => void;
  isSoundEnabled?: boolean;
}

export const CyberConsole: React.FC<CyberConsoleProps> = ({
  children,
  onOpenSkinSelect,
  onToggleSound,
  isSoundEnabled = true,
}) => {
  return (
    <div className="min-h-screen bg-[#030a06] text-emerald-100 flex flex-col justify-between relative overflow-hidden font-mono select-none">
      {/* 1. Matrix Digital Rain Canvas */}
      <MatrixRain />

      {/* 2. Top Cyber Deck HUD Bar */}
      <header className="relative z-20 w-full border-b border-emerald-500/30 bg-[#040d07]/90 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,255,102,0.15)]">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00ff66] shadow-[0_0_8px_#00ff66] animate-pulse" />
          <div>
            <div className="text-xs sm:text-sm font-bold tracking-widest text-[#00ff66] matrix-glow-text flex items-center gap-1.5">
              <span>ANAGRAMS</span>
              <span className="text-[10px] text-emerald-400/80 font-normal">// CYBER DECK</span>
            </div>
            <div className="text-[8px] text-emerald-500/80 tracking-tighter sm:tracking-normal">
              ORIGINAL MATRIX INTERFACE v2.4
            </div>
          </div>
        </div>

        {/* Right: Skin Switcher & Quick Controls */}
        <div className="flex items-center gap-2">
          {/* Skin selector button */}
          <button
            type="button"
            onClick={() => {
              sound.playButtonClick();
              if (onOpenSkinSelect) onOpenSkinSelect();
            }}
            className="px-2.5 py-1 rounded border border-[#00ff66]/60 bg-[#00ff66]/10 hover:bg-[#00ff66]/20 text-[#00ff66] text-[9px] sm:text-[10px] font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(0,255,102,0.2)] active:scale-95 transition-all"
            title="Switch UI Skin / Theme"
          >
            <span>🎨</span>
            <span className="hidden sm:inline">SKIN:</span>
            <span>CYBER MATRIX</span>
          </button>

          {/* Sound Toggle */}
          {onToggleSound && (
            <button
              type="button"
              onClick={() => {
                sound.playButtonClick();
                onToggleSound();
              }}
              className={`p-1.5 rounded border text-[10px] cursor-pointer transition-all ${
                isSoundEnabled
                  ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                  : 'border-zinc-700 bg-zinc-900/60 text-zinc-500'
              }`}
              title={isSoundEnabled ? 'Mute Sound' : 'Enable Sound'}
            >
              {isSoundEnabled ? '🔊' : '🔇'}
            </button>
          )}
        </div>
      </header>

      {/* 3. Main Center Deck Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 w-full max-w-xl mx-auto my-auto">
        <div className="w-full matrix-panel rounded-xl overflow-hidden border border-[#00ff66]/40 shadow-[0_0_35px_rgba(0,255,102,0.15)] flex flex-col min-h-[460px] sm:min-h-[500px]">
          {children}
        </div>
      </main>

      {/* 4. Bottom Cyber Keyboard / Shortcut Ribbon */}
      <footer className="relative z-20 w-full border-t border-emerald-500/20 bg-[#040d07]/80 backdrop-blur-sm px-4 py-1.5 text-center text-[8px] sm:text-[9px] text-emerald-400/70 flex items-center justify-center gap-4 flex-wrap">
        <span><kbd className="px-1 py-0.5 border border-emerald-600/50 bg-emerald-950/50 rounded text-emerald-300">ENTER</kbd> / <kbd className="px-1 py-0.5 border border-emerald-600/50 bg-emerald-950/50 rounded text-emerald-300">Z</kbd> SUBMIT</span>
        <span><kbd className="px-1 py-0.5 border border-emerald-600/50 bg-emerald-950/50 rounded text-emerald-300">BACKSPACE</kbd> / <kbd className="px-1 py-0.5 border border-emerald-600/50 bg-emerald-950/50 rounded text-emerald-300">X</kbd> CLEAR</span>
        <span><kbd className="px-1 py-0.5 border border-emerald-600/50 bg-emerald-950/50 rounded text-emerald-300">SPACE</kbd> SHUFFLE</span>
      </footer>
    </div>
  );
};

import React from 'react';
import { sound } from '../utils/sound';

interface NormalConsoleProps {
  children: React.ReactNode;
  onOpenSkinSelect?: () => void;
  onToggleSound?: () => void;
  isSoundEnabled?: boolean;
}

export const NormalConsole: React.FC<NormalConsoleProps> = ({
  children,
  onOpenSkinSelect,
  onToggleSound,
  isSoundEnabled = true,
}) => {
  return (
    <div className="min-h-screen bg-[#0b1329] bg-radial from-[#1e293b] via-[#0f172a] to-[#020617] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background Subtle Wood Grain & Radial Felt Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(217,119,6,0.08)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(30,41,59,0.5)_0%,transparent_70%)] pointer-events-none" />

      {/* 1. Header: Classic GamePigeon Style App Bar */}
      <header className="relative z-20 w-full border-b border-amber-900/40 bg-slate-900/90 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 border border-amber-700 shadow-md flex items-center justify-center font-black text-amber-950 text-base">
            A
          </div>
          <div>
            <div className="text-sm sm:text-base font-extrabold tracking-tight text-amber-100 flex items-center gap-2">
              <span>ANAGRAMS</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold tracking-normal">
                ORIGINAL
              </span>
            </div>
            <div className="text-[9px] text-slate-400 font-medium">
              Classic Wood Tiles & Felt Board
            </div>
          </div>
        </div>

        {/* Right: Skin Switcher & Sound Toggle */}
        <div className="flex items-center gap-2">
          {/* Skin selector button */}
          <button
            id="normal-skin-picker-btn"
            type="button"
            onClick={() => {
              sound.playButtonClick();
              if (onOpenSkinSelect) onOpenSkinSelect();
            }}
            className="px-2.5 py-1.5 rounded-lg border border-amber-600/50 bg-gradient-to-b from-amber-700/30 to-amber-900/40 hover:from-amber-600/40 hover:to-amber-800/50 text-amber-200 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
            title="Switch UI Skin / Theme"
          >
            <span>🎨</span>
            <span className="hidden sm:inline">SKIN:</span>
            <span>NORMAL</span>
          </button>

          {/* Sound Toggle */}
          {onToggleSound && (
            <button
              type="button"
              onClick={() => {
                sound.playButtonClick();
                onToggleSound();
              }}
              className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                isSoundEnabled
                  ? 'border-amber-600/40 bg-slate-800/80 text-amber-300 hover:bg-slate-700'
                  : 'border-slate-700 bg-slate-900/80 text-slate-500'
              }`}
              title={isSoundEnabled ? 'Mute Sound' : 'Enable Sound'}
            >
              {isSoundEnabled ? '🔊' : '🔇'}
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Game Felt Table Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 w-full max-w-xl mx-auto my-auto">
        <div className="w-full rounded-2xl overflow-hidden border-2 border-amber-900/60 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/98 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col min-h-[470px] sm:min-h-[510px]">
          {children}
        </div>
      </main>

      {/* 3. Bottom Keyboard Shortcuts / Footer Bar */}
      <footer className="relative z-20 w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-sm px-4 py-2 text-center text-[9px] sm:text-[10px] text-slate-400 flex items-center justify-center gap-4 flex-wrap">
        <span><kbd className="px-1.5 py-0.5 border border-slate-700 bg-slate-800 rounded font-semibold text-slate-200">ENTER</kbd> SUBMIT</span>
        <span><kbd className="px-1.5 py-0.5 border border-slate-700 bg-slate-800 rounded font-semibold text-slate-200">BACKSPACE</kbd> CLEAR</span>
        <span><kbd className="px-1.5 py-0.5 border border-slate-700 bg-slate-800 rounded font-semibold text-slate-200">SPACE</kbd> SHUFFLE</span>
      </footer>
    </div>
  );
};

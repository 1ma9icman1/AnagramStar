import React, { useState } from 'react';
import { sound } from '../utils/sound';

export type NokiaLcdTheme = 'classic' | 'ice' | 'amber';

interface NokiaConsoleProps {
  children: React.ReactNode;
  onAPress?: () => void; // Navi-key / Select
  onBPress?: () => void; // C / Clear / Back
  onSelectPress?: () => void; // * / Shuffle / Menu
  onStartPress?: () => void; // # / Call / Start / Submit
  onDpadPress?: (dir: 'up' | 'down' | 'left' | 'right') => void; // Scroll keys
  onKeypadDigit?: (digit: string) => void;
  onOpenSkinSelect?: () => void;
  onToggleSound?: () => void;
  isSoundEnabled?: boolean;
}

export const NokiaConsole: React.FC<NokiaConsoleProps> = ({
  children,
  onAPress,
  onBPress,
  onSelectPress,
  onStartPress,
  onDpadPress,
  onKeypadDigit,
  onOpenSkinSelect,
  onToggleSound,
  isSoundEnabled = true,
}) => {
  const [lcdTheme, setLcdTheme] = useState<NokiaLcdTheme>('classic');
  const [isPlayingRingtone, setIsPlayingRingtone] = useState(false);

  const handlePlayNokiaTune = () => {
    sound.playNokiaTune();
    setIsPlayingRingtone(true);
    setTimeout(() => setIsPlayingRingtone(false), 2400);
  };

  const handleKeyClick = (digit: string, noteKey?: string | number) => {
    sound.playNokiaKeyBeep(noteKey ?? digit);
    if (digit === '*') {
      if (onSelectPress) onSelectPress();
    } else if (digit === '#') {
      if (onStartPress) onStartPress();
    } else if (digit === '0') {
      if (onBPress) onBPress();
    } else if (onKeypadDigit) {
      onKeypadDigit(digit);
    } else {
      // Default: map 2-9 digits to letter picking if available
      if (onAPress) onAPress();
    }
  };

  const lcdThemeClasses = {
    classic: 'nokia-lcd',
    ice: 'nokia-lcd nokia-lcd-blue',
    amber: 'nokia-lcd nokia-lcd-amber',
  }[lcdTheme];

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-200 flex flex-col items-center justify-center p-2 sm:p-4 select-none relative overflow-x-hidden font-sans">
      {/* Background Ambience / Retro Matrix Backdrop */}
      <div className="fixed inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#24355a_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Top Header Utilities */}
      <header className="w-full max-w-md flex items-center justify-between px-3 py-2 mb-2 z-20 text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-sm">📱</span>
          <span className="font-bold tracking-widest text-slate-300">NOKIA 3310</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            CONNECTING PEOPLE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Ringtone test */}
          <button
            id="nokia-tune-btn"
            type="button"
            onClick={handlePlayNokiaTune}
            disabled={isPlayingRingtone}
            className="px-2 py-0.5 rounded border border-blue-500/40 bg-blue-950/40 text-blue-300 hover:bg-blue-900/50 cursor-pointer active:scale-95 text-[9px] font-mono flex items-center gap-1 transition-all"
            title="Play Iconic Nokia Tune"
          >
            <span>🎵</span>
            <span className="hidden sm:inline">RINGTONE</span>
          </button>

          {/* Skin Select Button */}
          <button
            id="nokia-skin-switch-btn"
            type="button"
            onClick={() => {
              sound.playNokiaKeyBeep();
              if (onOpenSkinSelect) onOpenSkinSelect();
            }}
            className="px-2 py-0.5 rounded border border-amber-500/40 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 cursor-pointer active:scale-95 text-[9px] font-mono flex items-center gap-1 transition-all"
          >
            <span>🎨</span>
            <span>SKIN</span>
          </button>
        </div>
      </header>

      {/* NOKIA 3310 PHYSICAL CHASSIS */}
      <div
        id="nokia-phone-chassis"
        className="w-full max-w-[390px] sm:max-w-[420px] nokia-shell p-4 sm:p-5 flex flex-col items-center relative z-10 border-2 border-slate-900/80"
      >
        {/* Top Ridge / Power Button */}
        <div className="w-full flex justify-center -mt-5 mb-2">
          <button
            type="button"
            onClick={handlePlayNokiaTune}
            className="w-16 h-3 bg-[#0a101d] rounded-t-lg border-t border-x border-slate-700/60 shadow-inner hover:bg-slate-800 cursor-pointer flex items-center justify-center text-[7px] text-slate-500 font-bold"
            title="Power / Ringtone Button"
          >
            POWER
          </button>
        </div>

        {/* Earpiece Speaker Grille + NOKIA Logo */}
        <div className="w-full flex flex-col items-center mb-3">
          <div className="w-12 h-2 rounded-full bg-[#0b1220] shadow-inner border border-slate-800 flex items-center justify-center gap-1">
            <div className="w-1.5 h-0.5 bg-slate-600 rounded-full" />
            <div className="w-1.5 h-0.5 bg-slate-600 rounded-full" />
            <div className="w-1.5 h-0.5 bg-slate-600 rounded-full" />
          </div>
          <div className="text-[11px] font-black tracking-[0.25em] text-slate-300 mt-1 drop-shadow font-mono">
            NOKIA
          </div>
        </div>

        {/* Silver Outer Faceplate Bezel */}
        <div className="w-full nokia-faceplate p-2.5 sm:p-3 flex flex-col items-center mb-3">
          {/* LCD Screen Outer Well */}
          <div className="w-full nokia-lcd-bezel p-2 rounded-xl shadow-inner flex flex-col">
            {/* Nokia 3310 LCD Screen Frame (84x48 proportion feel) */}
            <div
              className={`w-full rounded-lg ${lcdThemeClasses} p-2 flex flex-col justify-between shadow-inner min-h-[380px] sm:min-h-[400px] relative overflow-hidden transition-colors duration-300`}
            >
              {/* Pixel Grid Texture */}
              <div className="absolute inset-0 lcd-pixel-grid pointer-events-none opacity-40" />
              {/* Glass Reflection Glare */}
              <div className="absolute inset-0 lcd-glare" />

              {/* LCD Top Status Ribbon */}
              <div className="relative z-10 w-full flex items-center justify-between border-b border-current/20 pb-1 text-[8px] font-bold">
                {/* Left: Signal Bars */}
                <div className="flex items-center gap-1">
                  <span className="text-[7px]">📶</span>
                  <span className="tracking-tighter">IIII</span>
                  <span className="hidden sm:inline text-[7px] ml-1">ANAGRAMS</span>
                </div>

                {/* Center: Operator Title */}
                <div className="text-[7px] tracking-wider text-center font-bold">
                  {isPlayingRingtone ? '♪ RINGING ♪' : 'NOKIA 3310'}
                </div>

                {/* Right: Sound & Battery */}
                <div className="flex items-center gap-1">
                  <span>{isSoundEnabled ? '🔔' : '🔕'}</span>
                  <span className="text-[7px]">BAT</span>
                  <span className="border border-current px-0.5 text-[6px] tracking-tighter">[||||]</span>
                </div>
              </div>

              {/* Main Game Contents */}
              <div className="relative z-10 flex-1 flex flex-col justify-between my-1">
                {children}
              </div>

              {/* LCD Bottom Softkey Bar */}
              <div className="relative z-10 w-full flex items-center justify-between border-t border-current/20 pt-1 text-[7px] sm:text-[8px] font-bold">
                <span className="tracking-wider">Menu</span>
                <span className="border border-current px-1.5 py-0.2 bg-black/10 rounded-sm">
                  [ Select ]
                </span>
                <span className="tracking-wider">Clear</span>
              </div>
            </div>
          </div>

          {/* LCD Backlight Color Selector Pills */}
          <div className="flex items-center gap-2 mt-2 text-[7px] text-slate-800 font-bold">
            <span>BACKLIGHT:</span>
            <button
              type="button"
              onClick={() => {
                sound.playNokiaKeyBeep();
                setLcdTheme('classic');
              }}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                lcdTheme === 'classic' ? 'bg-[#11240e] text-[#9cb885]' : 'bg-slate-300 text-slate-700'
              }`}
            >
              GREEN
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playNokiaKeyBeep();
                setLcdTheme('ice');
              }}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                lcdTheme === 'ice' ? 'bg-[#06191c] text-[#79aeb2]' : 'bg-slate-300 text-slate-700'
              }`}
            >
              ICE BLUE
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playNokiaKeyBeep();
                setLcdTheme('amber');
              }}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                lcdTheme === 'amber' ? 'bg-[#261503] text-[#d19a4e]' : 'bg-slate-300 text-slate-700'
              }`}
            >
              AMBER
            </button>
          </div>
        </div>

        {/* NOKIA 3310 SOFTKEY & NAVIGATION CLUSTER */}
        <div className="w-full flex items-center justify-between px-3 py-1 mb-2">
          {/* Left: [ C ] Button (Clear / Back) */}
          <button
            id="nokia-c-btn"
            type="button"
            onClick={() => {
              sound.playNokiaKeyBeep('C');
              if (onBPress) onBPress();
            }}
            className="w-14 h-9 nokia-sub-btn rounded-lg flex flex-col items-center justify-center font-bold text-xs text-slate-900 cursor-pointer active:scale-95"
            title="[C] Clear / Back"
          >
            <span className="font-mono text-sm leading-none">C</span>
            <span className="text-[6px] text-slate-700">CLEAR</span>
          </button>

          {/* Center: Large Silver Navi-Key (Select / Submit / Action) */}
          <button
            id="nokia-navikey-btn"
            type="button"
            onClick={() => {
              sound.playNokiaKeyBeep(1);
              if (onAPress) onAPress();
            }}
            className="w-24 h-11 nokia-navikey rounded-xl flex flex-col items-center justify-center font-bold text-slate-900 cursor-pointer active:scale-95 shadow-md"
            title="Navi-Key (Select / Confirm / Submit)"
          >
            <div className="w-12 h-1 bg-slate-500 rounded-full mb-0.5 opacity-60" />
            <span className="font-mono text-[10px] tracking-wider leading-tight">SELECT</span>
          </button>

          {/* Right: Scroll Up / Down Rocker Button */}
          <div className="flex flex-col gap-1">
            <button
              id="nokia-scroll-up-btn"
              type="button"
              onClick={() => {
                sound.playNokiaKeyBeep(2);
                if (onDpadPress) onDpadPress('up');
              }}
              className="w-14 h-4.5 nokia-sub-btn rounded-t-md flex items-center justify-center font-bold text-[8px] text-slate-900 cursor-pointer active:scale-95"
              title="Scroll Up"
            >
              ▲
            </button>
            <button
              id="nokia-scroll-down-btn"
              type="button"
              onClick={() => {
                sound.playNokiaKeyBeep(8);
                if (onDpadPress) onDpadPress('down');
              }}
              className="w-14 h-4.5 nokia-sub-btn rounded-b-md flex items-center justify-center font-bold text-[8px] text-slate-900 cursor-pointer active:scale-95"
              title="Scroll Down"
            >
              ▼
            </button>
          </div>
        </div>

        {/* Quick Call (Green) & End (Red) Row */}
        <div className="w-full flex items-center justify-between px-6 mb-2">
          <button
            id="nokia-call-btn"
            type="button"
            onClick={() => {
              sound.playNokiaKeyBeep('#');
              if (onStartPress) onStartPress();
            }}
            className="px-3 py-1 bg-emerald-700/80 hover:bg-emerald-600 rounded-full border border-emerald-500 text-[8px] font-bold text-emerald-100 cursor-pointer active:scale-95 flex items-center gap-1 shadow"
            title="Call / Submit / Start"
          >
            <span>📞</span>
            <span>START</span>
          </button>

          <button
            id="nokia-end-btn"
            type="button"
            onClick={() => {
              sound.playNokiaKeyBeep('*');
              if (onBPress) onBPress();
            }}
            className="px-3 py-1 bg-rose-700/80 hover:bg-rose-600 rounded-full border border-rose-500 text-[8px] font-bold text-rose-100 cursor-pointer active:scale-95 flex items-center gap-1 shadow"
            title="End / Exit to Menu"
          >
            <span>🔴</span>
            <span>EXIT</span>
          </button>
        </div>

        {/* NOKIA 3310 NUMERIC KEYPAD (12 KEYS) */}
        <div className="w-full grid grid-cols-3 gap-2 px-3 pt-1 pb-2">
          {/* Row 1 */}
          <button
            type="button"
            onClick={() => handleKeyClick('1', 1)}
            className="h-10 nokia-key flex flex-col items-center justify-center cursor-pointer active:scale-95 text-slate-200"
          >
            <span className="font-bold text-sm leading-none">1</span>
            <span className="text-[6px] text-slate-400 tracking-tight">⌫ DEL</span>
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('2', 2)}
            className="h-10 nokia-key flex flex-col items-center justify-center cursor-pointer active:scale-95 text-slate-200"
          >
            <span className="font-bold text-sm leading-none">2</span>
            <span className="text-[6px] text-slate-400 tracking-tight">abc</span>
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('3', 3)}
            className="h-10 nokia-key flex flex-col items-center justify-center cursor-pointer active:scale-95 text-slate-200"
          >
            <span className="font-bold text-sm leading-none">3</span>
            <span className="text-[6px] text-slate-400 tracking-tight">def</span>
          </button>

          {/* Row 2 */}
          <button
            type="button"
            onClick={() => handleKeyClick('4', 4)}
            className="h-10 nokia-key flex flex-col items-center justify-center cursor-pointer active:scale-95 text-slate-200"
          >
            <span className="font-bold text-sm leading-none">4</span>
            <span className="text-[6px] text-slate-400 tracking-tight">ghi</span>
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('5', 5)}
            className="h-10 nokia-key flex flex-col items-center justify-center cursor-pointer active:scale-95 text-slate-200"
          >
            <span className="font-bold text-sm leading-none">5</span>
            <span className="text-[6px] text-slate-400 tracking-tight">jkl</span>
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('6', 6)}
            className="h-10 nokia-key flex flex-col items-center justify-center cursor-pointer active:scale-95 text-slate-200"
          >
            <span className="font-bold text-sm leading-none">6</span>
            <span className="text-[6px] text-slate-400 tracking-tight">mno</span>
          </button>

          {/* Row 3 */}
          <button
            type="button"
            onClick={() => handleKeyClick('7', 7)}
            className="h-10 nokia-key flex flex-col items-center justify-center cursor-pointer active:scale-95 text-slate-200"
          >
            <span className="font-bold text-sm leading-none">7</span>
            <span className="text-[6px] text-slate-400 tracking-tight">pqrs</span>
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('8', 8)}
            className="h-10 nokia-key flex flex-col items-center justify-center cursor-pointer active:scale-95 text-slate-200"
          >
            <span className="font-bold text-sm leading-none">8</span>
            <span className="text-[6px] text-slate-400 tracking-tight">tuv</span>
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('9', 9)}
            className="h-10 nokia-key flex flex-col items-center justify-center cursor-pointer active:scale-95 text-slate-200"
          >
            <span className="font-bold text-sm leading-none">9</span>
            <span className="text-[6px] text-slate-400 tracking-tight">wxyz</span>
          </button>

          {/* Row 4 */}
          <button
            type="button"
            onClick={() => handleKeyClick('*', '*')}
            className="h-10 nokia-key flex flex-col items-center justify-center cursor-pointer active:scale-95 text-amber-300"
            title="Shuffle Rack Tiles"
          >
            <span className="font-bold text-sm leading-none">*</span>
            <span className="text-[6px] text-amber-400/80 tracking-tight">🔀 SHUFFLE</span>
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('0', 0)}
            className="h-10 nokia-key flex flex-col items-center justify-center cursor-pointer active:scale-95 text-slate-200"
            title="Space / Clear"
          >
            <span className="font-bold text-sm leading-none">0</span>
            <span className="text-[6px] text-slate-400 tracking-tight">␣ SPACE</span>
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('#', '#')}
            className="h-10 nokia-key flex flex-col items-center justify-center cursor-pointer active:scale-95 text-emerald-300"
            title="Submit Word / Confirm"
          >
            <span className="font-bold text-sm leading-none">#</span>
            <span className="text-[6px] text-emerald-400/80 tracking-tight">↵ SUBMIT</span>
          </button>
        </div>

        {/* Bottom Microphone Pin Hole */}
        <div className="w-1.5 h-1.5 bg-black rounded-full shadow-inner mt-1" />
      </div>

      {/* Keyboard Shortcuts Guide */}
      <footer className="mt-3 text-center text-[8px] sm:text-[9px] text-slate-500 font-mono flex items-center justify-center gap-3 flex-wrap">
        <span><kbd className="px-1 py-0.5 border border-slate-700 bg-slate-900 rounded text-slate-300">ENTER / Z</kbd> NAVI-KEY</span>
        <span><kbd className="px-1 py-0.5 border border-slate-700 bg-slate-900 rounded text-slate-300">BACKSPACE / X</kbd> [C] CLEAR</span>
        <span><kbd className="px-1 py-0.5 border border-slate-700 bg-slate-900 rounded text-slate-300">SPACE / *</kbd> SHUFFLE</span>
        <span><kbd className="px-1 py-0.5 border border-slate-700 bg-slate-900 rounded text-slate-300">ARROWS</kbd> SCROLL</span>
      </footer>
    </div>
  );
};

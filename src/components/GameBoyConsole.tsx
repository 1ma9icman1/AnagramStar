import React, { useState, useEffect } from 'react';
import { sound } from '../utils/sound';

export type LcdPalette = 'dmg' | 'pocket' | 'light' | 'gbc';

interface GameBoyConsoleProps {
  children: React.ReactNode;
  onDpadPress?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onAPress?: () => void;
  onBPress?: () => void;
  onSelectPress?: () => void;
  onStartPress?: () => void;
  currentPalette?: LcdPalette;
  onPaletteChange?: (palette: LcdPalette) => void;
}

export const GameBoyConsole: React.FC<GameBoyConsoleProps> = ({
  children,
  onDpadPress,
  onAPress,
  onBPress,
  onSelectPress,
  onStartPress,
  currentPalette = 'dmg',
  onPaletteChange,
}) => {
  const [isPoweredOn, setIsPoweredOn] = useState(true);
  const [activeButton, setActiveButton] = useState<string | null>(null);

  // Switch palette helper
  const cyclePalette = () => {
    sound.playButtonClick();
    const palettes: LcdPalette[] = ['dmg', 'pocket', 'light', 'gbc'];
    const currentIdx = palettes.indexOf(currentPalette as LcdPalette);
    const nextIdx = (currentIdx >= 0 ? currentIdx + 1 : 0) % palettes.length;
    const nextPalette = palettes[nextIdx];
    if (onPaletteChange) {
      onPaletteChange(nextPalette);
    }
  };

  const handlePowerToggle = () => {
    sound.playButtonClick();
    if (!isPoweredOn) {
      setIsPoweredOn(true);
      setTimeout(() => {
        sound.playStartChime();
      }, 150);
    } else {
      setIsPoweredOn(false);
    }
  };

  const triggerButton = (btnKey: string, action?: () => void) => {
    sound.playButtonClick();
    setActiveButton(btnKey);
    setTimeout(() => setActiveButton(null), 120);
    if (action && isPoweredOn) {
      action();
    }
  };

  return (
    <div className="min-h-screen bg-[#141517] flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 select-none font-['Silkscreen',sans-serif]">
      {/* Top Power Switch & Cartridge Ridge */}
      <div className="w-full max-w-[440px] flex items-center justify-between px-6 pb-1 text-[9px] font-mono text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="text-[8px] tracking-wider uppercase font-bold text-zinc-400">◄ OFF • ON ►</span>
          <button
            type="button"
            onClick={handlePowerToggle}
            className={`w-9 h-3.5 rounded-sm transition-all duration-200 border border-zinc-700 relative cursor-pointer shadow-inner ${
              isPoweredOn ? 'bg-emerald-600' : 'bg-zinc-800'
            }`}
            title="Toggle Console Power"
          >
            <div
              className={`w-4 h-3 rounded-xs bg-zinc-300 border border-zinc-500 absolute top-0 transition-transform duration-200 ${
                isPoweredOn ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Palette cycler */}
        <button
          type="button"
          onClick={cyclePalette}
          className="text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded border border-zinc-600 cursor-pointer flex items-center gap-1"
          title="Switch LCD Screen Palette"
        >
          <span>LCD:</span>
          <span className="text-amber-300 font-bold uppercase">{currentPalette}</span>
        </button>
      </div>

      {/* Main Game Boy DMG Console Body */}
      <div
        id="gameboy-chassis"
        className="w-full max-w-[440px] gb-shell rounded-t-[18px] rounded-b-[40px] rounded-br-[64px] p-4 sm:p-6 pb-8 sm:pb-10 relative border-2 border-[#b0aea4] transition-all"
      >
        {/* Top Cartridge Notch Grooves */}
        <div className="flex items-center justify-center gap-1 mb-2">
          <div className="w-8 h-1 bg-[#a3a199] rounded-full" />
          <div className="w-20 h-1.5 bg-[#8f8d85] rounded-full shadow-inner" />
          <div className="w-8 h-1 bg-[#a3a199] rounded-full" />
        </div>

        {/* SCREEN BEZEL */}
        <div className="gb-bezel rounded-t-xl rounded-b-[24px] p-3 sm:p-4 pt-2.5 shadow-xl relative mb-4">
          {/* Top Bezel Header: Dual Pinstripes & Text */}
          <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-black/20 text-[7px] sm:text-[8px] font-sans font-bold tracking-widest">
            {/* Left Magenta Stripe */}
            <div className="flex items-center gap-1">
              <div className="w-6 sm:w-10 h-0.5 bg-[#8b1542]" />
              <div className="w-4 sm:w-6 h-0.5 bg-[#002277]" />
            </div>
            
            <div className="text-zinc-200 tracking-wider font-extrabold uppercase scale-90 sm:scale-100 flex items-center gap-1">
              <span>DOT MATRIX WITH STEREO SOUND</span>
            </div>

            {/* Right Blue Stripe */}
            <div className="flex items-center gap-1">
              <div className="w-4 sm:w-6 h-0.5 bg-[#002277]" />
              <div className="w-6 sm:w-10 h-0.5 bg-[#8b1542]" />
            </div>
          </div>

          {/* LCD Screen Enclosure */}
          <div className="relative flex items-center gap-2">
            {/* Battery Indicator on Left Bezel */}
            <div className="flex flex-col items-center justify-center gap-1 pl-0.5 pr-1 text-center shrink-0">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  isPoweredOn ? 'battery-led' : 'bg-red-950 border border-zinc-700'
                }`}
              />
              <span className="text-[6px] text-zinc-300 font-sans tracking-tighter uppercase font-bold leading-tight">
                BATTERY
              </span>
            </div>

            {/* LCD Screen Display Frame */}
            <div
              id="gameboy-lcd-screen"
              className={`
                flex-1 gb-lcd-well rounded-md overflow-hidden relative min-h-[380px] sm:min-h-[420px] flex flex-col justify-between
                palette-${currentPalette} lcd-pixel-grid transition-colors duration-300 border-2 border-black/40
              `}
            >
              {/* Glass Reflection Overlay */}
              <div className="absolute inset-0 lcd-glare z-20 pointer-events-none" />

              {/* Power Off Mask or Content */}
              {!isPoweredOn ? (
                <div className="absolute inset-0 bg-[#0d1c0d] flex flex-col items-center justify-center text-center z-30 p-4">
                  <div className="w-12 h-1 bg-[#1a381a] rounded-full mb-3" />
                  <span className="text-[10px] text-[#2a5c2a] font-['Press_Start_2P',monospace]">POWER OFF</span>
                  <span className="text-[8px] text-[#1a381a] mt-2 font-mono">SLIDE POWER SWITCH TO RESUME</span>
                </div>
              ) : (
                <div className="relative z-10 w-full h-full flex flex-col flex-1">
                  {children}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Console Branding below Bezel */}
        <div className="flex items-center justify-between px-2 mb-4">
          <div className="flex items-baseline gap-1 text-[#002277] italic font-black select-none">
            <span className="text-[9px] sm:text-[10px] tracking-tight font-sans not-italic font-bold">Nintendo</span>
            <span className="text-base sm:text-lg tracking-wider font-sans uppercase">ANAGRAM BOY</span>
            <span className="text-[7px] not-italic font-bold -top-1 relative">™</span>
          </div>

          <div className="text-[8px] font-mono font-bold text-zinc-600 bg-zinc-300/60 px-1.5 py-0.5 rounded border border-zinc-400">
            DMG-01
          </div>
        </div>

        {/* PHYSICAL CONTROLS AREA */}
        <div className="flex items-center justify-between px-2 sm:px-4 mt-2">
          {/* 1. D-PAD CROSS */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            {/* D-Pad Base Well */}
            <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#b8b6ad] shadow-inner border border-zinc-400/50" />

            {/* D-Pad Cross Body */}
            <div className="relative z-10 w-24 h-24 sm:w-26 sm:h-26">
              {/* Up Button */}
              <button
                type="button"
                onClick={() => triggerButton('up', () => onDpadPress && onDpadPress('up'))}
                className={`absolute top-0 left-8 sm:left-8.5 w-8 sm:w-9 h-8 sm:h-9 gb-dpad-btn rounded-t-sm flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer ${
                  activeButton === 'up' ? 'scale-95 bg-black' : ''
                }`}
                title="D-Pad Up"
              >
                <span className="text-[8px] leading-none mb-1">▲</span>
              </button>

              {/* Down Button */}
              <button
                type="button"
                onClick={() => triggerButton('down', () => onDpadPress && onDpadPress('down'))}
                className={`absolute bottom-0 left-8 sm:left-8.5 w-8 sm:w-9 h-8 sm:h-9 gb-dpad-btn rounded-b-sm flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer ${
                  activeButton === 'down' ? 'scale-95 bg-black' : ''
                }`}
                title="D-Pad Down"
              >
                <span className="text-[8px] leading-none mt-1">▼</span>
              </button>

              {/* Left Button */}
              <button
                type="button"
                onClick={() => triggerButton('left', () => onDpadPress && onDpadPress('left'))}
                className={`absolute top-8 sm:top-8.5 left-0 w-8 sm:w-9 h-8 sm:h-9 gb-dpad-btn rounded-l-sm flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer ${
                  activeButton === 'left' ? 'scale-95 bg-black' : ''
                }`}
                title="D-Pad Left"
              >
                <span className="text-[8px] leading-none mr-1">◀</span>
              </button>

              {/* Right Button */}
              <button
                type="button"
                onClick={() => triggerButton('right', () => onDpadPress && onDpadPress('right'))}
                className={`absolute top-8 sm:top-8.5 right-0 w-8 sm:w-9 h-8 sm:h-9 gb-dpad-btn rounded-r-sm flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer ${
                  activeButton === 'right' ? 'scale-95 bg-black' : ''
                }`}
                title="D-Pad Right"
              >
                <span className="text-[8px] leading-none ml-1">▶</span>
              </button>

              {/* Center Pivot Concave */}
              <div className="absolute top-8 sm:top-8.5 left-8 sm:left-8.5 w-8 sm:w-9 h-8 sm:h-9 gb-dpad-center flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-[#18181a] shadow-inner" />
              </div>
            </div>
          </div>

          {/* 2. A & B ACTION BUTTONS (Slanted DMG Style) */}
          <div className="relative -rotate-25 flex items-center gap-3 sm:gap-4 p-2 bg-[#b8b6ad] rounded-full border border-zinc-400/40 shadow-inner">
            {/* B Button (Left) */}
            <div className="flex flex-col items-center">
              <button
                id="gb-b-button"
                type="button"
                onClick={() => triggerButton('b', onBPress)}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full gb-action-btn flex items-center justify-center cursor-pointer transition-transform ${
                  activeButton === 'b' ? 'scale-95' : ''
                }`}
                title="B Button (Clear / Back)"
              />
              <span className="text-[10px] font-sans font-bold text-[#8b1542] mt-1 italic">B</span>
            </div>

            {/* A Button (Right) */}
            <div className="flex flex-col items-center">
              <button
                id="gb-a-button"
                type="button"
                onClick={() => triggerButton('a', onAPress)}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full gb-action-btn flex items-center justify-center cursor-pointer transition-transform ${
                  activeButton === 'a' ? 'scale-95' : ''
                }`}
                title="A Button (Submit / Select)"
              />
              <span className="text-[10px] font-sans font-bold text-[#8b1542] mt-1 italic">A</span>
            </div>
          </div>
        </div>

        {/* 3. SELECT & START BUTTONS & SPEAKER GRILLE */}
        <div className="flex items-end justify-between px-6 sm:px-8 mt-6">
          {/* Select and Start Pill Buttons */}
          <div className="flex items-center gap-5 sm:gap-6 -rotate-25">
            {/* SELECT */}
            <div className="flex flex-col items-center">
              <button
                id="gb-select-button"
                type="button"
                onClick={() => triggerButton('select', onSelectPress)}
                className={`w-10 sm:w-12 h-3.5 sm:h-4 rounded-full gb-pill-btn cursor-pointer transition-transform ${
                  activeButton === 'select' ? 'scale-95' : ''
                }`}
                title="SELECT (Shuffle / Options)"
              />
              <span className="text-[8px] font-sans font-bold text-[#002277] tracking-wider mt-1 uppercase">SELECT</span>
            </div>

            {/* START */}
            <div className="flex flex-col items-center">
              <button
                id="gb-start-button"
                type="button"
                onClick={() => triggerButton('start', onStartPress)}
                className={`w-10 sm:w-12 h-3.5 sm:h-4 rounded-full gb-pill-btn cursor-pointer transition-transform ${
                  activeButton === 'start' ? 'scale-95' : ''
                }`}
                title="START (Play / Confirm)"
              />
              <span className="text-[8px] font-sans font-bold text-[#002277] tracking-wider mt-1 uppercase">START</span>
            </div>
          </div>

          {/* Speaker Slats (Diagonal bottom-right) */}
          <div className="flex items-center gap-1.5 -rotate-25 pb-1">
            <div className="w-1.5 h-6 gb-speaker-slat" />
            <div className="w-1.5 h-8 gb-speaker-slat" />
            <div className="w-1.5 h-9 gb-speaker-slat" />
            <div className="w-1.5 h-9 gb-speaker-slat" />
            <div className="w-1.5 h-8 gb-speaker-slat" />
            <div className="w-1.5 h-6 gb-speaker-slat" />
          </div>
        </div>

        {/* Bottom Phones / Jack details */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-6 text-[7px] text-zinc-500 font-mono">
          <span>🎧 PHONES</span>
          <div className="w-3 h-1.5 bg-zinc-700 rounded-b-md" />
        </div>
      </div>
    </div>
  );
};

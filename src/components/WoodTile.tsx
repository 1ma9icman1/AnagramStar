import React from 'react';
import { AppSkin } from '../types/game';

interface WoodTileProps {
  letter: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'normal' | 'small' | 'mini' | 'large';
  isSlotted?: boolean;
  isSelected?: boolean;
  className?: string;
  id?: string;
  skin?: AppSkin;
}

export const WoodTile: React.FC<WoodTileProps> = ({
  letter,
  onClick,
  disabled = false,
  size = 'normal',
  isSlotted = false,
  isSelected = false,
  className = '',
  id,
  skin = 'gameboy',
}) => {
  const isCyber = skin === 'cyber';
  const isNokia = skin === 'nokia';
  const isNormal = skin === 'normal';

  const sizeClasses = {
    mini: 'w-6 h-6 sm:w-7 sm:h-7 text-[10px] sm:text-xs rounded-sm',
    small: 'w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm rounded-sm',
    normal: 'w-10 h-11 sm:w-12 sm:h-13 text-base sm:text-lg rounded-md',
    large: 'w-12 h-13 sm:w-14 sm:h-15 text-lg sm:text-xl rounded-lg',
  }[size];

  let skinClasses = `gb-tile ${isSlotted ? 'ring-2 ring-[var(--lcd-darkest,#0f380f)] scale-105' : ''} ${isSelected ? 'bg-[var(--lcd-dark,#306230)] text-[var(--lcd-bg-light,#9bbc0f)]' : ''}`;
  if (isNormal) {
    skinClasses = `wood-tile-classic ${isSlotted ? 'wood-tile-slotted ring-2 ring-amber-400 scale-105' : ''} ${isSelected ? 'ring-2 ring-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : ''}`;
  } else if (isCyber) {
    skinClasses = `matrix-tile ${isSlotted ? 'ring-2 ring-[#00ffcc] scale-105' : ''} ${isSelected ? 'border-[#00ffcc] text-white shadow-[0_0_20px_#00ffcc]' : ''}`;
  } else if (isNokia) {
    skinClasses = `nokia-tile ${isSlotted ? 'ring-2 ring-[#11240e] scale-105' : ''} ${isSelected ? 'bg-[#11240e] text-[#9cb885]' : ''}`;
  }

  let fontClass = "font-['Press_Start_2P',monospace]";
  if (isNormal) {
    fontClass = "font-sans font-extrabold tracking-normal";
  } else if (isCyber) {
    fontClass = "font-mono tracking-wider";
  } else if (isNokia) {
    fontClass = "font-['Silkscreen',monospace]";
  }

  return (
    <button
      id={id || `tile-${letter}-${Math.random().toString(36).substring(2, 6)}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        ${skinClasses}
        ${sizeClasses}
        flex items-center justify-center font-bold tracking-tight
        transition-all duration-75 select-none cursor-pointer
        ${disabled ? 'opacity-0 scale-75 pointer-events-none' : 'hover:-translate-y-0.5 active:translate-y-0.5'}
        ${className}
      `}
    >
      <span className={`leading-none ${fontClass}`}>
        {letter.toUpperCase()}
      </span>
    </button>
  );
};




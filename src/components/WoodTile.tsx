import React from 'react';

interface WoodTileProps {
  letter: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'normal' | 'small' | 'mini' | 'large';
  isSlotted?: boolean;
  isSelected?: boolean;
  className?: string;
  id?: string;
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
}) => {
  const sizeClasses = {
    mini: 'w-6 h-6 sm:w-7 sm:h-7 text-[10px] sm:text-xs rounded-sm',
    small: 'w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm rounded-sm',
    normal: 'w-10 h-11 sm:w-12 sm:h-13 text-base sm:text-lg rounded-sm',
    large: 'w-12 h-13 sm:w-14 sm:h-15 text-lg sm:text-xl rounded-md',
  }[size];

  return (
    <button
      id={id || `gb-tile-${letter}-${Math.random().toString(36).substring(2, 6)}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        gb-tile
        ${sizeClasses}
        flex items-center justify-center font-bold tracking-tight
        transition-all duration-75 select-none cursor-pointer
        ${disabled ? 'opacity-0 scale-75 pointer-events-none' : 'hover:-translate-y-0.5 active:translate-y-0.5'}
        ${isSlotted ? 'ring-2 ring-[var(--lcd-darkest,#0f380f)] scale-105' : ''}
        ${isSelected ? 'bg-[var(--lcd-dark,#306230)] text-[var(--lcd-bg-light,#9bbc0f)]' : ''}
        ${className}
      `}
    >
      <span className="leading-none font-['Press_Start_2P',monospace]">{letter.toUpperCase()}</span>
    </button>
  );
};



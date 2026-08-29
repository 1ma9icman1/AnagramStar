import React from 'react';

interface WoodTileProps {
  letter: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'normal' | 'small' | 'mini' | 'large';
  isSlotted?: boolean;
  className?: string;
  id?: string;
}

export const WoodTile: React.FC<WoodTileProps> = ({
  letter,
  onClick,
  disabled = false,
  size = 'normal',
  isSlotted = false,
  className = '',
  id,
}) => {
  const sizeClasses = {
    mini: 'w-6 h-6 sm:w-7 sm:h-7 text-xs sm:text-sm rounded-[4px]',
    small: 'w-9 h-9 sm:w-10 sm:h-10 text-base sm:text-lg rounded-[6px]',
    normal: 'w-12 h-14 sm:w-14 sm:h-16 text-2xl sm:text-3xl rounded-[8px]',
    large: 'w-14 h-16 sm:w-16 sm:h-18 text-3xl sm:text-4xl rounded-[10px]',
  }[size];

  const tileStyleClass = size === 'mini' ? 'matrix-tile-mini' : 'matrix-tile';

  return (
    <button
      id={id || `matrix-tile-${letter}-${Math.random().toString(36).substring(2, 6)}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        ${tileStyleClass}
        ${sizeClasses}
        flex items-center justify-center font-black tracking-wider
        transition-all duration-150 transform select-none cursor-pointer
        ${disabled ? 'opacity-0 scale-75 pointer-events-none' : 'hover:-translate-y-1 active:scale-95'}
        ${isSlotted ? 'ring-2 ring-[#00ffcc] ring-offset-1 ring-offset-black shadow-[0_0_15px_#00ffcc]' : ''}
        ${className}
      `}
    >
      <span className="leading-none mt-[-1px] font-['Orbitron',monospace] font-black">{letter.toUpperCase()}</span>
    </button>
  );
};


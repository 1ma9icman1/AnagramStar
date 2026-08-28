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
    mini: 'w-6 h-6 sm:w-7 sm:h-7 text-xs sm:text-sm rounded-[3px]',
    small: 'w-9 h-9 sm:w-10 sm:h-10 text-base sm:text-lg rounded-[5px]',
    normal: 'w-12 h-14 sm:w-14 sm:h-16 text-2xl sm:text-3xl rounded-[7px]',
    large: 'w-14 h-16 sm:w-16 sm:h-18 text-3xl sm:text-4xl rounded-[8px]',
  }[size];

  const tileStyleClass = size === 'mini' ? 'wood-tile-mini' : 'wood-tile';

  return (
    <button
      id={id || `wood-tile-${letter}-${Math.random().toString(36).substring(2, 6)}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        ${tileStyleClass}
        ${sizeClasses}
        flex items-center justify-center font-bold text-slate-900 tracking-tight
        transition-all duration-150 transform select-none cursor-pointer
        ${disabled ? 'opacity-0 scale-75 pointer-events-none' : 'hover:-translate-y-0.5 active:scale-95'}
        ${isSlotted ? 'ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-900' : ''}
        ${className}
      `}
    >
      <span className="leading-none mt-[-1px] font-black">{letter.toUpperCase()}</span>
    </button>
  );
};

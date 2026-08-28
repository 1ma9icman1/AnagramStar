import React from 'react';

interface ScoreBannerProps {
  wordsCount: number;
  score: number;
  avatarEmoji?: string;
  avatarBg?: string;
  playerName?: string;
  isOpponent?: boolean;
  compact?: boolean;
  id?: string;
}

export const ScoreBanner: React.FC<ScoreBannerProps> = ({
  wordsCount,
  score,
  avatarEmoji = '😋',
  avatarBg = '#5865F2',
  playerName,
  isOpponent = false,
  compact = false,
  id,
}) => {
  return (
    <div
      id={id || `score-banner-${isOpponent ? 'opp' : 'user'}`}
      className={`
        torn-paper-banner parchment-texture
        ${compact ? 'px-3 py-2 sm:px-4 sm:py-2.5' : 'px-5 py-3.5 sm:px-6 sm:py-4 max-w-sm w-full mx-auto'}
        flex items-center gap-3 sm:gap-4 select-none
      `}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className={`
            ${compact ? 'w-10 h-10 text-xl' : 'w-13 h-13 sm:w-14 sm:h-14 text-2xl sm:text-3xl'}
            rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-md overflow-hidden
          `}
          style={{ backgroundColor: avatarBg }}
        >
          {avatarEmoji}
        </div>
        {playerName && (
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-900/80 text-[10px] text-emerald-300 font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow">
            {playerName}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-col justify-center text-left">
        <div className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-wider uppercase font-sans">
          WORDS: <span className="text-slate-900">{isOpponent && score === -1 ? '?' : wordsCount}</span>
        </div>
        <div className={`${compact ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'} font-black text-slate-950 tracking-tight leading-none mt-0.5 font-['Fredoka',sans-serif]`}>
          SCORE: <span className="text-slate-950">{isOpponent && score === -1 ? '????' : score.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

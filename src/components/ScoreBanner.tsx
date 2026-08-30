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
  avatarEmoji = '🎮',
  playerName,
  isOpponent = false,
  compact = false,
  id,
}) => {
  return (
    <div
      id={id || `gb-hud-banner-${isOpponent ? 'opp' : 'user'}`}
      className={`
        border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]
        ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2 max-w-sm w-full mx-auto'}
        flex items-center justify-between select-none shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)]
      `}
    >
      {/* Player info */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] flex items-center justify-center text-sm sm:text-base shrink-0">
          {avatarEmoji}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="text-[9px] sm:text-[10px] font-['Press_Start_2P',monospace] text-[var(--lcd-darkest,#0f380f)] truncate max-w-[100px] sm:max-w-[120px]">
            {playerName || (isOpponent ? 'OPPONENT' : 'PLAYER 1')}
          </div>
          <div className="text-[8px] font-['Press_Start_2P',monospace] text-[var(--lcd-dark,#306230)]">
            WORDS:{isOpponent && score === -1 ? '??' : wordsCount}
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <div className="text-[8px] font-['Press_Start_2P',monospace] text-[var(--lcd-dark,#306230)]">SCORE</div>
        <div className="text-xs sm:text-sm font-['Press_Start_2P',monospace] font-black text-[var(--lcd-darkest,#0f380f)]">
          {isOpponent && score === -1 ? '????' : score.toLocaleString()}
        </div>
      </div>
    </div>
  );
};



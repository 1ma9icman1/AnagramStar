import React from 'react';
import { Terminal, ShieldAlert } from 'lucide-react';

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
  avatarEmoji = '🕶️',
  avatarBg = '#003311',
  playerName,
  isOpponent = false,
  compact = false,
  id,
}) => {
  return (
    <div
      id={id || `matrix-hud-banner-${isOpponent ? 'opp' : 'user'}`}
      className={`
        matrix-hud-banner
        ${compact ? 'px-3 py-2 sm:px-4 sm:py-2.5' : 'px-5 py-3.5 sm:px-6 sm:py-4 max-w-sm w-full mx-auto'}
        flex items-center gap-3 sm:gap-4 select-none relative overflow-hidden
      `}
    >
      {/* Subtle background scanline line */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

      {/* Cyber Avatar */}
      <div className="relative shrink-0">
        <div
          className={`
            ${compact ? 'w-10 h-10 text-xl' : 'w-13 h-13 sm:w-14 sm:h-14 text-2xl sm:text-3xl'}
            rounded-lg flex items-center justify-center border-2 ${isOpponent ? 'border-rose-500 shadow-[0_0_12px_#f43f5e]' : 'border-[#00ff66] shadow-[0_0_15px_#00ff66]'} overflow-hidden bg-black/80
          `}
          style={{ backgroundColor: avatarBg }}
        >
          {avatarEmoji}
        </div>
        {playerName && (
          <span className={`absolute -top-2 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] sm:text-[10px] ${isOpponent ? 'text-rose-400 border-rose-500/60' : 'text-[#00ff66] border-[#00ff66]/60'} border font-mono font-black px-1.5 py-0.2 rounded whitespace-nowrap shadow-md`}>
            {playerName}
          </span>
        )}
      </div>

      {/* Stats Readout */}
      <div className="flex flex-col justify-center text-left min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold text-emerald-400/80 uppercase tracking-widest">
          <Terminal className="w-3 h-3 text-[#00ff66]" />
          <span>CIPHERS: <strong className="text-[#00ff66] font-bold">{isOpponent && score === -1 ? 'SCANNING...' : wordsCount}</strong></span>
        </div>
        <div className={`${compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'} font-black text-white tracking-wider leading-none mt-1 font-['Orbitron',monospace] flex items-center gap-1.5`}>
          <span className="text-emerald-500 text-xs sm:text-sm font-mono">PAYLOAD:</span>
          <span className="text-[#00ff66] matrix-glow-text">{isOpponent && score === -1 ? '????' : score.toLocaleString()} <span className="text-[10px] text-emerald-400 font-mono">BITS</span></span>
        </div>
      </div>

      {/* Cyber Corner Indicator */}
      <div className="ml-auto flex flex-col items-end opacity-70 text-[9px] font-mono text-emerald-500 hidden sm:flex">
        <span>SYS_OK</span>
        <span className="text-[8px] text-emerald-600">PORT:3000</span>
      </div>
    </div>
  );
};


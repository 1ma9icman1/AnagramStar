import React, { useEffect, useState } from 'react';
import { LeaderboardEntry, getHighScores } from '../utils/leaderboardStore';
import { AppSkin } from '../types/game';

interface HighScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  skin?: AppSkin;
}

export const HighScoresModal: React.FC<HighScoresModalProps> = ({
  isOpen,
  onClose,
  skin = 'gameboy',
}) => {
  const isCyber = skin === 'cyber';
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getHighScores()
        .then((data) => {
          setScores(data);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div
        id="high-scores-datastore-modal"
        className={`w-full max-w-sm border-2 p-3 sm:p-4 shadow-2xl transition-all ${
          isCyber
            ? 'border-emerald-500/60 bg-[#041009] text-emerald-100 font-mono shadow-[0_0_25px_rgba(0,255,102,0.2)]'
            : "border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace] shadow-[6px_6px_0_var(--lcd-darkest,#0f380f)]"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-2 border-b-2 text-[9px] sm:text-[10px] ${
            isCyber ? 'border-emerald-500/40 text-emerald-400' : 'border-[var(--lcd-darkest,#0f380f)]'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold tracking-wider">
            <span>🏆</span>
            <span>HIGH SCORES DATASTORE</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-1.5 py-0.5 border cursor-pointer active:scale-95 text-[9px] font-bold ${
              isCyber
                ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900'
                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-white'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Datastore Status Subheader */}
        <div
          className={`my-2 p-1.5 rounded-xs border text-[7px] sm:text-[8px] flex items-center justify-between ${
            isCyber
              ? 'border-emerald-700/50 bg-emerald-950/40 text-emerald-300'
              : 'border-[var(--lcd-darkest,#0f380f)]/40 bg-[var(--lcd-bg,#8bac0f)]/60 text-[var(--lcd-dark,#306230)]'
          }`}
        >
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
            <span>GLOBAL SYNC ACTIVE</span>
          </span>
          <span>{scores.length} RECORDS SAVED</span>
        </div>

        {/* Table of High Scores */}
        <div className="max-h-64 sm:max-h-80 overflow-y-auto space-y-1.5 pr-1 gb-scroll">
          {loading ? (
            <div className="py-8 text-center text-[8px] animate-pulse">
              LOADING DATASTORE...
            </div>
          ) : scores.length === 0 ? (
            <div className="py-8 text-center text-[8px] opacity-75">
              NO HIGH SCORES RECORDED YET. PLAY A ROUND!
            </div>
          ) : (
            scores.map((entry, index) => {
              const isTop3 = index < 3;
              return (
                <div
                  key={entry.id || `score-${index}`}
                  className={`flex items-center justify-between p-2 border text-[8px] sm:text-[9px] transition-colors rounded-xs ${
                    index === 0
                      ? isCyber
                        ? 'border-amber-400/80 bg-amber-950/30 text-amber-300 font-bold shadow-[0_0_10px_rgba(251,191,36,0.15)]'
                        : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] font-bold'
                      : isCyber
                      ? 'border-emerald-800/60 bg-emerald-950/20 hover:bg-emerald-900/30'
                      : 'border-[var(--lcd-darkest,#0f380f)]/50 bg-[var(--lcd-bg-light,#9bbc0f)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-4 text-center font-bold ${
                        index === 0 ? 'text-amber-400' : index === 1 ? 'text-zinc-400' : index === 2 ? 'text-amber-600' : 'opacity-60'
                      }`}
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <span className="text-xs">{entry.avatarEmoji || '🎮'}</span>
                    <div className="min-w-0">
                      <div className="truncate font-bold max-w-[110px] sm:max-w-[130px] flex items-center gap-1">
                        <span>{entry.playerName}</span>
                        {entry.source === 'discord' && (
                          <span
                            className="px-1 py-0.2 text-[6px] rounded bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2]"
                            title="Played via Discord"
                          >
                            DISCORD
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[6px] sm:text-[7px] truncate ${
                          isCyber ? 'text-emerald-400/70' : 'text-[var(--lcd-dark,#306230)]'
                        }`}
                      >
                        {entry.rootWord ? `[${entry.rootWord}] ` : ''}
                        {entry.wordCount} words
                        {entry.bestWord ? ` • Best: ${entry.bestWord}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-bold text-[9px] sm:text-[10px] ${
                        index === 0 ? 'text-amber-300' : isCyber ? 'text-[#00ff66]' : 'text-[var(--lcd-darkest,#0f380f)]'
                      }`}
                    >
                      {entry.score} PTS
                    </div>
                    <div className="text-[6px] opacity-60">
                      {new Date(entry.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-current/20 flex items-center justify-between text-[7px]">
          <span className="opacity-70">Saves automatically on match finish</span>
          <button
            type="button"
            onClick={onClose}
            className={`px-2.5 py-1 border font-bold cursor-pointer active:scale-95 ${
              isCyber
                ? 'border-emerald-500 bg-emerald-950 hover:bg-emerald-900 text-emerald-300'
                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
            }`}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

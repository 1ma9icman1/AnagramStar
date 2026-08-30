import React, { useEffect, useState } from 'react';
import { LeaderboardEntry, getDailyLeaderboard } from '../utils/leaderboardStore';
import {
  DailyChallengeInfo,
  getDailyChallenge,
  getDailyRecord,
  getTimeUntilDailyReset,
  generateDailyShareText,
  DailyChallengeRecord,
} from '../utils/dailyChallenge';
import { AppSkin, PlayerProfile } from '../types/game';
import { sound } from '../utils/sound';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDailyChallenge?: () => void;
  onPlayDaily?: () => void;
  dailyInfo?: DailyChallengeInfo | null;
  dailyRecord?: DailyChallengeRecord | null;
  playerProfile?: PlayerProfile;
  skin?: AppSkin;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  isOpen,
  onClose,
  onStartDailyChallenge,
  onPlayDaily,
  dailyInfo: propDailyInfo,
  dailyRecord: propDailyRecord,
  playerProfile,
  skin = 'gameboy',
}) => {
  const isCyber = skin === 'cyber';
  const isNormal = skin === 'normal';
  const isNokia = skin === 'nokia';

  const dailyInfo = propDailyInfo || getDailyChallenge();
  const dateKey = dailyInfo?.dateKey || '2026-08-30';
  const root = dailyInfo?.root || 'PLANET';

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dailyRecord, setDailyRecord] = useState<DailyChallengeRecord | null>(propDailyRecord || null);
  const [countdown, setCountdown] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Load daily leaderboard and player's record
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const record = propDailyRecord || getDailyRecord(dateKey);
      setDailyRecord(record);

      getDailyLeaderboard(dateKey, root)
        .then((data) => {
          setLeaderboard(data);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, dateKey, root, propDailyRecord]);

  // Live countdown timer to midnight
  useEffect(() => {
    if (!isOpen) return;
    const updateCountdown = () => {
      const { formatted } = getTimeUntilDailyReset();
      setCountdown(formatted);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const handleStart = () => {
    if (onStartDailyChallenge) {
      onStartDailyChallenge();
    } else if (onPlayDaily) {
      onPlayDaily();
    }
  };

  const handleShare = () => {
    if (!dailyRecord || !dailyInfo) return;
    const text = generateDailyShareText(
      dailyInfo.dayNumber,
      dailyInfo.dateFormatted,
      dailyRecord.score,
      dailyRecord.wordCount,
      dailyRecord.bestWord
    );
    try {
      navigator.clipboard.writeText(text);
      sound.playSuccessBeep();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!isOpen || !dailyInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div
        id="daily-challenge-modal"
        className={`w-full max-w-md border-2 p-3 sm:p-4 shadow-2xl transition-all max-h-[90vh] flex flex-col justify-between ${
          isNormal
            ? 'border-amber-700 bg-slate-900 text-slate-100 font-sans shadow-amber-950/40 rounded-xl'
            : isCyber
            ? 'border-emerald-500/60 bg-[#041009] text-emerald-100 font-mono shadow-[0_0_25px_rgba(0,255,102,0.2)] rounded-lg'
            : isNokia
            ? 'border-slate-800 bg-[#98a886] text-[#1a2b1a] font-mono shadow-md rounded-xs'
            : "border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace] shadow-[6px_6px_0_var(--lcd-darkest,#0f380f)] rounded-none"
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between pb-2 border-b-2 text-[9px] sm:text-[10px] ${
            isNormal
              ? 'border-amber-700/60 text-amber-200'
              : isCyber
              ? 'border-emerald-500/40 text-emerald-400'
              : isNokia
              ? 'border-[#1a2b1a] text-[#1a2b1a]'
              : 'border-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-darkest,#0f380f)]'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold tracking-wider">
            <span>🌟</span>
            <span>DAILY CHALLENGE #{dailyInfo.dayNumber}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playButtonClick();
              onClose();
            }}
            className={`px-2 py-0.5 border cursor-pointer active:scale-95 text-[9px] font-bold rounded ${
              isNormal
                ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300'
                : isCyber
                ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900'
                : isNokia
                ? 'border-[#1a2b1a] bg-[#879775] text-[#1a2b1a]'
                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-white'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Challenge Summary Banner & Countdown */}
        <div
          className={`my-2 p-2.5 rounded-lg border text-[8px] sm:text-[9px] flex flex-col gap-1.5 ${
            isNormal
              ? 'border-amber-600/50 bg-gradient-to-r from-amber-950/60 to-slate-800/80 text-amber-100'
              : isCyber
              ? 'border-emerald-600/50 bg-emerald-950/40 text-emerald-200 shadow-[0_0_10px_rgba(0,255,102,0.15)]'
              : isNokia
              ? 'border-[#1a2b1a] bg-[#879775]/60 text-[#1a2b1a]'
              : 'border-[var(--lcd-darkest,#0f380f)]/60 bg-[var(--lcd-bg,#8bac0f)]/60 text-[var(--lcd-darkest,#0f380f)]'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <span>📅</span>
              <span>{dailyInfo.fullDateFormatted}</span>
            </span>
            <span className="text-[7px] sm:text-[8px] px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300">
              {dailyInfo.wordLength} LETTERS • {dailyInfo.totalPossibleWords} WORDS
            </span>
          </div>

          <div className="flex items-center justify-between text-[7px] sm:text-[8px] opacity-90">
            <span className="flex items-center gap-1">
              <span>⏳</span>
              <span>Resets in: <strong className="font-mono">{countdown}</strong></span>
            </span>
            <span>Seed: #{dailyInfo.dayNumber}</span>
          </div>

          {/* User's Daily Status */}
          <div
            className={`mt-1 pt-1.5 border-t flex items-center justify-between text-[7px] sm:text-[8px] ${
              isNormal
                ? 'border-amber-800/40 text-amber-300 font-semibold'
                : isCyber
                ? 'border-emerald-700/40 text-emerald-300'
                : isNokia
                ? 'border-[#1a2b1a]/40 text-[#1a2b1a]'
                : 'border-[var(--lcd-darkest,#0f380f)]/40 text-[var(--lcd-darkest,#0f380f)]'
            }`}
          >
            <div>
              {dailyRecord ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <span>✓</span>
                  <span>Completed: <strong>{dailyRecord.score.toLocaleString()} pts</strong> ({dailyRecord.wordCount} words)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400">
                  <span>⚡</span>
                  <span>You haven't played today's challenge yet!</span>
                </span>
              )}
            </div>
            {dailyRecord && (
              <button
                type="button"
                onClick={handleShare}
                className={`px-1.5 py-0.5 border cursor-pointer active:scale-95 rounded text-[7px] font-bold transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : isNormal
                    ? 'border-amber-600 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                    : 'border-emerald-500 bg-emerald-950 text-emerald-300'
                }`}
              >
                {copied ? 'COPIED!' : 'SHARE'}
              </button>
            )}
          </div>
        </div>

        {/* Today's Leaderboard Subheader */}
        <div className="flex items-center justify-between text-[7px] sm:text-[8px] font-bold px-1 my-1 opacity-80">
          <span>TODAY'S TOP SCORES</span>
          <span>{leaderboard.length} PLAYERS TODAY</span>
        </div>

        {/* Today's Leaderboard List */}
        <div className="flex-1 max-h-52 sm:max-h-64 overflow-y-auto space-y-1 pr-1 gb-scroll">
          {loading ? (
            <div className="py-8 text-center text-[8px] animate-pulse">
              SYNCING TODAY'S LEADERBOARD...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-8 text-center text-[8px] opacity-75">
              BE THE FIRST TO PLAY TODAY'S DAILY CHALLENGE!
            </div>
          ) : (
            leaderboard.map((entry, index) => {
              const isTop3 = index < 3;
              return (
                <div
                  key={entry.id || `daily-score-${index}`}
                  className={`flex items-center justify-between p-1.5 sm:p-2 border text-[8px] sm:text-[8.5px] rounded transition-colors ${
                    index === 0
                      ? isNormal
                        ? 'border-amber-400/80 bg-amber-500/15 text-amber-200'
                        : isCyber
                        ? 'border-[#00ff66] bg-[#00ff66]/15 text-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.2)]'
                        : isNokia
                        ? 'border-[#1a2b1a] bg-[#879775]'
                        : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                      : isNormal
                      ? 'border-slate-800 bg-slate-800/50 text-slate-200 hover:bg-slate-800'
                      : isCyber
                      ? 'border-emerald-800/40 bg-black/40 text-emerald-200 hover:bg-emerald-950/40'
                      : isNokia
                      ? 'border-[#1a2b1a]/40 bg-[#879775]/40 text-[#1a2b1a]'
                      : 'border-[var(--lcd-darkest,#0f380f)]/30 bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-bg,#8bac0f)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-bold w-4 text-center">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <span className="text-xs">{entry.avatarEmoji || '🎮'}</span>
                    <div>
                      <div className="font-bold truncate max-w-[100px] sm:max-w-[130px]">
                        {entry.playerName}
                      </div>
                      <div className="text-[6.5px] opacity-75">
                        {entry.wordCount} words {entry.bestWord ? `• "${entry.bestWord}"` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-[9px] sm:text-[10px]">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-[6px] opacity-60">
                      {entry.source === 'discord' ? '🎮 DISCORD' : '🌐 WEB'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playButtonClick();
              onClose();
              handleStart();
            }}
            className={`flex-1 py-2.5 sm:py-3 border-2 font-bold text-[8.5px] sm:text-[9.5px] text-center cursor-pointer active:scale-95 transition-all rounded-lg ${
              isNormal
                ? 'border-amber-400 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-md hover:brightness-110'
                : isCyber
                ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_15px_#00ff66] hover:bg-[#33ff88]'
                : isNokia
                ? 'border-[#1a2b1a] bg-[#1a2b1a] text-[#98a886]'
                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)]'
            }`}
          >
            {dailyRecord ? '🔄 REPLAY TODAY\'S CHALLENGE' : '▶ PLAY TODAY\'S PUZZLE'}
          </button>
        </div>
      </div>
    </div>
  );
};

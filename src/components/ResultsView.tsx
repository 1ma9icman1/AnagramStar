import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { WoodTile } from './WoodTile';
import { SubmittedWord, PlayerProfile, Opponent, AppSkin } from '../types/game';
import { generateDiscordShareText, encodeMatchShareUrl } from '../utils/discord';
import { generateDailyShareText, DailyChallengeInfo } from '../utils/dailyChallenge';
import { sound } from '../utils/sound';

export interface ResultsViewHandle {
  handleAPress: () => void;
  handleBPress: () => void;
  handleSelectPress: () => void;
  handleStartPress: () => void;
  handleDpadPress: (dir: 'up' | 'down' | 'left' | 'right') => void;
}

interface ResultsViewProps {
  playerProfile: PlayerProfile;
  playerWords: SubmittedWord[];
  playerScore: number;
  rootWord: string;
  opponent?: Opponent | null;
  isPassPlay?: boolean;
  isOnlineDuel?: boolean;
  p1Name?: string;
  p2Name?: string;
  isDailyChallenge?: boolean;
  dailyInfo?: DailyChallengeInfo | null;
  onPlayAgain: () => void;
  onRematchPassPlay?: () => void;
  onRematchOnline?: () => void;
  onExitToLobby?: () => void;
  onOpenDictionary: () => void;
  onOpenHighScores?: () => void;
  onOpenDailyLeaderboard?: () => void;
  onOpenDiscordInvite?: () => void;
  onRevealOpponent?: () => void;
  skin?: AppSkin;
}

export const ResultsView = forwardRef<ResultsViewHandle, ResultsViewProps>(({
  playerProfile,
  playerWords,
  playerScore,
  rootWord,
  opponent,
  isPassPlay = false,
  isOnlineDuel = false,
  p1Name = 'P1',
  p2Name = 'P2',
  isDailyChallenge = false,
  dailyInfo,
  onPlayAgain,
  onRematchPassPlay,
  onRematchOnline,
  onExitToLobby,
  onOpenDictionary,
  onOpenHighScores,
  onOpenDailyLeaderboard,
  onOpenDiscordInvite,
  onRevealOpponent,
  skin = 'gameboy',
}, ref) => {
  const isCyber = skin === 'cyber';
  const isNormal = skin === 'normal';
  const [copiedDiscord, setCopiedDiscord] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDaily, setCopiedDaily] = useState(false);
  const [opponentRevealed, setOpponentRevealed] = useState(opponent?.isReady || isPassPlay || false);

  const handleAPress = useCallback(() => {
    if (isPassPlay && onRematchPassPlay) {
      onRematchPassPlay();
    } else {
      onPlayAgain();
    }
  }, [isPassPlay, onRematchPassPlay, onPlayAgain]);

  const handleBPress = useCallback(() => {
    if (onExitToLobby) {
      onExitToLobby();
    }
  }, [onExitToLobby]);

  const handleSelectPress = useCallback(() => {
    onOpenDictionary();
  }, [onOpenDictionary]);

  const handleStartPress = useCallback(() => {
    handleAPress();
  }, [handleAPress]);

  const handleDpadPress = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (dir === 'up' || dir === 'down') {
      if (!opponentRevealed && onRevealOpponent) {
        onRevealOpponent();
        setOpponentRevealed(true);
      }
    }
  }, [opponentRevealed, onRevealOpponent]);

  useImperativeHandle(ref, () => ({
    handleAPress,
    handleBPress,
    handleSelectPress,
    handleStartPress,
    handleDpadPress,
  }), [handleAPress, handleBPress, handleSelectPress, handleStartPress, handleDpadPress]);

  useEffect(() => {
    if (playerScore >= 1000 || (isPassPlay && opponent && Math.max(playerScore, opponent.score) >= 500)) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: isCyber ? ['#00ff66', '#00ffcc', '#0099ff', '#ffffff'] : ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
        });
      } catch {}
    }
  }, [playerScore, isPassPlay, opponent, isCyber]);

  const handleReveal = () => {
    setOpponentRevealed(true);
    if (onRevealOpponent) onRevealOpponent();
  };

  const handleCopyDiscord = async () => {
    const text = generateDiscordShareText(
      playerProfile,
      playerScore,
      playerWords,
      rootWord,
      opponentRevealed ? opponent?.score : undefined,
      opponentRevealed ? opponent?.name : undefined
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDiscord(true);
      setTimeout(() => setCopiedDiscord(false), 2000);
    } catch {}
  };

  const handleCopyLink = async () => {
    const link = encodeMatchShareUrl(rootWord, playerScore, playerWords.length, playerProfile.name);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleCopyDaily = async () => {
    if (!dailyInfo) return;
    const bestWord = playerWords.reduce(
      (prevBest, cur) => (cur.score > prevBest.score ? cur : prevBest),
      playerWords[0] || { word: '', score: 0 }
    );
    const text = generateDailyShareText(
      dailyInfo.dayNumber,
      dailyInfo.dateFormatted,
      playerScore,
      playerWords.length,
      bestWord.word
    );
    try {
      await navigator.clipboard.writeText(text);
      sound.playSuccessBeep();
      setCopiedDaily(true);
      setTimeout(() => setCopiedDaily(false), 2000);
    } catch {}
  };

  const isWin = opponentRevealed && opponent && playerScore > opponent.score;
  const isLoss = opponentRevealed && opponent && playerScore < opponent.score;
  const isTie = opponentRevealed && opponent && playerScore === opponent.score;

  return (
    <div
      id="results-view-container"
      className={`relative w-full h-full flex flex-col justify-between p-2 sm:p-4 select-none ${
        isNormal
          ? 'text-slate-100 font-sans'
          : isCyber
          ? 'text-emerald-100 font-mono'
          : "text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace]"
      }`}
    >
      {/* Top Title & Navigation */}
      <div
        className={`flex items-center justify-between pb-2 border-b-2 text-[8px] sm:text-[9px] ${
          isNormal
            ? 'border-amber-800/40 text-slate-300'
            : isCyber
            ? 'border-emerald-500/40'
            : 'border-[var(--lcd-darkest,#0f380f)]'
        }`}
      >
        <button
          type="button"
          onClick={onExitToLobby}
          className={`px-2 py-1 border cursor-pointer active:scale-95 transition-all rounded ${
            isNormal
              ? 'border-amber-700/60 bg-slate-800/80 hover:bg-slate-700 text-amber-200 shadow-xs'
              : isCyber
              ? 'border-emerald-500/60 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300'
              : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
          }`}
        >
          ◄ LOBBY
        </button>

        <span className={`font-bold ${isNormal ? 'text-amber-300 font-extrabold tracking-wider text-[10px]' : isCyber ? 'text-emerald-400 matrix-glow-text' : ''}`}>
          {isDailyChallenge ? `🌟 DAILY #${dailyInfo?.dayNumber || ''}` : 'MATCH RESULTS'}
        </span>

        <button
          type="button"
          onClick={onOpenDictionary}
          className={`px-2 py-1 border cursor-pointer text-[8px] active:scale-95 transition-all rounded ${
            isNormal
              ? 'border-amber-700/60 bg-slate-800/80 hover:bg-slate-700 text-amber-200 shadow-xs'
              : isCyber
              ? 'border-emerald-500/60 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300'
              : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
          }`}
        >
          WORDS
        </button>
      </div>

      {/* Main Results Body */}
      <div className="flex-1 flex flex-col items-center justify-between my-2 overflow-y-auto gb-scroll">
        {/* Daily Challenge Banner */}
        {isDailyChallenge && dailyInfo && (
          <div
            className={`w-full text-center py-2 px-3 text-[8px] sm:text-[9px] font-bold mb-2 animate-gb-pop rounded-xl border-2 flex items-center justify-between shadow-sm ${
              isNormal
                ? 'border-amber-400 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950'
                : isCyber
                ? 'border-[#00ff66] bg-emerald-950 text-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
            }`}
          >
            <span className="flex items-center gap-1">
              <span>🌟</span>
              <span>DAILY PUZZLE RECORDED!</span>
            </span>
            <span className="text-[7.5px] opacity-90">{dailyInfo.dateFormatted}</span>
          </div>
        )}

        {/* Outcome Header if 2P or Bot Match */}
        {!isDailyChallenge && opponentRevealed && opponent ? (
          <div
            className={`w-full text-center py-1.5 text-[8px] sm:text-[9px] font-bold mb-2 animate-gb-pop rounded-lg ${
              isNormal
                ? isWin
                  ? 'border border-amber-400 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-md font-extrabold'
                  : isLoss
                  ? 'border border-red-800 bg-red-950/80 text-red-200 shadow-md'
                  : 'border border-slate-700 bg-slate-800 text-slate-200 shadow-md'
                : isCyber
                ? isWin
                  ? 'border border-[#00ff66] bg-[#00ff66]/20 text-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                  : isLoss
                  ? 'border border-red-500 bg-red-950/60 text-red-200 shadow-[0_0_12px_red]'
                  : 'border border-amber-400 bg-amber-950/60 text-amber-200'
                : 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
            }`}
          >
            {isPassPlay ? (
              isWin ? `★ ${p2Name.toUpperCase()} WON DUEL! ★` : isLoss ? `★ ${p1Name.toUpperCase()} WON DUEL! ★` : '★ TIE MATCH! ★'
            ) : isOnlineDuel ? (
              isWin ? '★ VICTORY! YOU WON THE 1V1 DUEL! ★' : isLoss ? 'DEFEAT - RIVAL WON DUEL' : 'DRAW - PERFECT TIE'
            ) : isWin ? (
              '★ VICTORY! YOU DEFEATED THE AI ★'
            ) : isLoss ? (
              'DEFEAT - AI TOOK THE ROUND'
            ) : (
              'DRAW - PERFECT TIE'
            )}
          </div>
        ) : !isDailyChallenge ? (
          <div className={`text-[8px] mb-1 font-bold ${isNormal ? 'text-amber-300 font-extrabold tracking-wider' : isCyber ? 'text-emerald-400' : 'text-[var(--lcd-dark,#306230)]'}`}>
            ROUND PERFORMANCE
          </div>
        ) : null}

        {/* Score Boxes (1 or 2 players) */}
        <div className="w-full grid grid-cols-2 gap-2 mb-2">
          {/* Player Box */}
          <div
            className={`p-2 flex flex-col items-center text-center rounded-lg border ${
              isNormal
                ? 'border-amber-600/40 bg-slate-900/80 text-slate-100 shadow-md'
                : isCyber
                ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-100 shadow-[0_0_8px_rgba(0,255,102,0.15)]'
                : 'border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
            }`}
          >
            <div className={`text-[7px] truncate max-w-full font-bold ${isNormal ? 'text-amber-300' : ''}`}>
              {isPassPlay ? p2Name : playerProfile.name}
            </div>
            <div className={`text-base sm:text-xl font-black my-0.5 ${isNormal ? 'text-amber-400 font-extrabold' : isCyber ? 'text-white matrix-glow-text' : ''}`}>
              {playerScore}
            </div>
            <div className={`text-[7px] ${isNormal ? 'text-slate-400' : isCyber ? 'text-emerald-400/80' : 'text-[var(--lcd-dark,#306230)]'}`}>
              {playerWords.length} WORDS
            </div>
          </div>

          {/* Opponent / Target Box */}
          {opponent ? (
            <div
              className={`p-2 flex flex-col items-center text-center rounded-lg border ${
                isNormal
                  ? 'border-amber-600/40 bg-slate-900/80 text-slate-100 shadow-md'
                  : isCyber
                  ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-100 shadow-[0_0_8px_rgba(0,255,102,0.15)]'
                  : 'border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              <div className={`text-[7px] truncate max-w-full font-bold ${isNormal ? 'text-amber-300' : ''}`}>
                {isPassPlay ? p1Name : opponent.name}
              </div>
              {opponentRevealed ? (
                <>
                  <div className={`text-base sm:text-xl font-black my-0.5 ${isNormal ? 'text-amber-400 font-extrabold' : isCyber ? 'text-white matrix-glow-text' : ''}`}>
                    {opponent.score}
                  </div>
                  <div className={`text-[7px] ${isNormal ? 'text-slate-400' : isCyber ? 'text-emerald-400/80' : 'text-[var(--lcd-dark,#306230)]'}`}>
                    {opponent.words?.length || 0} WORDS
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleReveal}
                  className={`mt-1.5 px-2 py-0.5 font-bold text-[7px] cursor-pointer rounded ${
                    isNormal
                      ? 'bg-amber-500 text-amber-950 hover:bg-amber-400 font-extrabold'
                      : isCyber
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                  }`}
                >
                  REVEAL
                </button>
              )}
            </div>
          ) : (
            <div
              className={`p-2 flex flex-col items-center text-center rounded-lg border ${
                isNormal
                  ? 'border-amber-600/40 bg-slate-900/80 text-slate-100 shadow-md'
                  : isCyber
                  ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-100 shadow-[0_0_8px_rgba(0,255,102,0.15)]'
                  : 'border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              <div className={`text-[7px] font-bold ${isNormal ? 'text-amber-300' : ''}`}>ROOT WORD</div>
              <div className={`text-base sm:text-lg font-black my-0.5 ${isNormal ? 'text-amber-400 tracking-wider font-extrabold' : isCyber ? 'text-white matrix-glow-text' : ''}`}>
                {rootWord}
              </div>
              <div className={`text-[7px] ${isNormal ? 'text-slate-400' : isCyber ? 'text-emerald-400/80' : 'text-[var(--lcd-dark,#306230)]'}`}>
                {rootWord.length} LETTERS
              </div>
            </div>
          )}
        </div>

        {/* Found Words Grid */}
        <div
          className={`w-full flex-1 border p-2 mb-2 flex flex-col rounded-lg ${
            isNormal
              ? 'border-amber-900/40 bg-slate-950/80 text-slate-200'
              : isCyber
              ? 'border-emerald-900 bg-black/50 text-emerald-200'
              : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
          }`}
        >
          <div
            className={`flex justify-between items-center text-[8px] mb-1.5 pb-1 border-b font-bold ${
              isNormal
                ? 'border-amber-900/40 text-amber-300'
                : isCyber
                ? 'border-emerald-900 text-emerald-400'
                : 'border-[var(--lcd-dark,#306230)]/40'
            }`}
          >
            <span>WORDS FOUND:</span>
            <span>{playerWords.length}</span>
          </div>

          <div className="flex-1 flex flex-wrap gap-1.5 overflow-y-auto max-h-[85px] gb-scroll content-start">
            {playerWords.length === 0 ? (
              <span className={`text-[7px] ${isNormal ? 'text-slate-500' : isCyber ? 'text-emerald-600' : 'text-[var(--lcd-dark,#306230)]'}`}>
                NO WORDS ENTERED
              </span>
            ) : (
              playerWords.map((sw, i) => (
                <span
                  key={`${sw.word}-${i}`}
                  className={`px-1.5 py-0.5 border text-[7px] sm:text-[8px] rounded font-bold ${
                    isNormal
                      ? 'border-amber-600/50 bg-amber-950/60 text-amber-200 shadow-xs'
                      : isCyber
                      ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300 shadow-[0_0_4px_rgba(0,255,102,0.2)]'
                      : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)]'
                  }`}
                >
                  {sw.word} <span className="opacity-80">+{sw.score}</span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Social / Rematch Action Buttons */}
        <div className="w-full grid grid-cols-3 gap-1 text-[7px] sm:text-[8px]">
          {isDailyChallenge && onOpenDailyLeaderboard ? (
            <button
              type="button"
              onClick={() => {
                sound.playButtonClick();
                onOpenDailyLeaderboard();
              }}
              className={`py-2 border text-center cursor-pointer active:scale-95 transition-all rounded font-bold flex items-center justify-center gap-0.5 ${
                isNormal
                  ? 'border-amber-400 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 font-extrabold shadow-xs hover:brightness-110'
                  : isCyber
                  ? 'border-[#00ff66] bg-[#00ff66]/20 text-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.3)]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              <span>🌟</span>
              <span className="truncate">TODAY'S RANK</span>
            </button>
          ) : onOpenHighScores ? (
            <button
              type="button"
              onClick={onOpenHighScores}
              className={`py-2 border text-center cursor-pointer active:scale-95 transition-all rounded font-bold flex items-center justify-center gap-0.5 ${
                isNormal
                  ? 'border-amber-500/70 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 hover:brightness-110 shadow-xs font-extrabold'
                  : isCyber
                  ? 'border-amber-400/80 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.2)]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] text-[var(--lcd-darkest,#0f380f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-white'
              }`}
            >
              <span>🏆</span>
              <span className="truncate">SCORES</span>
            </button>
          ) : null}

          {isDailyChallenge ? (
            <button
              type="button"
              onClick={handleCopyDaily}
              className={`py-2 border text-center cursor-pointer active:scale-95 transition-all rounded truncate font-bold ${
                copiedDaily
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : isNormal
                  ? 'border-amber-600/70 bg-slate-800 hover:bg-slate-700 text-amber-200 shadow-xs'
                  : isCyber
                  ? 'border-emerald-500/60 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              {copiedDaily ? 'COPIED!' : '📋 SHARE DAILY'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenDiscordInvite || handleCopyDiscord}
              className={`py-2 border text-center cursor-pointer active:scale-95 transition-all rounded truncate font-bold ${
                isNormal
                  ? 'border-indigo-600/60 bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-200 shadow-xs'
                  : isCyber
                  ? 'border-emerald-500/60 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              {copiedDiscord ? 'COPIED!' : 'DISCORD'}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className={`py-2 border text-center cursor-pointer active:scale-95 transition-all rounded truncate font-bold ${
              isNormal
                ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-amber-200 shadow-xs'
                : isCyber
                ? 'border-emerald-500/60 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300'
                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
            }`}
          >
            {copiedLink ? 'COPIED LINK' : 'SHARE LINK'}
          </button>
        </div>
      </div>

      {/* Bottom Rematch Bar */}
      <div
        className={`pt-2 border-t-2 flex gap-1 ${
          isNormal
            ? 'border-amber-800/40'
            : isCyber
            ? 'border-emerald-500/40'
            : 'border-[var(--lcd-darkest,#0f380f)]'
        }`}
      >
        <button
          type="button"
          onClick={
            isPassPlay && onRematchPassPlay
              ? onRematchPassPlay
              : isOnlineDuel && onRematchOnline
              ? onRematchOnline
              : onPlayAgain
          }
          className={`w-full py-2.5 sm:py-3 border-2 font-bold text-[8px] sm:text-[9px] text-center cursor-pointer active:scale-95 transition-all rounded-lg ${
            isNormal
              ? 'border-amber-400 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 font-extrabold shadow-lg hover:brightness-110'
              : isCyber
              ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_15px_#00ff66] hover:bg-[#33ff88]'
              : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)]'
          }`}
        >
          {isDailyChallenge
            ? '🔄 REPLAY DAILY CHALLENGE'
            : isPassPlay
            ? '► REMATCH DUEL'
            : isOnlineDuel
            ? '► 1V1 DUEL REMATCH (SYNCED)'
            : '► PLAY AGAIN'}
        </button>
      </div>
    </div>
  );
});

ResultsView.displayName = 'ResultsView';



import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { WoodTile } from './WoodTile';
import { SubmittedWord, PlayerProfile, Opponent } from '../types/game';
import { generateDiscordShareText, encodeMatchShareUrl } from '../utils/discord';

interface ResultsViewProps {
  playerProfile: PlayerProfile;
  playerWords: SubmittedWord[];
  playerScore: number;
  rootWord: string;
  opponent?: Opponent | null;
  isPassPlay?: boolean;
  p1Name?: string;
  p2Name?: string;
  onPlayAgain: () => void;
  onRematchPassPlay?: () => void;
  onExitToLobby?: () => void;
  onOpenDictionary: () => void;
  onOpenDiscordInvite?: () => void;
  onRevealOpponent?: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  playerProfile,
  playerWords,
  playerScore,
  rootWord,
  opponent,
  isPassPlay = false,
  p1Name = 'P1',
  p2Name = 'P2',
  onPlayAgain,
  onRematchPassPlay,
  onExitToLobby,
  onOpenDictionary,
  onOpenDiscordInvite,
  onRevealOpponent,
}) => {
  const [copiedDiscord, setCopiedDiscord] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [opponentRevealed, setOpponentRevealed] = useState(opponent?.isReady || isPassPlay || false);

  useEffect(() => {
    if (playerScore >= 1000 || (isPassPlay && opponent && Math.max(playerScore, opponent.score) >= 500)) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
        });
      } catch {}
    }
  }, [playerScore, isPassPlay, opponent]);

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

  const isWin = opponentRevealed && opponent && playerScore > opponent.score;
  const isLoss = opponentRevealed && opponent && playerScore < opponent.score;
  const isTie = opponentRevealed && opponent && playerScore === opponent.score;

  return (
    <div
      id="results-view-container"
      className="relative w-full h-full flex flex-col justify-between p-2 sm:p-3 select-none text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace]"
    >
      {/* Top Title & Navigation */}
      <div className="flex items-center justify-between pb-1.5 border-b-2 border-[var(--lcd-darkest,#0f380f)] text-[8px]">
        <button
          type="button"
          onClick={onExitToLobby}
          className="px-1.5 py-0.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)] cursor-pointer"
        >
          ◄ LOBBY
        </button>

        <span className="font-bold">GAME OVER</span>

        <button
          type="button"
          onClick={onOpenDictionary}
          className="px-1.5 py-0.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)] cursor-pointer text-[7px]"
        >
          DICTIONARY
        </button>
      </div>

      {/* Main Results Body */}
      <div className="flex-1 flex flex-col items-center justify-between my-2 overflow-y-auto gb-scroll">
        {/* Outcome Header if 2P or Bot Match */}
        {opponentRevealed && opponent ? (
          <div className="w-full text-center py-1 bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] text-[8px] sm:text-[9px] mb-2 animate-gb-pop">
            {isPassPlay ? (
              isWin ? `★ ${p2Name.toUpperCase()} WON DUEL! ★` : isLoss ? `★ ${p1Name.toUpperCase()} WON DUEL! ★` : '★ TIE MATCH! ★'
            ) : isWin ? (
              '★ VICTORY! YOU BEAT THE AI ★'
            ) : isLoss ? (
              'DEFEAT - AI TOOK THE ROUND'
            ) : (
              'DRAW - PERFECT TIE'
            )}
          </div>
        ) : (
          <div className="text-[7px] text-[var(--lcd-dark,#306230)] mb-1">ROUND SUMMARY</div>
        )}

        {/* Score Boxes (1 or 2 players) */}
        <div className="w-full grid grid-cols-2 gap-1.5 mb-2">
          {/* Player Box */}
          <div className="border-2 border-[var(--lcd-darkest,#0f380f)] p-1.5 bg-[var(--lcd-bg-light,#9bbc0f)] flex flex-col items-center text-center">
            <div className="text-[7px] truncate max-w-full font-bold">
              {isPassPlay ? p2Name : playerProfile.name}
            </div>
            <div className="text-xs sm:text-sm font-black my-0.5">{playerScore}</div>
            <div className="text-[6px] text-[var(--lcd-dark,#306230)]">{playerWords.length} WORDS</div>
          </div>

          {/* Opponent / Target Box */}
          {opponent ? (
            <div className="border-2 border-[var(--lcd-darkest,#0f380f)] p-1.5 bg-[var(--lcd-bg-light,#9bbc0f)] flex flex-col items-center text-center">
              <div className="text-[7px] truncate max-w-full font-bold">
                {isPassPlay ? p1Name : opponent.name}
              </div>
              {opponentRevealed ? (
                <>
                  <div className="text-xs sm:text-sm font-black my-0.5">{opponent.score}</div>
                  <div className="text-[6px] text-[var(--lcd-dark,#306230)]">{opponent.words?.length || 0} WORDS</div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleReveal}
                  className="mt-1 px-1.5 py-0.5 bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] text-[6px] cursor-pointer"
                >
                  REVEAL
                </button>
              )}
            </div>
          ) : (
            <div className="border-2 border-[var(--lcd-darkest,#0f380f)] p-1.5 bg-[var(--lcd-bg-light,#9bbc0f)] flex flex-col items-center text-center">
              <div className="text-[7px] font-bold">ROOT WORD</div>
              <div className="text-xs font-black my-0.5">{rootWord}</div>
              <div className="text-[6px] text-[var(--lcd-dark,#306230)]">{rootWord.length} LETTERS</div>
            </div>
          )}
        </div>

        {/* Found Words Grid */}
        <div className="w-full flex-1 border border-[var(--lcd-darkest,#0f380f)] p-1.5 bg-[var(--lcd-bg-light,#9bbc0f)] mb-2 flex flex-col">
          <div className="flex justify-between items-center text-[7px] mb-1 pb-0.5 border-b border-[var(--lcd-dark,#306230)]/40">
            <span>WORDS FOUND:</span>
            <span>{playerWords.length}</span>
          </div>

          <div className="flex-1 flex flex-wrap gap-1 overflow-y-auto max-h-[85px] gb-scroll content-start">
            {playerWords.length === 0 ? (
              <span className="text-[7px] text-[var(--lcd-dark,#306230)]">NO WORDS ENTERED</span>
            ) : (
              playerWords.map((sw, i) => (
                <span
                  key={`${sw.word}-${i}`}
                  className="px-1 py-0.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] text-[7px]"
                >
                  {sw.word} <span className="opacity-80">+{sw.score}</span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Social / Rematch Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-1 text-[7px]">
          <button
            type="button"
            onClick={onOpenDiscordInvite || handleCopyDiscord}
            className="py-1.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)] cursor-pointer text-center"
          >
            {copiedDiscord ? 'COPIED!' : 'DISCORD EXPORT'}
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="py-1.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)] cursor-pointer text-center"
          >
            {copiedLink ? 'LINK COPIED!' : 'COPY LINK'}
          </button>
        </div>
      </div>

      {/* Bottom Rematch Bar */}
      <div className="pt-1.5 border-t-2 border-[var(--lcd-darkest,#0f380f)] flex gap-1">
        <button
          type="button"
          onClick={isPassPlay && onRematchPassPlay ? onRematchPassPlay : onPlayAgain}
          className="w-full py-2 border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] font-bold text-[8px] text-center shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)] hover:scale-[1.01] active:scale-95 cursor-pointer"
        >
          ► {isPassPlay ? 'REMATCH DUEL' : 'PLAY AGAIN'}
        </button>
      </div>
    </div>
  );
};

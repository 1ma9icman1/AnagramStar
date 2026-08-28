import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Share2, RotateCcw, BookOpen, Check, Copy, Bot, Trophy, ArrowRight, HelpCircle } from 'lucide-react';
import { WoodTile } from './WoodTile';
import { ScoreBanner } from './ScoreBanner';
import { SubmittedWord, PlayerProfile, Opponent } from '../types/game';
import { generateDiscordShareText, encodeMatchShareUrl } from '../utils/discord';

interface ResultsViewProps {
  playerProfile: PlayerProfile;
  playerWords: SubmittedWord[];
  playerScore: number;
  rootWord: string;
  opponent?: Opponent | null;
  onPlayAgain: () => void;
  onOpenDictionary: () => void;
  onRevealOpponent?: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  playerProfile,
  playerWords,
  playerScore,
  rootWord,
  opponent,
  onPlayAgain,
  onOpenDictionary,
  onRevealOpponent,
}) => {
  const [copiedDiscord, setCopiedDiscord] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [opponentRevealed, setOpponentRevealed] = useState(opponent?.isReady || false);

  // Trigger confetti if high score or won
  useEffect(() => {
    if (playerScore >= 1000) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f7d598', '#5865F2', '#3BA55C', '#FAA61A'],
        });
      } catch {}
    }
  }, [playerScore]);

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
      setTimeout(() => setCopiedDiscord(false), 2500);
    } catch {}
  };

  const handleCopyLink = async () => {
    const link = encodeMatchShareUrl(rootWord, playerScore, playerWords.length, playerProfile.name);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  const isWin = opponentRevealed && opponent && playerScore > opponent.score;
  const isLoss = opponentRevealed && opponent && playerScore < opponent.score;
  const isTie = opponentRevealed && opponent && playerScore === opponent.score;

  return (
    <div
      id="results-view-container"
      className="relative w-full max-w-lg mx-auto min-h-[92vh] sm:min-h-[85vh] flex flex-col justify-between p-3 sm:p-5 bg-diamond-pattern rounded-3xl shadow-2xl border-4 border-slate-700/60 overflow-hidden"
    >
      {/* Top action row */}
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onPlayAgain}
            className="flex items-center gap-1.5 text-xs font-bold bg-slate-900/60 hover:bg-slate-900/90 text-slate-200 px-3 py-1.5 rounded-full border border-slate-700/60 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Game</span>
          </button>
        </div>

        {/* Dictionary & Help */}
        <div className="flex items-center gap-1.5">
          <button
            id="view-dictionary-button"
            onClick={onOpenDictionary}
            className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-slate-200 flex items-center justify-center border border-slate-700/60 transition cursor-pointer"
            title="View all possible words"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenDictionary}
            className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-slate-200 flex items-center justify-center border border-slate-700/60 transition cursor-pointer"
            title="Word List breakdown"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Outcome Banner if opponent is active */}
      {opponentRevealed && opponent && (
        <div className="mb-2 text-center animate-pop-score">
          {isWin && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-4 py-1 rounded-full text-xs font-black tracking-wider uppercase">
              <Trophy className="w-3.5 h-3.5 text-amber-300" /> YOU WON THE DUEL!
            </span>
          )}
          {isLoss && (
            <span className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-4 py-1 rounded-full text-xs font-black tracking-wider uppercase">
              {opponent.name} WON THIS ROUND
            </span>
          )}
          {isTie && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-4 py-1 rounded-full text-xs font-black tracking-wider uppercase">
              IT'S A TIE!
            </span>
          )}
        </div>
      )}

      {/* 2-Column GamePigeon Results Layout */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 flex-1 my-1">
        {/* Left Column: Player (You) */}
        <div className="flex flex-col">
          {/* Top Player Paper Banner */}
          <div className="mb-2">
            <ScoreBanner
              wordsCount={playerWords.length}
              score={playerScore}
              avatarEmoji={playerProfile.avatarEmoji}
              avatarBg={playerProfile.avatarColor}
              playerName="You"
              compact
            />
          </div>

          {/* Word List Stack */}
          <div
            id="player-words-list"
            className="flex-1 bg-slate-900/40 rounded-xl p-2 sm:p-2.5 border border-slate-700/40 overflow-y-auto max-h-[46vh] custom-wood-scroll space-y-1.5"
          >
            {playerWords.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-xs text-slate-400 font-medium py-8">
                No words found
              </div>
            ) : (
              playerWords.map((item, idx) => (
                <div
                  key={`pw-${item.word}-${idx}`}
                  className="flex items-center justify-between gap-1 py-0.5"
                >
                  {/* Wooden word tiles */}
                  <div className="flex items-center gap-[2px]">
                    {item.word.split('').map((ch, i) => (
                      <WoodTile
                        key={`ch-${i}`}
                        letter={ch}
                        size="mini"
                      />
                    ))}
                  </div>
                  {/* Points */}
                  <span className="text-xs sm:text-sm font-black text-slate-200 tracking-tight font-mono">
                    {item.score}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Opponent */}
        <div className="flex flex-col">
          {/* Top Opponent Banner */}
          <div className="mb-2">
            <ScoreBanner
              wordsCount={opponentRevealed && opponent ? opponent.words.length : 0}
              score={opponentRevealed && opponent ? opponent.score : -1}
              avatarEmoji={opponent?.avatarEmoji || (opponentRevealed ? '🤖' : '?')}
              avatarBg={opponent?.avatarUrl || '#4752C4'}
              playerName={opponent?.name || 'Opponent'}
              isOpponent={!opponentRevealed}
              compact
            />
          </div>

          {/* Opponent Word Stack */}
          <div
            id="opponent-words-list"
            className="flex-1 bg-slate-900/40 rounded-xl p-2 sm:p-2.5 border border-slate-700/40 overflow-y-auto max-h-[46vh] custom-wood-scroll space-y-1.5 flex flex-col justify-start"
          >
            {!opponentRevealed ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400/80 p-4 gap-2">
                <span className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 font-black text-lg border border-slate-700">
                  ?
                </span>
                <span>Waiting for opponent or bot to reveal...</span>
              </div>
            ) : opponent && opponent.words.length > 0 ? (
              opponent.words.map((item, idx) => (
                <div
                  key={`ow-${item.word}-${idx}`}
                  className="flex items-center justify-between gap-1 py-0.5"
                >
                  <div className="flex items-center gap-[2px]">
                    {item.word.split('').map((ch, i) => (
                      <WoodTile
                        key={`och-${i}`}
                        letter={ch}
                        size="mini"
                      />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm font-black text-slate-200 tracking-tight font-mono">
                    {item.score}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-center text-xs text-slate-400 py-8">
                0 words found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="mt-3 flex flex-col gap-2 select-none">
        {!opponentRevealed && opponent ? (
          <button
            id="reveal-opponent-button"
            type="button"
            onClick={handleReveal}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-black text-sm uppercase tracking-wider shadow-lg border border-emerald-400/40 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>REVEAL OPPONENT ({opponent.name})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-full py-2.5 rounded-xl bg-slate-900/70 border border-slate-700/60 text-slate-300 font-extrabold text-xs uppercase tracking-wider text-center">
            {opponent ? `MATCH COMPLETED • ${rootWord}` : 'WAITING FOR OPPONENT..'}
          </div>
        )}

        {/* Discord Share & Copy Link Grid */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id="share-discord-button"
            type="button"
            onClick={handleCopyDiscord}
            className="py-2.5 px-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
          >
            {copiedDiscord ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedDiscord ? 'Copied to Clipboard!' : 'Share to Discord'}</span>
          </button>

          <button
            id="copy-match-link-button"
            type="button"
            onClick={handleCopyLink}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-600/50 shadow transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copied!' : 'Challenge Friend'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

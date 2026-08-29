import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Share2, RotateCcw, BookOpen, Check, Copy, Bot, Trophy, ArrowRight, HelpCircle, Terminal, Cpu } from 'lucide-react';
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

  // Trigger cyber neon matrix confetti if high score or won
  useEffect(() => {
    if (playerScore >= 1000) {
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00ff66', '#00ffcc', '#55ff99', '#ffffff', '#10b981'],
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
      className="relative w-full max-w-lg mx-auto min-h-[92vh] sm:min-h-[85vh] flex flex-col justify-between p-3 sm:p-5 bg-matrix-pattern rounded-2xl shadow-[0_0_50px_rgba(0,255,102,0.15)] border border-[#00ff66]/50 overflow-hidden text-emerald-100"
    >
      {/* Top action row */}
      <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-[#00ff66]/20">
        <div className="flex items-center gap-2">
          <button
            onClick={onPlayAgain}
            className="flex items-center gap-1.5 text-xs font-mono font-bold bg-[#002a11] hover:bg-[#003816] text-[#00ff66] px-3.5 py-1.5 rounded-lg border border-[#00ff66]/60 shadow-[0_0_10px_rgba(0,255,102,0.2)] transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>[ REBOOT RUN ]</span>
          </button>
        </div>

        {/* Dictionary & Help */}
        <div className="flex items-center gap-1.5 font-mono">
          <button
            id="view-dictionary-button"
            onClick={onOpenDictionary}
            className="w-8 h-8 rounded-lg bg-black hover:bg-emerald-950/80 text-[#00ff66] flex items-center justify-center border border-[#00ff66]/40 transition cursor-pointer shadow-[0_0_8px_rgba(0,255,102,0.2)]"
            title="Inspect full dictionary payload permutations"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Outcome Banner if opponent is active */}
      {opponentRevealed && opponent && (
        <div className="my-2 text-center animate-pop-score">
          {isWin && (
            <span className="inline-flex items-center gap-1.5 bg-[#003314] text-[#00ff66] border border-[#00ff66] px-4 py-1 rounded font-mono text-xs font-black tracking-wider uppercase shadow-[0_0_15px_#00ff66]">
              <Trophy className="w-3.5 h-3.5 text-[#00ffcc]" /> [ OVERRIDE SUCCESS: DUEL WON ]
            </span>
          )}
          {isLoss && (
            <span className="inline-flex items-center gap-1.5 bg-[#3b0808] text-rose-300 border border-rose-500 px-4 py-1 rounded font-mono text-xs font-black tracking-wider uppercase shadow-[0_0_15px_#f43f5e]">
              [ ACCESS DENIED: {opponent.name.toUpperCase()} PREVAILED ]
            </span>
          )}
          {isTie && (
            <span className="inline-flex items-center gap-1.5 bg-[#052e16] text-[#00ffcc] border border-[#00ffcc] px-4 py-1 rounded font-mono text-xs font-black tracking-wider uppercase shadow-[0_0_15px_#00ffcc]">
              [ SYSTEM PARITY: TIED MATCH ]
            </span>
          )}
        </div>
      )}

      {/* 2-Column Matrix Decrypted Results Layout */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 flex-1 my-2">
        {/* Left Column: Player (You) */}
        <div className="flex flex-col">
          {/* Top Player HUD Banner */}
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
            className="flex-1 bg-black/80 rounded-xl p-2 sm:p-2.5 border border-[#00ff66]/40 overflow-y-auto max-h-[46vh] custom-matrix-scroll space-y-1.5"
          >
            {playerWords.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-xs font-mono text-emerald-600 font-medium py-8">
                [ 0 CIPHERS EXTRACTED ]
              </div>
            ) : (
              playerWords.map((item, idx) => (
                <div
                  key={`pw-${item.word}-${idx}`}
                  className="flex items-center justify-between gap-1 py-0.5 border-b border-[#00ff66]/10"
                >
                  {/* Cyber mini tiles */}
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
                  <span className="text-xs sm:text-sm font-black text-[#00ff66] font-mono">
                    +{item.score}b
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
              avatarBg={opponent?.avatarUrl || '#052e16'}
              playerName={opponent?.name || 'Opponent'}
              isOpponent={!opponentRevealed}
              compact
            />
          </div>

          {/* Opponent Word Stack */}
          <div
            id="opponent-words-list"
            className="flex-1 bg-black/80 rounded-xl p-2 sm:p-2.5 border border-[#00ff66]/40 overflow-y-auto max-h-[46vh] custom-matrix-scroll space-y-1.5 flex flex-col justify-start"
          >
            {!opponentRevealed ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs font-mono text-emerald-600 p-4 gap-2">
                <span className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-[#00ff66] font-black text-lg border border-[#00ff66]/40 shadow-[0_0_10px_rgba(0,255,102,0.2)]">
                  ?
                </span>
                <span>DECRYPTION STREAM LOCKED...</span>
              </div>
            ) : opponent && opponent.words.length > 0 ? (
              opponent.words.map((item, idx) => (
                <div
                  key={`ow-${item.word}-${idx}`}
                  className="flex items-center justify-between gap-1 py-0.5 border-b border-[#00ff66]/10"
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
                  <span className="text-xs sm:text-sm font-black text-[#00ff66] font-mono">
                    +{item.score}b
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-center text-xs font-mono text-emerald-600 py-8">
                0 WORDS EXTRACTED
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
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-[#00ff66] to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-black font-['Orbitron',monospace] font-black text-sm uppercase tracking-wider shadow-[0_0_20px_#00ff66] border border-white transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>DECRYPT OPPONENT LOGS ({opponent.name.toUpperCase()})</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        ) : (
          <div className="w-full py-2 rounded-xl bg-black/80 border border-[#00ff66]/40 text-[#00ff66] font-mono font-bold text-xs uppercase tracking-wider text-center">
            {opponent ? `RUN FINISHED • SEED: ${rootWord}` : 'WAITING FOR OPPONENT..'}
          </div>
        )}

        {/* Discord Share & Copy Link Grid */}
        <div className="grid grid-cols-2 gap-2 font-mono">
          <button
            id="share-discord-button"
            type="button"
            onClick={handleCopyDiscord}
            className="py-2.5 px-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(88,101,242,0.4)] transition cursor-pointer border border-white/20"
          >
            {copiedDiscord ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedDiscord ? 'PAYLOAD COPIED!' : 'DISCORD EXPORT'}</span>
          </button>

          <button
            id="copy-match-link-button"
            type="button"
            onClick={handleCopyLink}
            className="py-2.5 px-3 rounded-xl bg-black hover:bg-[#002a11] active:scale-[0.98] text-[#00ff66] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#00ff66]/60 shadow-[0_0_12px_rgba(0,255,102,0.2)] transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-[#00ffcc]" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'SEED COPIED!' : 'SHARE SEED'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};


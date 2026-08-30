import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WoodTile } from './WoodTile';
import { ScoreBanner } from './ScoreBanner';
import { SubmittedWord, TileLetter, PlayerProfile, GameSettings } from '../types/game';
import { calculateWordScore, DICTIONARY, shuffleArray } from '../utils/dictionary';
import { sound } from '../utils/sound';

interface GameBoardProps {
  scrambledLetters: string;
  playerProfile: PlayerProfile;
  settings: GameSettings;
  duelTurnInfo?: {
    currentTurn: 1 | 2;
    operatorName: string;
  };
  onRoundComplete: (words: SubmittedWord[], score: number) => void;
  onExitToLobby: () => void;
  initialScore?: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  scrambledLetters,
  playerProfile,
  settings,
  duelTurnInfo,
  onRoundComplete,
  onExitToLobby,
}) => {
  const [rackLetters, setRackLetters] = useState<TileLetter[]>(() =>
    scrambledLetters.split('').map((ch, idx) => ({
      id: `tile-${idx}-${ch}-${Math.random().toString(36).substring(2, 5)}`,
      letter: ch.toUpperCase(),
      originalIndex: idx,
    }))
  );

  const [slottedLetters, setSlottedLetters] = useState<TileLetter[]>([]);
  const [submittedWords, setSubmittedWords] = useState<SubmittedWord[]>([]);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(settings.roundDuration);
  const [isShakeError, setIsShakeError] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; score?: number; type: 'success' | 'error' } | null>(null);

  const toastTimeoutRef = useRef<number | null>(null);
  const totalSlots = scrambledLetters.length;

  const submittedWordsRef = useRef<SubmittedWord[]>(submittedWords);
  const scoreRef = useRef<number>(score);
  const onRoundCompleteRef = useRef(onRoundComplete);

  useEffect(() => {
    submittedWordsRef.current = submittedWords;
  }, [submittedWords]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    onRoundCompleteRef.current = onRoundComplete;
  }, [onRoundComplete]);

  // Round Timer
  useEffect(() => {
    if (settings.roundDuration <= 0) return;

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sound.playGameOver();
          setTimeout(() => {
            onRoundCompleteRef.current(submittedWordsRef.current, scoreRef.current);
          }, 300);
          return 0;
        }

        if (prev <= 6) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.roundDuration]);

  const showToast = (message: string, type: 'success' | 'error', pts?: number) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setFeedbackToast({ message, score: pts, type });
    toastTimeoutRef.current = window.setTimeout(() => {
      setFeedbackToast(null);
    }, 1100);
  };

  const handleRackTileClick = useCallback((tile: TileLetter) => {
    sound.playTileClick();
    setRackLetters((prev) => prev.filter((t) => t.id !== tile.id));
    setSlottedLetters((prev) => [...prev, tile]);
  }, []);

  const handleSlotTileClick = useCallback((tile: TileLetter) => {
    sound.playTileReturn();
    setSlottedLetters((prev) => prev.filter((t) => t.id !== tile.id));
    setRackLetters((prev) => [...prev, tile]);
  }, []);

  const handleClearSlots = useCallback(() => {
    if (slottedLetters.length === 0) return;
    sound.playTileReturn();
    setRackLetters((prev) => [...prev, ...slottedLetters]);
    setSlottedLetters([]);
  }, [slottedLetters]);

  const handleShuffle = useCallback(() => {
    sound.playShuffle();
    setRackLetters((prev) => shuffleArray(prev));
  }, []);

  const handleSubmitWord = useCallback(() => {
    if (slottedLetters.length < 3) return;

    const currentWord = slottedLetters.map((t) => t.letter).join('');

    const alreadyFound = submittedWords.some((w) => w.word === currentWord);
    if (alreadyFound) {
      sound.playInvalidWord();
      setIsShakeError(true);
      showToast('ALREADY FOUND', 'error');
      setTimeout(() => setIsShakeError(false), 350);
      return;
    }

    if (DICTIONARY.has(currentWord)) {
      const wordScore = calculateWordScore(currentWord);
      sound.playValidWord(currentWord.length);

      const newSubmitted: SubmittedWord = {
        word: currentWord,
        score: wordScore,
        length: currentWord.length,
        timestamp: Date.now(),
      };

      setSubmittedWords((prev) => [newSubmitted, ...prev]);
      setScore((prev) => prev + wordScore);
      showToast(`+${wordScore} PTS`, 'success', wordScore);

      setRackLetters((prev) => [...prev, ...slottedLetters]);
      setSlottedLetters([]);
    } else {
      sound.playInvalidWord();
      setIsShakeError(true);
      showToast('NOT IN DICTIONARY', 'error');
      setTimeout(() => setIsShakeError(false), 350);
    }
  }, [slottedLetters, submittedWords]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = e.key.toUpperCase();

      if (key === 'ENTER' || key === 'Z') {
        e.preventDefault();
        handleSubmitWord();
      } else if (key === 'BACKSPACE' || key === 'X') {
        e.preventDefault();
        if (slottedLetters.length > 0) {
          const lastTile = slottedLetters[slottedLetters.length - 1];
          handleSlotTileClick(lastTile);
        }
      } else if (key === ' ' || key === 'SPACE' || key === 'SHIFT') {
        e.preventDefault();
        handleShuffle();
      } else if (key === 'ESCAPE') {
        e.preventDefault();
        handleClearSlots();
      } else if (/^[A-Z]$/.test(key)) {
        e.preventDefault();
        const match = rackLetters.find((t) => t.letter === key);
        if (match) {
          handleRackTileClick(match);
        } else {
          sound.playInvalidWord();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rackLetters, slottedLetters, handleSubmitWord, handleSlotTileClick, handleShuffle, handleClearSlots, handleRackTileClick]);

  const canSubmit = slottedLetters.length >= 3;

  return (
    <div
      id="game-board-container"
      className="relative w-full h-full flex flex-col justify-between p-2 sm:p-3 select-none text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace]"
    >
      {/* Top 8-Bit LCD Header Bar */}
      <div className="flex items-center justify-between pb-1.5 border-b-2 border-[var(--lcd-darkest,#0f380f)] text-[8px] sm:text-[9px]">
        {/* Left: Exit/Menu */}
        <button
          type="button"
          onClick={onExitToLobby}
          className="px-1.5 py-0.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)] cursor-pointer"
        >
          ◄ MENU
        </button>

        {/* Center: Duel or Mode */}
        {duelTurnInfo ? (
          <div className="text-[8px] px-1 bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]">
            T{duelTurnInfo.currentTurn}: {duelTurnInfo.operatorName.substring(0, 7)}
          </div>
        ) : (
          <div className="text-[8px] tracking-tighter">ANAGRAMS</div>
        )}

        {/* Right: Timer */}
        <div className="flex items-center gap-1 font-bold">
          <span>TIME:</span>
          <span className={`px-1 ${timeLeft <= 10 ? 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] animate-pulse' : ''}`}>
            {settings.roundDuration > 0 ? `${timeLeft}s` : '∞'}
          </span>
        </div>
      </div>

      {/* Score HUD Banner */}
      <div className="my-1">
        <ScoreBanner
          wordsCount={submittedWords.length}
          score={score}
          avatarEmoji={playerProfile.avatarEmoji}
          playerName={playerProfile.name}
          compact
        />
      </div>

      {/* Toast Popover */}
      {feedbackToast && (
        <div className="w-full text-center py-1 bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] text-[8px] sm:text-[9px] animate-gb-pop">
          {feedbackToast.type === 'success' ? `★ ${feedbackToast.message} ★` : `! ${feedbackToast.message} !`}
        </div>
      )}

      {/* Recent Found Words Scroll Stream */}
      <div className="w-full flex items-center gap-1 overflow-x-auto py-1 px-1 min-h-[26px] gb-scroll border-y border-[var(--lcd-dark,#306230)]/40 text-[8px]">
        {submittedWords.length === 0 ? (
          <span className="text-[7px] text-[var(--lcd-dark,#306230)]">BUILD 3-7 LETTER WORDS...</span>
        ) : (
          submittedWords.slice(0, 6).map((sw, i) => (
            <span
              key={`${sw.word}-${i}`}
              className="px-1 py-0.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] shrink-0"
            >
              {sw.word} +{sw.score}
            </span>
          ))
        )}
      </div>

      {/* Target Word Slots Area */}
      <div className="my-2 flex flex-col items-center">
        <div className="text-[7px] mb-1 text-[var(--lcd-dark,#306230)]">SPELL WORD:</div>
        <div
          id="word-slots-container"
          className={`flex items-center justify-center gap-1 sm:gap-1.5 ${isShakeError ? 'animate-gb-shake' : ''}`}
        >
          {Array.from({ length: totalSlots }).map((_, idx) => {
            const slottedTile = slottedLetters[idx];
            return (
              <div
                key={`slot-${idx}`}
                className="gb-slot-well w-8 h-9 sm:w-10 sm:h-11 rounded-sm flex items-center justify-center"
              >
                {slottedTile && (
                  <WoodTile
                    id={`slotted-tile-${slottedTile.id}`}
                    letter={slottedTile.letter}
                    onClick={() => handleSlotTileClick(slottedTile)}
                    size="normal"
                    isSlotted
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Letter Rack */}
      <div className="my-1 flex flex-col items-center">
        <div
          id="letter-rack-container"
          className="flex items-center justify-center gap-1 sm:gap-1.5 pt-1"
        >
          {rackLetters.map((tile) => (
            <WoodTile
              key={tile.id}
              id={`rack-tile-${tile.id}`}
              letter={tile.letter}
              onClick={() => handleRackTileClick(tile)}
              size="normal"
            />
          ))}
        </div>
      </div>

      {/* Action Bar (mapped to A/B/Select buttons with on-screen taps too) */}
      <div className="pt-1.5 border-t-2 border-[var(--lcd-darkest,#0f380f)] grid grid-cols-3 gap-1 text-[7px] sm:text-[8px]">
        {/* SHUFFLE */}
        <button
          type="button"
          onClick={handleShuffle}
          className="py-1.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)] cursor-pointer text-center"
        >
          [SEL] SHUFFLE
        </button>

        {/* CLEAR */}
        <button
          type="button"
          onClick={handleClearSlots}
          disabled={slottedLetters.length === 0}
          className="py-1.5 border border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] disabled:opacity-40 hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)] cursor-pointer text-center"
        >
          [B] CLEAR
        </button>

        {/* SUBMIT */}
        <button
          type="button"
          onClick={handleSubmitWord}
          disabled={!canSubmit}
          className={`py-1.5 border border-[var(--lcd-darkest,#0f380f)] text-center font-bold ${
            canSubmit
              ? 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] cursor-pointer animate-pulse'
              : 'bg-[var(--lcd-bg-light,#9bbc0f)] opacity-40 cursor-not-allowed'
          }`}
        >
          [A] SUBMIT
        </button>
      </div>
    </div>
  );
};

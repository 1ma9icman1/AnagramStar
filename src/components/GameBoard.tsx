import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shuffle, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { WoodTile } from './WoodTile';
import { ScoreBanner } from './ScoreBanner';
import { SubmittedWord, TileLetter, PlayerProfile, GameSettings } from '../types/game';
import { calculateWordScore, DICTIONARY, shuffleArray } from '../utils/dictionary';
import { sound } from '../utils/sound';

interface GameBoardProps {
  scrambledLetters: string;
  playerProfile: PlayerProfile;
  settings: GameSettings;
  onRoundComplete: (words: SubmittedWord[], score: number) => void;
  onExitToLobby: () => void;
  initialScore?: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  scrambledLetters,
  playerProfile,
  settings,
  onRoundComplete,
  onExitToLobby,
}) => {
  // Tile states
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
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.soundEnabled);

  const toastTimeoutRef = useRef<number | null>(null);
  const totalSlots = scrambledLetters.length;

  // Sound sync
  useEffect(() => {
    sound.enabled = soundEnabled;
  }, [soundEnabled]);

  // Round Timer
  useEffect(() => {
    if (settings.roundDuration <= 0) return; // Untimed practice mode

    const interval = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          sound.playGameOver();
          // Round completed
          setTimeout(() => {
            onRoundComplete(submittedWords, score);
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
  }, [settings.roundDuration, submittedWords, score, onRoundComplete]);

  // Format timer as 00:ss or mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper to show toast
  const showToast = (message: string, type: 'success' | 'error', pts?: number) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setFeedbackToast({ message, score: pts, type });
    toastTimeoutRef.current = window.setTimeout(() => {
      setFeedbackToast(null);
    }, 1200);
  };

  // Move tile from rack to slot
  const handleRackTileClick = useCallback((tile: TileLetter) => {
    sound.playTileClick();
    setRackLetters(prev => prev.filter(t => t.id !== tile.id));
    setSlottedLetters(prev => [...prev, tile]);
  }, []);

  // Return tile from slot back to rack
  const handleSlotTileClick = useCallback((tile: TileLetter) => {
    sound.playTileReturn();
    setSlottedLetters(prev => prev.filter(t => t.id !== tile.id));
    setRackLetters(prev => [...prev, tile]);
  }, []);

  // Clear all slotted letters
  const handleClearSlots = useCallback(() => {
    if (slottedLetters.length === 0) return;
    sound.playTileReturn();
    setRackLetters(prev => [...prev, ...slottedLetters]);
    setSlottedLetters([]);
  }, [slottedLetters]);

  // Shuffle bottom rack
  const handleShuffle = useCallback(() => {
    sound.playShuffle();
    setRackLetters(prev => shuffleArray(prev));
  }, []);

  // Submit current slotted word
  const handleSubmitWord = useCallback(() => {
    if (slottedLetters.length < 3) return;

    const currentWord = slottedLetters.map(t => t.letter).join('');
    
    // Check if duplicate
    const alreadyFound = submittedWords.some(w => w.word === currentWord);
    if (alreadyFound) {
      sound.playInvalidWord();
      setIsShakeError(true);
      showToast('ALREADY FOUND', 'error');
      setTimeout(() => setIsShakeError(false), 400);
      return;
    }

    // Check dictionary
    if (DICTIONARY.has(currentWord)) {
      const wordScore = calculateWordScore(currentWord);
      sound.playValidWord(currentWord.length);

      const newSubmitted: SubmittedWord = {
        word: currentWord,
        score: wordScore,
        length: currentWord.length,
        timestamp: Date.now(),
      };

      setSubmittedWords(prev => [newSubmitted, ...prev]);
      setScore(prev => prev + wordScore);
      showToast(`+${wordScore}`, 'success', wordScore);

      // Return letters to bottom rack
      setRackLetters(prev => [...prev, ...slottedLetters]);
      setSlottedLetters([]);
    } else {
      sound.playInvalidWord();
      setIsShakeError(true);
      showToast('NOT IN WORD LIST', 'error');
      setTimeout(() => setIsShakeError(false), 400);
    }
  }, [slottedLetters, submittedWords]);

  // Keyboard controls (A-Z, Backspace, Enter, Space, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input or modifier keys
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = e.key.toUpperCase();

      if (key === 'ENTER') {
        e.preventDefault();
        handleSubmitWord();
      } else if (key === 'BACKSPACE') {
        e.preventDefault();
        if (slottedLetters.length > 0) {
          const lastTile = slottedLetters[slottedLetters.length - 1];
          handleSlotTileClick(lastTile);
        }
      } else if (key === ' ' || key === 'SPACE') {
        e.preventDefault();
        handleShuffle();
      } else if (key === 'ESCAPE') {
        e.preventDefault();
        handleClearSlots();
      } else if (/^[A-Z]$/.test(key)) {
        e.preventDefault();
        // Find available tile in rack matching letter
        const match = rackLetters.find(t => t.letter === key);
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
      className="relative w-full max-w-md mx-auto min-h-[92vh] sm:min-h-[85vh] flex flex-col justify-between p-4 sm:p-6 bg-diamond-pattern rounded-3xl shadow-2xl border-4 border-slate-700/60 overflow-hidden"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full pt-1 pb-3 select-none">
        {/* Shuffle Button */}
        <button
          id="shuffle-button"
          type="button"
          onClick={handleShuffle}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-800/80 hover:bg-slate-700/90 active:scale-95 text-slate-200 flex items-center justify-center shadow-lg border border-slate-600/50 transition-all cursor-pointer group"
          title="Shuffle letters (Spacebar)"
        >
          <Shuffle className="w-5 h-5 group-hover:rotate-45 transition-transform duration-200" />
        </button>

        {/* Center Pill Handle */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onExitToLobby}
            className="text-[11px] font-bold text-slate-300/80 hover:text-white bg-slate-900/40 hover:bg-slate-900/70 px-2.5 py-1 rounded-full border border-slate-700/50 transition cursor-pointer"
          >
            Quit
          </button>
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className="w-7 h-7 rounded-full bg-slate-900/40 hover:bg-slate-900/70 flex items-center justify-center text-slate-300/80 border border-slate-700/50 transition cursor-pointer"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
          </button>
        </div>

        {/* Timer Pill */}
        {settings.roundDuration > 0 ? (
          <div
            id="timer-badge"
            className={`
              px-3.5 py-1.5 rounded-full font-black text-sm sm:text-base tracking-wider font-mono shadow-inner border
              ${timeLeft <= 10 ? 'bg-rose-900/90 text-rose-200 border-rose-500 animate-pulse' : 'bg-slate-900/80 text-blue-300 border-indigo-500/40'}
            `}
          >
            {formatTime(timeLeft)}
          </div>
        ) : (
          <div className="px-3.5 py-1.5 rounded-full font-bold text-xs bg-slate-900/80 text-emerald-300 border border-emerald-500/40">
            ZEN MODE
          </div>
        )}
      </div>

      {/* Torn Paper Score Banner */}
      <div className="my-2 relative w-full flex flex-col items-center">
        <ScoreBanner
          wordsCount={submittedWords.length}
          score={score}
          avatarEmoji={playerProfile.avatarEmoji}
          avatarBg={playerProfile.avatarColor}
        />

        {/* Floating Toast Notification */}
        {feedbackToast && (
          <div
            className={`
              absolute -bottom-10 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full font-black text-sm tracking-wide shadow-2xl flex items-center gap-1.5 z-30 animate-pop-score
              ${feedbackToast.type === 'success' ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300' : 'bg-rose-600 text-white ring-2 ring-rose-300'}
            `}
          >
            {feedbackToast.type === 'error' && <AlertCircle className="w-4 h-4" />}
            <span>{feedbackToast.message}</span>
          </div>
        )}
      </div>

      {/* Found Words Mini Ticker (recent words) */}
      <div className="w-full flex items-center justify-center gap-1.5 overflow-x-auto py-1 px-2 min-h-7">
        {submittedWords.slice(0, 5).map((sw, i) => (
          <span
            key={`${sw.word}-${i}`}
            className="text-[11px] font-bold bg-slate-900/60 border border-slate-700/60 text-amber-300 px-2 py-0.5 rounded-md shadow-sm animate-pop-score"
          >
            {sw.word} <span className="text-slate-400 font-normal">+{sw.score}</span>
          </span>
        ))}
      </div>

      {/* Mid Action: ENTER Button */}
      <div className="flex flex-col items-center justify-center my-3">
        <button
          id="enter-button"
          type="button"
          onClick={handleSubmitWord}
          disabled={!canSubmit}
          className={`
            w-48 sm:w-56 py-2.5 sm:py-3 rounded-xl font-black text-base sm:text-lg tracking-widest uppercase transition-all duration-150 select-none
            ${canSubmit
              ? 'bg-gradient-to-b from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 active:scale-95 text-white shadow-lg border border-indigo-400/50 cursor-pointer'
              : 'bg-slate-800/40 text-slate-500/60 border border-slate-700/30 cursor-not-allowed'}
          `}
        >
          ENTER
        </button>
      </div>

      {/* Target Word Slots Area */}
      <div
        id="word-slots-container"
        className={`
          flex items-center justify-center gap-1.5 sm:gap-2 mb-3
          ${isShakeError ? 'animate-invalid-shake' : ''}
        `}
      >
        {Array.from({ length: totalSlots }).map((_, idx) => {
          const slottedTile = slottedLetters[idx];
          return (
            <div
              key={`slot-${idx}`}
              className="slot-well w-12 h-14 sm:w-14 sm:h-16 rounded-[7px] flex items-center justify-center"
            >
              {slottedTile && (
                <WoodTile
                  id={`slotted-tile-${slottedTile.id}`}
                  letter={slottedTile.letter}
                  onClick={() => handleSlotTileClick(slottedTile)}
                  isSlotted
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Letter Rack */}
      <div
        id="letter-rack-container"
        className="flex items-center justify-center gap-1.5 sm:gap-2 pt-2 pb-4"
      >
        {rackLetters.map(tile => (
          <WoodTile
            key={tile.id}
            id={`rack-tile-${tile.id}`}
            letter={tile.letter}
            onClick={() => handleRackTileClick(tile)}
          />
        ))}
      </div>
    </div>
  );
};

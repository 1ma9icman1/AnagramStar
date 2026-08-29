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
      className="relative w-full max-w-md mx-auto min-h-[92vh] sm:min-h-[85vh] flex flex-col justify-between p-4 sm:p-6 bg-matrix-pattern rounded-2xl shadow-[0_0_50px_rgba(0,255,102,0.15)] border border-[#00ff66]/50 overflow-hidden text-emerald-100"
    >
      {/* Top Cyber Header Bar */}
      <div className="flex items-center justify-between w-full pt-1 pb-3 select-none border-b border-[#00ff66]/20">
        {/* Shuffle / Rotate Button */}
        <button
          id="shuffle-button"
          type="button"
          onClick={handleShuffle}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-black/80 hover:bg-emerald-950/80 active:scale-95 text-[#00ff66] flex items-center justify-center shadow-[0_0_15px_rgba(0,255,102,0.2)] border border-[#00ff66]/60 transition-all cursor-pointer group"
          title="Scramble & Re-index letters (Spacebar)"
        >
          <Shuffle className="w-5 h-5 group-hover:rotate-90 text-[#00ff66] transition-transform duration-300" />
        </button>

        {/* Center Control Pod */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExitToLobby}
            className="text-[10px] sm:text-[11px] font-mono font-bold text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 px-3 py-1 rounded border border-rose-500/40 transition cursor-pointer"
          >
            [ ABORT ]
          </button>
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className="w-8 h-8 rounded bg-black/60 hover:bg-emerald-950/60 flex items-center justify-center text-emerald-400 border border-[#00ff66]/40 transition cursor-pointer"
            title="Toggle Audio Feedback"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#00ff66]" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
        </div>

        {/* Terminal Timer Badge */}
        {settings.roundDuration > 0 ? (
          <div
            id="timer-badge"
            className={`
              px-3.5 py-1.5 rounded-lg font-black text-sm sm:text-base tracking-widest font-['Orbitron',monospace] border shadow-[0_0_15px_rgba(0,255,102,0.25)]
              ${timeLeft <= 10 ? 'bg-rose-950/90 text-rose-300 border-rose-500 animate-pulse shadow-[0_0_20px_#f43f5e]' : 'bg-black/90 text-[#00ff66] border-[#00ff66]/60'}
            `}
          >
            {formatTime(timeLeft)}
          </div>
        ) : (
          <div className="px-3 py-1 rounded-lg font-mono font-bold text-xs bg-black/90 text-[#00ffcc] border border-[#00ffcc]/60 shadow-[0_0_10px_rgba(0,255,204,0.3)]">
            NEO ZEN
          </div>
        )}
      </div>

      {/* Cyber HUD Score Banner */}
      <div className="my-2 relative w-full flex flex-col items-center">
        <ScoreBanner
          wordsCount={submittedWords.length}
          score={score}
          avatarEmoji={playerProfile.avatarEmoji}
          avatarBg={playerProfile.avatarColor}
        />

        {/* Floating Cyber Toast Notification */}
        {feedbackToast && (
          <div
            className={`
              absolute -bottom-10 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded font-mono font-black text-xs sm:text-sm tracking-wider shadow-[0_0_20px_rgba(0,255,102,0.5)] flex items-center gap-1.5 z-30 animate-pop-score border
              ${feedbackToast.type === 'success' ? 'bg-[#002a11] text-[#00ff66] border-[#00ff66]' : 'bg-[#3b0808] text-rose-300 border-rose-500'}
            `}
          >
            {feedbackToast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{feedbackToast.type === 'success' ? `[ DECRYPTED ${feedbackToast.message} ]` : `[ ERR: ${feedbackToast.message} ]`}</span>
          </div>
        )}
      </div>

      {/* Decrypted Payload Stream (recent words) */}
      <div className="w-full flex items-center justify-center gap-1.5 overflow-x-auto py-1 px-2 min-h-8">
        {submittedWords.slice(0, 5).map((sw, i) => (
          <span
            key={`${sw.word}-${i}`}
            className="text-[11px] font-mono font-bold bg-black/80 border border-[#00ff66]/50 text-[#00ff66] px-2 py-0.5 rounded shadow-[0_0_8px_rgba(0,255,102,0.2)] animate-pop-score"
          >
            {sw.word} <span className="text-[#00ffcc] font-normal">+{sw.score}b</span>
          </span>
        ))}
      </div>

      {/* Mid Action: Cyber EXECUTE Button */}
      <div className="flex flex-col items-center justify-center my-2">
        <button
          id="enter-button"
          type="button"
          onClick={handleSubmitWord}
          disabled={!canSubmit}
          className={`
            w-52 sm:w-60 py-3 rounded-xl font-['Orbitron',monospace] font-black text-sm sm:text-base tracking-widest uppercase transition-all duration-150 select-none border
            ${canSubmit
              ? 'bg-gradient-to-r from-emerald-600 via-[#00ff66] to-teal-500 text-black shadow-[0_0_25px_#00ff66] hover:shadow-[0_0_35px_#00ff66] hover:scale-[1.02] active:scale-95 border-white cursor-pointer'
              : 'bg-black/40 text-emerald-900/60 border-emerald-950/40 cursor-not-allowed'}
          `}
        >
          [ EXECUTE // ENTER ]
        </button>
      </div>

      {/* Target Word Cyber Slots Area */}
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
              className="matrix-slot-well w-12 h-14 sm:w-14 sm:h-16 rounded-[8px] flex items-center justify-center"
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

      {/* Bottom Data Keycap Rack */}
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

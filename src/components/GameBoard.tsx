import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { WoodTile } from './WoodTile';
import { ScoreBanner } from './ScoreBanner';
import { SubmittedWord, TileLetter, PlayerProfile, GameSettings, AppSkin } from '../types/game';
import { calculateWordScore, DICTIONARY, shuffleArray } from '../utils/dictionary';
import { sound } from '../utils/sound';

export interface GameBoardHandle {
  handleAPress: () => void;
  handleBPress: () => void;
  handleSelectPress: () => void;
  handleStartPress: () => void;
  handleDpadPress: (dir: 'up' | 'down' | 'left' | 'right') => void;
  handleKeypadDigit?: (digit: string) => void;
}

interface GameBoardProps {
  scrambledLetters: string;
  playerProfile: PlayerProfile;
  settings: GameSettings;
  duelTurnInfo?: {
    currentTurn: 1 | 2;
    operatorName: string;
  };
  onlineOpponentLive?: {
    name: string;
    avatarEmoji?: string;
    score: number;
    wordCount: number;
    latestWord?: string;
    latestWordScore?: number;
  } | null;
  onWordSubmitted?: (word: SubmittedWord, newTotalScore: number) => void;
  onRoundComplete: (words: SubmittedWord[], score: number) => void;
  onExitToLobby: () => void;
  initialScore?: number;
  skin?: AppSkin;
}

export const GameBoard = forwardRef<GameBoardHandle, GameBoardProps>(({
  scrambledLetters,
  playerProfile,
  settings,
  duelTurnInfo,
  onlineOpponentLive,
  onWordSubmitted,
  onRoundComplete,
  onExitToLobby,
  skin = 'gameboy',
}, ref) => {
  const isCyber = skin === 'cyber';
  const isNormal = skin === 'normal';
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
  const [focusedRackIndex, setFocusedRackIndex] = useState<number>(0);

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

  // Keep focusedRackIndex within bounds when rackLetters change
  useEffect(() => {
    if (rackLetters.length === 0) {
      setFocusedRackIndex(0);
    } else {
      setFocusedRackIndex((prev) => Math.min(prev, rackLetters.length - 1));
    }
  }, [rackLetters.length]);

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
    if (skin === 'nokia') {
      sound.playNokiaKeyBeep();
    } else {
      sound.playTileClick();
    }
    setRackLetters((prev) => prev.filter((t) => t.id !== tile.id));
    setSlottedLetters((prev) => [...prev, tile]);
  }, [skin]);

  const handleSlotTileClick = useCallback((tile: TileLetter) => {
    if (skin === 'nokia') {
      sound.playNokiaKeyBeep('C');
    } else {
      sound.playTileReturn();
    }
    setSlottedLetters((prev) => prev.filter((t) => t.id !== tile.id));
    setRackLetters((prev) => [...prev, tile]);
  }, [skin]);

  const handleClearSlots = useCallback(() => {
    if (slottedLetters.length === 0) {
      if (skin === 'nokia') {
        sound.playNokiaError();
      } else {
        sound.playInvalidWord();
      }
      showToast('NO LETTERS SLOTTED', 'error');
      return;
    }
    if (skin === 'nokia') {
      sound.playNokiaKeyBeep('C');
    } else {
      sound.playTileReturn();
    }
    setRackLetters((prev) => [...prev, ...slottedLetters]);
    setSlottedLetters([]);
  }, [slottedLetters, skin]);

  const handleShuffle = useCallback(() => {
    sound.playShuffle();
    setRackLetters((prev) => shuffleArray(prev));
  }, []);

  const handleSubmitWord = useCallback(() => {
    if (slottedLetters.length === 0) {
      if (skin === 'nokia') {
        sound.playNokiaError();
      } else {
        sound.playInvalidWord();
      }
      setIsShakeError(true);
      showToast('SPELL A WORD FIRST', 'error');
      setTimeout(() => setIsShakeError(false), 350);
      return;
    }

    if (slottedLetters.length < 3) {
      if (skin === 'nokia') {
        sound.playNokiaError();
      } else {
        sound.playInvalidWord();
      }
      setIsShakeError(true);
      showToast('NEED 3+ LETTERS', 'error');
      setTimeout(() => setIsShakeError(false), 350);
      return;
    }

    const currentWord = slottedLetters.map((t) => t.letter).join('');

    const alreadyFound = submittedWords.some((w) => w.word === currentWord);
    if (alreadyFound) {
      if (skin === 'nokia') {
        sound.playNokiaError();
      } else {
        sound.playInvalidWord();
      }
      setIsShakeError(true);
      showToast('ALREADY FOUND', 'error');
      setTimeout(() => setIsShakeError(false), 350);
      return;
    }

    if (DICTIONARY.has(currentWord)) {
      const wordScore = calculateWordScore(currentWord);
      if (skin === 'nokia') {
        sound.playNokiaSnakeBite();
      } else {
        sound.playValidWord(currentWord.length);
      }

      const newSubmitted: SubmittedWord = {
        word: currentWord,
        score: wordScore,
        length: currentWord.length,
        timestamp: Date.now(),
      };

      setSubmittedWords((prev) => [newSubmitted, ...prev]);
      const newTotalScore = score + wordScore;
      setScore(newTotalScore);
      showToast(`+${wordScore} PTS`, 'success', wordScore);

      onWordSubmitted?.(newSubmitted, newTotalScore);

      setRackLetters((prev) => [...prev, ...slottedLetters]);
      setSlottedLetters([]);
      setFocusedRackIndex(0);
    } else {
      if (skin === 'nokia') {
        sound.playNokiaError();
      } else {
        sound.playInvalidWord();
      }
      setIsShakeError(true);
      showToast('NOT IN DICTIONARY', 'error');
      setTimeout(() => setIsShakeError(false), 350);
    }
  }, [slottedLetters, submittedWords, skin]);

  // Controller Actions exposed to App, Physical Game Boy and Nokia buttons
  const handleAPress = useCallback(() => {
    if (slottedLetters.length >= 3) {
      handleSubmitWord();
    } else if (slottedLetters.length > 0) {
      handleSubmitWord(); // Triggers NEED 3+ LETTERS toast & shake
    } else {
      // Slots are empty: if rack has letters, slot the focused rack letter
      if (rackLetters.length > 0) {
        const targetTile = rackLetters[focusedRackIndex] || rackLetters[0];
        if (targetTile) {
          handleRackTileClick(targetTile);
        }
      } else {
        handleSubmitWord();
      }
    }
  }, [slottedLetters.length, handleSubmitWord, rackLetters, focusedRackIndex, handleRackTileClick]);

  const handleBPress = useCallback(() => {
    if (slottedLetters.length > 0) {
      const lastTile = slottedLetters[slottedLetters.length - 1];
      handleSlotTileClick(lastTile);
    } else {
      if (skin === 'nokia') {
        sound.playNokiaKeyBeep('C');
      } else {
        sound.playTileReturn();
      }
      showToast('SLOTS EMPTY (MENU)', 'error');
    }
  }, [slottedLetters, handleSlotTileClick, skin]);

  const handleSelectPress = useCallback(() => {
    handleShuffle();
    showToast('SHUFFLED!', 'success');
  }, [handleShuffle]);

  const handleStartPress = useCallback(() => {
    handleSubmitWord();
  }, [handleSubmitWord]);

  const handleKeypadDigit = useCallback((digit: string) => {
    const keypadMap: Record<string, string[]> = {
      '2': ['A', 'B', 'C'],
      '3': ['D', 'E', 'F'],
      '4': ['G', 'H', 'I'],
      '5': ['J', 'K', 'L'],
      '6': ['M', 'N', 'O'],
      '7': ['P', 'Q', 'R', 'S'],
      '8': ['T', 'U', 'V'],
      '9': ['W', 'X', 'Y', 'Z'],
    };

    if (digit === '1') {
      handleBPress();
      return;
    }

    const letters = keypadMap[digit];
    if (letters) {
      const matchingTile = rackLetters.find((t) => letters.includes(t.letter));
      if (matchingTile) {
        handleRackTileClick(matchingTile);
      } else {
        if (skin === 'nokia') {
          sound.playNokiaError();
        } else {
          sound.playInvalidWord();
        }
      }
    }
  }, [rackLetters, handleRackTileClick, handleBPress, skin]);

  const handleDpadPress = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (dir === 'left') {
      if (rackLetters.length > 0) {
        if (skin === 'nokia') {
          sound.playNokiaKeyBeep(4);
        } else {
          sound.playTileClick();
        }
        setFocusedRackIndex((prev) => (prev - 1 + rackLetters.length) % rackLetters.length);
      }
    } else if (dir === 'right') {
      if (rackLetters.length > 0) {
        if (skin === 'nokia') {
          sound.playNokiaKeyBeep(6);
        } else {
          sound.playTileClick();
        }
        setFocusedRackIndex((prev) => (prev + 1) % rackLetters.length);
      }
    } else if (dir === 'up') {
      if (rackLetters.length > 0) {
        const targetTile = rackLetters[focusedRackIndex] || rackLetters[0];
        if (targetTile) {
          handleRackTileClick(targetTile);
        }
      }
    } else if (dir === 'down') {
      if (slottedLetters.length > 0) {
        const lastTile = slottedLetters[slottedLetters.length - 1];
        handleSlotTileClick(lastTile);
      }
    }
  }, [rackLetters, focusedRackIndex, slottedLetters, handleRackTileClick, handleSlotTileClick, skin]);

  // Imperative handle for parent
  useImperativeHandle(ref, () => ({
    handleAPress,
    handleBPress,
    handleSelectPress,
    handleStartPress,
    handleDpadPress,
    handleKeypadDigit,
  }), [handleAPress, handleBPress, handleSelectPress, handleStartPress, handleDpadPress, handleKeypadDigit]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = e.key.toUpperCase();

      if (key === 'ENTER' || key === 'Z') {
        e.preventDefault();
        handleAPress();
      } else if (key === 'BACKSPACE' || key === 'X') {
        e.preventDefault();
        handleBPress();
      } else if (key === ' ' || key === 'SPACE' || key === 'SHIFT' || key === 'TAB') {
        e.preventDefault();
        handleSelectPress();
      } else if (key === 'ESCAPE') {
        e.preventDefault();
        handleClearSlots();
      } else if (key === 'ARROWLEFT') {
        e.preventDefault();
        handleDpadPress('left');
      } else if (key === 'ARROWRIGHT') {
        e.preventDefault();
        handleDpadPress('right');
      } else if (key === 'ARROWUP') {
        e.preventDefault();
        handleDpadPress('up');
      } else if (key === 'ARROWDOWN') {
        e.preventDefault();
        handleDpadPress('down');
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
  }, [
    rackLetters,
    slottedLetters,
    handleAPress,
    handleBPress,
    handleSelectPress,
    handleClearSlots,
    handleDpadPress,
    handleRackTileClick,
  ]);

  const canSubmit = slottedLetters.length >= 3;

  return (
    <div
      id="game-board-container"
      className={`relative w-full h-full flex flex-col justify-between p-2 sm:p-4 select-none ${
        isNormal
          ? 'text-slate-100 font-sans'
          : isCyber
          ? 'text-emerald-100 font-mono'
          : "text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace]"
      }`}
    >
      {/* Top Header Bar */}
      <div
        className={`flex items-center justify-between pb-2 border-b-2 text-[8px] sm:text-[9px] ${
          isNormal
            ? 'border-amber-800/40 text-slate-300 font-medium'
            : isCyber
            ? 'border-emerald-500/40'
            : 'border-[var(--lcd-darkest,#0f380f)]'
        }`}
      >
        {/* Left: Exit/Menu */}
        <button
          id="board-menu-btn"
          type="button"
          onClick={onExitToLobby}
          className={`px-2.5 py-1 border cursor-pointer active:scale-95 transition-all rounded ${
            isNormal
              ? 'border-amber-700/60 bg-slate-800/80 hover:bg-slate-700 text-amber-200 shadow-xs'
              : isCyber
              ? 'border-emerald-500/60 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300'
              : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
          }`}
        >
          ◄ MENU
        </button>

        {/* Center: Duel or Mode */}
        {duelTurnInfo ? (
          <div
            className={`px-2 py-0.5 rounded text-[8px] font-bold ${
              isNormal
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                : isCyber
                ? 'bg-emerald-950 border border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(0,255,102,0.3)]'
                : 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
            }`}
          >
            T{duelTurnInfo.currentTurn}: {duelTurnInfo.operatorName.substring(0, 8)}
          </div>
        ) : (
          <div className={`text-[9px] tracking-wider ${isNormal ? 'text-amber-300 font-extrabold' : isCyber ? 'text-emerald-400 font-bold' : ''}`}>
            ANAGRAMS
          </div>
        )}

        {/* Right: Timer */}
        <div className="flex items-center gap-1 font-bold">
          <span className={isNormal ? 'text-amber-400' : isCyber ? 'text-emerald-500' : ''}>TIME:</span>
          <span
            className={`px-2 py-0.5 rounded ${
              timeLeft <= 10
                ? isNormal
                  ? 'bg-red-900/80 border border-red-500 text-red-200 animate-pulse font-extrabold shadow-sm'
                  : isCyber
                  ? 'bg-red-950 border border-red-500 text-red-300 animate-pulse shadow-[0_0_8px_red]'
                  : 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] animate-pulse'
                : isNormal
                ? 'bg-slate-800 border border-amber-600/40 text-amber-300 font-bold'
                : isCyber
                ? 'text-emerald-300'
                : ''
            }`}
          >
            {settings.roundDuration > 0 ? `${timeLeft}s` : '∞'}
          </span>
        </div>
      </div>

      {/* Score HUD Banner */}
      <div className="my-1">
        {onlineOpponentLive ? (
          <div
            className={`p-1.5 border rounded-lg flex items-center justify-between text-[7px] sm:text-[8px] font-bold ${
              isNormal
                ? 'border-indigo-600/70 bg-slate-900/90 text-slate-100'
                : isCyber
                ? 'border-emerald-600 bg-black/80 text-emerald-300 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] text-[var(--lcd-darkest,#0f380f)]'
            }`}
          >
            {/* Player Side */}
            <div className="flex items-center gap-1.5">
              <span>{playerProfile.avatarEmoji || '🎮'}</span>
              <div>
                <div className="text-[6px] opacity-75">{playerProfile.name.substring(0, 10)} (YOU)</div>
                <div className="text-[9px] font-black">{score.toLocaleString()} PTS</div>
              </div>
            </div>

            {/* Duel Status Meter */}
            <div className="text-center px-2">
              <span
                className={`px-1.5 py-0.5 border rounded-full text-[6px] uppercase tracking-wider ${
                  score > onlineOpponentLive.score
                    ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300'
                    : score < onlineOpponentLive.score
                    ? 'border-rose-500 bg-rose-950/80 text-rose-300'
                    : 'border-amber-500 bg-amber-950/80 text-amber-300'
                }`}
              >
                {score > onlineOpponentLive.score
                  ? '👑 LEADING'
                  : score < onlineOpponentLive.score
                  ? '⚔️ BEHIND'
                  : '🤝 TIED'}
              </span>
            </div>

            {/* Opponent Side */}
            <div className="flex items-center gap-1.5 text-right">
              <div>
                <div className="text-[6px] opacity-75">{onlineOpponentLive.name.substring(0, 10)}</div>
                <div className="text-[9px] font-black">{onlineOpponentLive.score.toLocaleString()} PTS</div>
              </div>
              <span>{onlineOpponentLive.avatarEmoji || '🕹️'}</span>
            </div>
          </div>
        ) : (
          <ScoreBanner
            wordsCount={submittedWords.length}
            score={score}
            avatarEmoji={playerProfile.avatarEmoji}
            playerName={playerProfile.name}
            compact
            skin={skin}
          />
        )}
      </div>

      {/* Toast Popover */}
      {feedbackToast && (
        <div
          className={`w-full text-center py-1 text-[8px] sm:text-[9px] font-bold animate-gb-pop rounded ${
            isNormal
              ? feedbackToast.type === 'success'
                ? 'bg-emerald-900/90 border border-emerald-500 text-emerald-100 shadow-md'
                : 'bg-rose-900/90 border border-rose-500 text-rose-100 shadow-md'
              : isCyber
              ? feedbackToast.type === 'success'
                ? 'bg-emerald-950/90 border border-emerald-400 text-emerald-200 shadow-[0_0_12px_#00ff66]'
                : 'bg-red-950/90 border border-red-500 text-red-200 shadow-[0_0_12px_red]'
              : 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
          }`}
        >
          {feedbackToast.type === 'success' ? `★ ${feedbackToast.message} ★` : `! ${feedbackToast.message} !`}
        </div>
      )}

      {/* Recent Found Words Stream */}
      <div
        className={`w-full flex items-center gap-1.5 overflow-x-auto py-1.5 px-2 min-h-[28px] gb-scroll border-y text-[8px] rounded ${
          isNormal
            ? 'border-amber-900/30 bg-slate-950/50 text-slate-300'
            : isCyber
            ? 'border-emerald-900/50 bg-black/40 text-emerald-300'
            : 'border-[var(--lcd-dark,#306230)]/40 text-[var(--lcd-darkest,#0f380f)]'
        }`}
      >
        {submittedWords.length === 0 ? (
          <span className={`text-[8px] ${isNormal ? 'text-amber-400/60 font-medium' : isCyber ? 'text-emerald-600' : 'text-[var(--lcd-dark,#306230)]'}`}>
            BUILD 3-7 LETTER WORDS...
          </span>
        ) : (
          submittedWords.slice(0, 6).map((sw, i) => (
            <span
              key={`${sw.word}-${i}`}
              className={`px-2 py-0.5 border rounded shrink-0 font-bold ${
                isNormal
                  ? 'border-amber-600/50 bg-gradient-to-r from-amber-500/20 to-amber-700/20 text-amber-200 shadow-xs'
                  : isCyber
                  ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300 shadow-[0_0_5px_rgba(0,255,102,0.2)]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] text-[var(--lcd-darkest,#0f380f)]'
              }`}
            >
              {sw.word} +{sw.score}
            </span>
          ))
        )}
      </div>

      {/* Target Word Slots Area */}
      <div className="my-2 flex flex-col items-center">
        <div className={`text-[8px] mb-1.5 ${isNormal ? 'text-amber-300/80 font-bold uppercase tracking-wider' : isCyber ? 'text-emerald-400/80 font-mono' : 'text-[var(--lcd-dark,#306230)]'}`}>
          SPELL WORD:
        </div>
        <div
          id="word-slots-container"
          className={`flex items-center justify-center gap-1 sm:gap-1.5 ${isShakeError ? 'animate-gb-shake' : ''}`}
        >
          {Array.from({ length: totalSlots }).map((_, idx) => {
            const slottedTile = slottedLetters[idx];
            return (
              <div
                key={`slot-${idx}`}
                className={`w-9 h-10 sm:w-11 sm:h-12 rounded-lg flex items-center justify-center ${
                  isNormal ? 'wood-slot-well' : isCyber ? 'matrix-slot-well' : 'gb-slot-well'
                }`}
              >
                {slottedTile && (
                  <WoodTile
                    id={`slotted-tile-${slottedTile.id}`}
                    letter={slottedTile.letter}
                    onClick={() => handleSlotTileClick(slottedTile)}
                    size="normal"
                    isSlotted
                    skin={skin}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Letter Rack */}
      <div className="my-1.5 flex flex-col items-center">
        <div
          id="letter-rack-container"
          className="flex items-center justify-center gap-1 sm:gap-1.5 pt-1"
        >
          {rackLetters.map((tile, idx) => {
            const isFocused = idx === focusedRackIndex;
            return (
              <div key={tile.id} className="flex flex-col items-center">
                <WoodTile
                  id={`rack-tile-${tile.id}`}
                  letter={tile.letter}
                  onClick={() => {
                    setFocusedRackIndex(idx);
                    handleRackTileClick(tile);
                  }}
                  size="normal"
                  isSelected={isFocused}
                  skin={skin}
                />
                {/* D-Pad focus indicator triangle on Game Boy skin */}
                {skin === 'gameboy' && (
                  <span
                    className={`text-[7px] leading-none mt-0.5 transition-opacity ${
                      isFocused ? 'opacity-100 font-bold animate-bounce' : 'opacity-0'
                    }`}
                  >
                    ▲
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Bar */}
      <div
        className={`pt-2 border-t-2 grid grid-cols-3 gap-1.5 text-[8px] sm:text-[9px] ${
          isNormal
            ? 'border-amber-900/40'
            : isCyber
            ? 'border-emerald-500/40'
            : 'border-[var(--lcd-darkest,#0f380f)]'
        }`}
      >
        {/* SHUFFLE */}
        <button
          id="action-shuffle-button"
          type="button"
          onClick={handleShuffle}
          className={`py-2.5 border rounded-lg cursor-pointer text-center active:scale-95 transition-all font-bold ${
            isNormal
              ? 'border-amber-700/60 bg-gradient-to-b from-amber-700/30 to-amber-900/40 hover:from-amber-600/40 hover:to-amber-800/50 text-amber-200 shadow-sm'
              : isCyber
              ? 'border-emerald-500/60 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300'
              : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
          }`}
        >
          {isNormal ? '🔀 SHUFFLE' : isCyber ? '[SPACE] SHUFFLE' : '[SEL] SHUFFLE'}
        </button>

        {/* CLEAR */}
        <button
          id="action-clear-button"
          type="button"
          onClick={handleClearSlots}
          className={`py-2.5 border rounded-lg text-center cursor-pointer active:scale-95 transition-all font-bold ${
            isNormal
              ? 'border-rose-800/60 bg-gradient-to-b from-rose-950/40 to-rose-900/40 text-rose-200 hover:from-rose-900/50 hover:to-rose-800/50 shadow-sm'
              : isCyber
              ? 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60'
              : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
          }`}
        >
          {isNormal ? '⌫ CLEAR' : isCyber ? '[BACKSPACE] CLEAR' : '[B] CLEAR'}
        </button>

        {/* SUBMIT */}
        <button
          id="action-submit-button"
          type="button"
          onClick={handleSubmitWord}
          className={`py-2.5 border rounded-lg text-center font-extrabold cursor-pointer active:scale-95 transition-all ${
            isNormal
              ? canSubmit
                ? 'border-emerald-500 bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-lg hover:brightness-110 animate-pulse'
                : 'border-slate-700 bg-slate-800/60 text-slate-400 cursor-not-allowed'
              : isCyber
              ? canSubmit
                ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_15px_#00ff66] hover:bg-[#33ff88] animate-pulse'
                : 'border-emerald-700/60 bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60'
              : canSubmit
              ? 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] animate-pulse'
              : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
          }`}
        >
          {isNormal ? '✓ SUBMIT' : isCyber ? '[ENTER] SUBMIT' : '[A] SUBMIT'}
        </button>
      </div>
    </div>
  );
});

GameBoard.displayName = 'GameBoard';



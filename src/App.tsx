import React, { useState, useEffect, useCallback } from 'react';
import { GameBoard } from './components/GameBoard';
import { ResultsView } from './components/ResultsView';
import { LobbyView } from './components/LobbyView';
import { ProfileModal } from './components/ProfileModal';
import { DictionaryModal } from './components/DictionaryModal';
import {
  GameState,
  SubmittedWord,
  PlayerProfile,
  GameSettings,
  Opponent,
} from './types/game';
import { getRandomPuzzle, findAllValidAnagrams, calculateWordScore } from './utils/dictionary';
import {
  loadSavedProfile,
  saveProfile,
  BotPreset,
  getBotFoundWords,
  decodeMatchChallenge,
} from './utils/discord';

export default function App() {
  // Saved profile & settings
  const [profile, setProfile] = useState<PlayerProfile>(loadSavedProfile);
  const [settings, setSettings] = useState<GameSettings>({
    roundDuration: 60,
    wordLength: 6,
    soundEnabled: true,
    hapticFeedback: true,
    vibration: true,
  });

  // Flow states
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [currentPuzzle, setCurrentPuzzle] = useState<{
    root: string;
    scrambled: string;
    allValidWords: string[];
    maxScore: number;
  } | null>(null);

  // Round results
  const [playerWords, setPlayerWords] = useState<SubmittedWord[]>([]);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponent, setOpponent] = useState<Opponent | null>(null);

  // 2-Player Pass & Play tracking
  const [passPlayState, setPassPlayState] = useState<{
    isPassPlay: boolean;
    turn: 1 | 2;
    p1Words: SubmittedWord[];
    p1Score: number;
  }>({
    isPassPlay: false,
    turn: 1,
    p1Words: [],
    p1Score: 0,
  });

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDictionaryModalOpen, setIsDictionaryModalOpen] = useState(false);

  // Check URL challenge on mount
  useEffect(() => {
    const challenge = decodeMatchChallenge();
    if (challenge && challenge.root) {
      const root = challenge.root.toUpperCase();
      const allValid = findAllValidAnagrams(root);
      const maxSc = allValid.reduce((sum, w) => sum + calculateWordScore(w), 0);

      setCurrentPuzzle({
        root,
        scrambled: root,
        allValidWords: allValid,
        maxScore: maxSc,
      });

      setOpponent({
        id: 'challenger',
        name: challenge.playerName || 'Challenger',
        avatarUrl: '#5865F2',
        avatarEmoji: '⚡',
        score: challenge.score,
        words: [], // hidden until round finishes
        isReady: false,
        statusText: `Challenged you to beat ${challenge.score.toLocaleString()} pts!`,
      });
    }
  }, []);

  // Save profile updates
  const handleSaveProfile = (updated: PlayerProfile) => {
    setProfile(updated);
    saveProfile(updated);
  };

  // Start a fresh Solo game
  const handleStartSolo = useCallback(() => {
    const puzzle = getRandomPuzzle(settings.wordLength);
    setCurrentPuzzle(puzzle);
    setPlayerWords([]);
    setPlayerScore(0);
    setOpponent(null);
    setPassPlayState({ isPassPlay: false, turn: 1, p1Words: [], p1Score: 0 });
    setGameState('playing');
  }, [settings.wordLength]);

  // Start match vs Discord Bot
  const handleStartBotMatch = useCallback((bot: BotPreset) => {
    const puzzle = getRandomPuzzle(settings.wordLength);
    setCurrentPuzzle(puzzle);
    setPlayerWords([]);
    setPlayerScore(0);
    setPassPlayState({ isPassPlay: false, turn: 1, p1Words: [], p1Score: 0 });

    const botWords = getBotFoundWords(bot, puzzle.allValidWords);
    const botScore = botWords.reduce((s, w) => s + w.score, 0);

    setOpponent({
      id: bot.id,
      name: bot.name,
      avatarUrl: bot.avatarBg,
      avatarEmoji: bot.avatar,
      score: botScore,
      words: botWords,
      isReady: false,
    });

    setGameState('playing');
  }, [settings.wordLength]);

  // Start 2-Player Pass & Play
  const handleStartPassPlay = useCallback(() => {
    const puzzle = getRandomPuzzle(settings.wordLength);
    setCurrentPuzzle(puzzle);
    setPlayerWords([]);
    setPlayerScore(0);
    setOpponent(null);
    setPassPlayState({
      isPassPlay: true,
      turn: 1,
      p1Words: [],
      p1Score: 0,
    });
    setGameState('playing');
  }, [settings.wordLength]);

  // Load a friend's challenge code
  const handleLoadChallenge = useCallback((input: string) => {
    try {
      let code = input.trim();
      if (code.includes('challenge=')) {
        const url = new URL(code);
        code = url.searchParams.get('challenge') || '';
      }
      const json = JSON.parse(atob(code));
      if (json.r) {
        const root = json.r.toUpperCase();
        const allValid = findAllValidAnagrams(root);
        const maxSc = allValid.reduce((sum, w) => sum + calculateWordScore(w), 0);

        setCurrentPuzzle({
          root,
          scrambled: root,
          allValidWords: allValid,
          maxScore: maxSc,
        });

        setOpponent({
          id: 'friend_challenge',
          name: json.p || 'Friend',
          avatarUrl: '#5865F2',
          avatarEmoji: '🎮',
          score: json.s || 0,
          words: [],
          isReady: false,
        });

        setPlayerWords([]);
        setPlayerScore(0);
        setGameState('playing');
      }
    } catch {
      alert('Invalid challenge code or URL');
    }
  }, []);

  // Round completed
  const handleRoundComplete = useCallback((words: SubmittedWord[], score: number) => {
    // Check if this was Pass & Play Turn 1
    if (passPlayState.isPassPlay && passPlayState.turn === 1) {
      setPassPlayState(prev => ({
        ...prev,
        turn: 2,
        p1Words: words,
        p1Score: score,
      }));
      setGameState('round_over'); // Will show transition screen for Player 2
      return;
    }

    if (passPlayState.isPassPlay && passPlayState.turn === 2) {
      // Player 2 finished; set Player 1 as opponent
      setPlayerWords(words);
      setPlayerScore(score);
      setOpponent({
        id: 'player1',
        name: 'Player 1',
        avatarUrl: '#5865F2',
        avatarEmoji: '👤',
        score: passPlayState.p1Score,
        words: passPlayState.p1Words,
        isReady: true,
      });
      setGameState('results');
      return;
    }

    // Standard solo or bot finish
    setPlayerWords(words);
    setPlayerScore(score);

    // Update player high score stats
    setProfile(prev => {
      const updated = {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        highestScore: Math.max(prev.highestScore, score),
        totalWordsFound: prev.totalWordsFound + words.length,
      };
      saveProfile(updated);
      return updated;
    });

    setGameState('results');
  }, [passPlayState]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#211b33]">
      {/* 1. Lobby View */}
      {gameState === 'lobby' && (
        <LobbyView
          playerProfile={profile}
          settings={settings}
          onStartSolo={handleStartSolo}
          onStartBotMatch={handleStartBotMatch}
          onStartPassPlay={handleStartPassPlay}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onUpdateSettings={setSettings}
          onLoadChallenge={handleLoadChallenge}
        />
      )}

      {/* 2. Active Game Board */}
      {gameState === 'playing' && currentPuzzle && (
        <GameBoard
          scrambledLetters={currentPuzzle.scrambled}
          playerProfile={profile}
          settings={settings}
          onRoundComplete={handleRoundComplete}
          onExitToLobby={() => setGameState('lobby')}
        />
      )}

      {/* 3. Pass & Play Intermission */}
      {gameState === 'round_over' && passPlayState.isPassPlay && passPlayState.turn === 2 && (
        <div className="w-full max-w-md mx-auto min-h-[70vh] flex flex-col items-center justify-center p-6 bg-diamond-pattern rounded-3xl shadow-2xl border-4 border-slate-700/60 text-center select-none">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl mb-4 animate-bounce">
            🤝
          </div>
          <h2 className="text-2xl font-black text-white">Pass the Screen!</h2>
          <p className="text-sm text-slate-300 mt-2 max-w-xs">
            Player 1 finished with <span className="text-amber-300 font-bold">{passPlayState.p1Score.toLocaleString()} pts</span>.
            <br />
            Hand over to <span className="text-emerald-300 font-bold">Player 2</span> for the same 60s scramble!
          </p>
          <button
            onClick={() => setGameState('playing')}
            className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg transition cursor-pointer"
          >
            START PLAYER 2 TURN
          </button>
        </div>
      )}

      {/* 4. Results View */}
      {gameState === 'results' && currentPuzzle && (
        <ResultsView
          playerProfile={profile}
          playerWords={playerWords}
          playerScore={playerScore}
          rootWord={currentPuzzle.root}
          opponent={opponent}
          onPlayAgain={handleStartSolo}
          onOpenDictionary={() => setIsDictionaryModalOpen(true)}
          onRevealOpponent={() => {
            if (opponent) {
              setOpponent(prev => prev ? { ...prev, isReady: true } : null);
            }
          }}
        />
      )}

      {/* Profile Modal */}
      <ProfileModal
        profile={profile}
        isOpen={isProfileModalOpen}
        onSave={handleSaveProfile}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Dictionary Modal */}
      {currentPuzzle && (
        <DictionaryModal
          rootWord={currentPuzzle.root}
          allValidWords={currentPuzzle.allValidWords}
          playerWords={playerWords}
          isOpen={isDictionaryModalOpen}
          onClose={() => setIsDictionaryModalOpen(false)}
        />
      )}
    </div>
  );
}

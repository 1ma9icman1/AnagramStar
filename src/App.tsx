import React, { useState, useEffect, useCallback } from 'react';
import { GameBoard } from './components/GameBoard';
import { ResultsView } from './components/ResultsView';
import { LobbyView } from './components/LobbyView';
import { ProfileModal } from './components/ProfileModal';
import { DictionaryModal } from './components/DictionaryModal';
import { DiscordInviteModal } from './components/DiscordInviteModal';
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
import { initDiscordSdk } from './utils/discordSdk';

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

  // Incoming Challenge detection from URL
  const [incomingChallenge, setIncomingChallenge] = useState<{
    challengerName: string;
    score: number;
    wordLength: number;
  } | null>(null);

  // 2-Player Pass & Play tracking
  const [passPlayState, setPassPlayState] = useState<{
    isPassPlay: boolean;
    turn: 1 | 2;
    p1Name: string;
    p2Name: string;
    p1Words: SubmittedWord[];
    p1Score: number;
  }>({
    isPassPlay: false,
    turn: 1,
    p1Name: 'Operator 1',
    p2Name: 'Operator 2',
    p1Words: [],
    p1Score: 0,
  });

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDictionaryModalOpen, setIsDictionaryModalOpen] = useState(false);
  const [isDiscordInviteModalOpen, setIsDiscordInviteModalOpen] = useState(false);

  // Check URL challenge & Initialize Discord SDK on mount
  useEffect(() => {
    initDiscordSdk().then((res) => {
      if (res.inDiscord && res.user) {
        setProfile((prev) => ({
          ...prev,
          name: prev.name === 'Neo' || prev.name === 'Player 1' ? res.user!.username : prev.name,
        }));
      }
    });

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

      setIncomingChallenge({
        challengerName: challenge.playerName || 'Discord Challenger',
        score: challenge.score,
        wordLength: root.length,
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
    setPassPlayState({
      isPassPlay: false,
      turn: 1,
      p1Name: profile.name,
      p2Name: 'Operator 2',
      p1Words: [],
      p1Score: 0,
    });
    setGameState('playing');
  }, [settings.wordLength, profile.name]);

  // Start match vs Discord Bot
  const handleStartBotMatch = useCallback((bot: BotPreset) => {
    const puzzle = getRandomPuzzle(settings.wordLength);
    setCurrentPuzzle(puzzle);
    setPlayerWords([]);
    setPlayerScore(0);
    setPassPlayState({
      isPassPlay: false,
      turn: 1,
      p1Name: profile.name,
      p2Name: bot.name,
      p1Words: [],
      p1Score: 0,
    });

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
  }, [settings.wordLength, profile.name]);

  // Start 2-Player Pass & Play
  const handleStartPassPlay = useCallback((p1?: string, p2?: string) => {
    const puzzle = getRandomPuzzle(settings.wordLength);
    const player1Name = (p1 && p1.trim()) || profile.name || 'Operator 1';
    const player2Name = (p2 && p2.trim()) || 'Operator 2';

    setCurrentPuzzle(puzzle);
    setPlayerWords([]);
    setPlayerScore(0);
    setOpponent(null);
    setPassPlayState({
      isPassPlay: true,
      turn: 1,
      p1Name: player1Name,
      p2Name: player2Name,
      p1Words: [],
      p1Score: 0,
    });
    setGameState('playing');
  }, [settings.wordLength, profile.name]);

  // Accept incoming challenge
  const handleAcceptIncomingChallenge = useCallback(() => {
    if (!currentPuzzle) return;
    setPlayerWords([]);
    setPlayerScore(0);
    setPassPlayState({
      isPassPlay: false,
      turn: 1,
      p1Name: profile.name,
      p2Name: opponent?.name || 'Challenger',
      p1Words: [],
      p1Score: 0,
    });
    setGameState('playing');
  }, [currentPuzzle, profile.name, opponent]);

  // Launch custom puzzle from Discord invite generator
  const handleStartWithCustomPuzzle = useCallback((puzzle: { root: string; scrambled: string; allValidWords: string[]; maxScore: number }) => {
    setCurrentPuzzle(puzzle);
    setPlayerWords([]);
    setPlayerScore(0);
    setOpponent(null);
    setPassPlayState({
      isPassPlay: false,
      turn: 1,
      p1Name: profile.name,
      p2Name: 'Challenger',
      p1Words: [],
      p1Score: 0,
    });
    setGameState('playing');
  }, [profile.name]);

  // Load a friend's challenge code
  const handleLoadChallenge = useCallback((input: string) => {
    const challenge = decodeMatchChallenge(input);
    if (challenge && challenge.root) {
      const root = challenge.root.toUpperCase();
      const allValid = findAllValidAnagrams(root);
      const maxSc = allValid.reduce((sum, w) => sum + calculateWordScore(w), 0);

      const puz = {
        root,
        scrambled: root,
        allValidWords: allValid,
        maxScore: maxSc,
      };

      setCurrentPuzzle(puz);
      setOpponent({
        id: 'friend_challenge',
        name: challenge.playerName || 'Discord Friend',
        avatarUrl: '#5865F2',
        avatarEmoji: '🎮',
        score: challenge.score,
        words: [],
        isReady: false,
        statusText: `Challenged you to beat ${challenge.score.toLocaleString()} pts!`,
      });

      setPlayerWords([]);
      setPlayerScore(0);
      setPassPlayState({
        isPassPlay: false,
        turn: 1,
        p1Name: profile.name,
        p2Name: challenge.playerName || 'Friend',
        p1Words: [],
        p1Score: 0,
      });
      setGameState('playing');
    } else {
      alert('Invalid challenge payload or link');
    }
  }, [profile.name]);

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
        name: passPlayState.p1Name || 'Operator 1',
        avatarUrl: '#052e16',
        avatarEmoji: '🕶️',
        score: passPlayState.p1Score,
        words: passPlayState.p1Words,
        isReady: true,
      });
      setGameState('results');
      return;
    }

    // Standard solo, bot, or friend finish
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
    <div className="min-h-screen w-full flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#020703] font-mono selection:bg-[#00ff66] selection:text-black">
      {/* 1. Lobby View */}
      {gameState === 'lobby' && (
        <LobbyView
          playerProfile={profile}
          settings={settings}
          incomingChallenge={incomingChallenge}
          onStartSolo={handleStartSolo}
          onStartBotMatch={handleStartBotMatch}
          onStartPassPlay={handleStartPassPlay}
          onOpenDiscordInvite={() => setIsDiscordInviteModalOpen(true)}
          onAcceptIncomingChallenge={handleAcceptIncomingChallenge}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onUpdateSettings={setSettings}
          onLoadChallenge={handleLoadChallenge}
        />
      )}

      {/* 2. Active Game Board */}
      {gameState === 'playing' && currentPuzzle && (
        <GameBoard
          key={passPlayState.isPassPlay ? `p${passPlayState.turn}-${currentPuzzle.root}` : `solo-${currentPuzzle.root}`}
          scrambledLetters={currentPuzzle.scrambled}
          playerProfile={
            passPlayState.isPassPlay
              ? {
                  ...profile,
                  name: passPlayState.turn === 1 ? passPlayState.p1Name : passPlayState.p2Name,
                  avatarEmoji: passPlayState.turn === 1 ? '🕶️' : '💻',
                }
              : profile
          }
          duelTurnInfo={
            passPlayState.isPassPlay
              ? {
                  currentTurn: passPlayState.turn,
                  operatorName: passPlayState.turn === 1 ? passPlayState.p1Name : passPlayState.p2Name,
                }
              : undefined
          }
          settings={settings}
          onRoundComplete={handleRoundComplete}
          onExitToLobby={() => setGameState('lobby')}
        />
      )}

      {/* 3. Pass & Play Intermission */}
      {gameState === 'round_over' && passPlayState.isPassPlay && passPlayState.turn === 2 && (
        <div className="w-full max-w-md mx-auto min-h-[70vh] flex flex-col items-center justify-center p-6 bg-matrix-pattern rounded-2xl shadow-[0_0_40px_rgba(0,255,102,0.25)] border-2 border-[#00ff66]/60 text-center select-none text-emerald-100">
          <div className="w-16 h-16 rounded-xl bg-black border-2 border-[#00ff66] shadow-[0_0_15px_#00ff66] flex items-center justify-center text-3xl mb-4 animate-bounce">
            ⚡
          </div>
          <h2 className="text-2xl font-['Orbitron',monospace] font-black text-[#00ff66]">TRANSFER TERMINAL</h2>
          <div className="my-3 p-3 bg-black/80 rounded-xl border border-[#00ff66]/40 text-xs font-mono text-emerald-300">
            <span className="text-[#00ffcc] font-black text-sm uppercase">{passPlayState.p1Name}</span> LOGGED{' '}
            <span className="text-[#00ff66] font-black text-sm">+{passPlayState.p1Score.toLocaleString()} BYTES</span> ({passPlayState.p1Words.length} WORDS).
          </div>
          <p className="text-xs text-emerald-400 max-w-xs font-mono mb-4">
            Pass the device to <span className="text-[#00ff66] font-black uppercase">{passPlayState.p2Name}</span>. Both operators get the exact same letters!
          </p>
          <button
            onClick={() => setGameState('playing')}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-[#00ff66] to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-['Orbitron',monospace] font-black text-sm uppercase tracking-wider shadow-[0_0_25px_#00ff66] border-2 border-white transition cursor-pointer"
          >
            START {passPlayState.p2Name.toUpperCase()}'S 60s RUN
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
          isPassPlay={passPlayState.isPassPlay}
          p1Name={passPlayState.p1Name}
          p2Name={passPlayState.p2Name}
          onPlayAgain={handleStartSolo}
          onRematchPassPlay={() => handleStartPassPlay(passPlayState.p1Name, passPlayState.p2Name)}
          onExitToLobby={() => setGameState('lobby')}
          onOpenDiscordInvite={() => setIsDiscordInviteModalOpen(true)}
          onOpenDictionary={() => setIsDictionaryModalOpen(true)}
          onRevealOpponent={() => {
            if (opponent) {
              setOpponent(prev => (prev ? { ...prev, isReady: true } : null));
            }
          }}
        />
      )}

      {/* Discord Invite Modal */}
      <DiscordInviteModal
        isOpen={isDiscordInviteModalOpen}
        onClose={() => setIsDiscordInviteModalOpen(false)}
        playerProfile={profile}
        defaultWordLength={settings.wordLength}
        initialRootWord={currentPuzzle?.root}
        onStartWithPuzzle={handleStartWithCustomPuzzle}
      />

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


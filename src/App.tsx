import React, { useState, useEffect, useCallback } from 'react';
import { GameBoyConsole, LcdPalette } from './components/GameBoyConsole';
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
import { sound } from './utils/sound';

export default function App() {
  // LCD Palette selection ('dmg', 'pocket', 'light', 'gbc')
  const [currentPalette, setCurrentPalette] = useState<LcdPalette>('dmg');

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
    p1Name: 'PLAYER 1',
    p2Name: 'PLAYER 2',
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
        challengerName: challenge.playerName || 'Discord Rival',
        score: challenge.score,
        wordLength: root.length,
      });

      setOpponent({
        id: 'challenger',
        name: challenge.playerName || 'Challenger',
        avatarUrl: '#0f380f',
        avatarEmoji: '⚡',
        score: challenge.score,
        words: [],
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
      p2Name: 'PLAYER 2',
      p1Words: [],
      p1Score: 0,
    });
    setGameState('playing');
  }, [settings.wordLength, profile.name]);

  // Start match vs AI Bot
  const handleStartBotMatch = useCallback(
    (bot: BotPreset) => {
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
    },
    [settings.wordLength, profile.name]
  );

  // Start 2-Player Pass & Play
  const handleStartPassPlay = useCallback(
    (p1?: string, p2?: string) => {
      const puzzle = getRandomPuzzle(settings.wordLength);
      const player1Name = (p1 && p1.trim()) || profile.name || 'PLAYER 1';
      const player2Name = (p2 && p2.trim()) || 'PLAYER 2';

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
    },
    [settings.wordLength, profile.name]
  );

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
  const handleStartWithCustomPuzzle = useCallback(
    (puzzle: { root: string; scrambled: string; allValidWords: string[]; maxScore: number }) => {
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
    },
    [profile.name]
  );

  // Load a friend's challenge code
  const handleLoadChallenge = useCallback(
    (input: string) => {
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
          avatarUrl: '#0f380f',
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
        sound.playInvalidWord();
      }
    },
    [profile.name]
  );

  // Round completed
  const handleRoundComplete = useCallback(
    (words: SubmittedWord[], score: number) => {
      if (passPlayState.isPassPlay && passPlayState.turn === 1) {
        setPassPlayState((prev) => ({
          ...prev,
          turn: 2,
          p1Words: words,
          p1Score: score,
        }));
        setGameState('round_over');
        return;
      }

      if (passPlayState.isPassPlay && passPlayState.turn === 2) {
        setPlayerWords(words);
        setPlayerScore(score);
        setOpponent({
          id: 'player1',
          name: passPlayState.p1Name || 'PLAYER 1',
          avatarUrl: '#0f380f',
          avatarEmoji: '🎮',
          score: passPlayState.p1Score,
          words: passPlayState.p1Words,
          isReady: true,
        });
        setGameState('results');
        return;
      }

      setPlayerWords(words);
      setPlayerScore(score);

      setProfile((prev) => {
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
    },
    [passPlayState]
  );

  // Physical Game Boy Button Action handlers
  const handleConsoleAPress = () => {
    if (gameState === 'lobby') {
      handleStartSolo();
    } else if (gameState === 'round_over') {
      setGameState('playing');
    } else if (gameState === 'results') {
      if (passPlayState.isPassPlay) {
        handleStartPassPlay(passPlayState.p1Name, passPlayState.p2Name);
      } else {
        handleStartSolo();
      }
    }
  };

  const handleConsoleBPress = () => {
    if (gameState === 'playing' || gameState === 'results' || gameState === 'round_over') {
      setGameState('lobby');
    }
  };

  const handleConsoleStartPress = () => {
    if (gameState === 'lobby') {
      handleStartSolo();
    } else if (gameState === 'round_over') {
      setGameState('playing');
    } else if (gameState === 'results') {
      handleStartSolo();
    }
  };

  return (
    <GameBoyConsole
      currentPalette={currentPalette}
      onPaletteChange={setCurrentPalette}
      onAPress={handleConsoleAPress}
      onBPress={handleConsoleBPress}
      onStartPress={handleConsoleStartPress}
    >
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
                  avatarEmoji: passPlayState.turn === 1 ? '🎮' : '👾',
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
        <div className="w-full h-full flex flex-col justify-between p-3 select-none text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace] text-center">
          <div className="text-[8px] font-bold border-b-2 border-[var(--lcd-darkest,#0f380f)] pb-1">
            PLAYER HANDOFF
          </div>

          <div className="my-auto flex flex-col items-center gap-2">
            <div className="w-10 h-10 border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] flex items-center justify-center text-xl animate-bounce">
              🎮
            </div>
            <div className="text-[8px] leading-relaxed">
              <span className="font-bold">{passPlayState.p1Name}</span> SCORED:
              <div className="text-sm font-black my-1">{passPlayState.p1Score} PTS</div>
              ({passPlayState.p1Words.length} WORDS)
            </div>
            <div className="text-[7px] text-[var(--lcd-dark,#306230)] px-2">
              PASS CONSOLE TO <span className="font-bold text-[var(--lcd-darkest,#0f380f)]">{passPlayState.p2Name}</span>!
            </div>
          </div>

          <button
            type="button"
            onClick={() => setGameState('playing')}
            className="w-full py-2.5 border-2 border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] font-bold text-[8px] shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)] cursor-pointer active:scale-95"
          >
            ► START {passPlayState.p2Name}'S TURN
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
              setOpponent((prev) => (prev ? { ...prev, isReady: true } : null));
            }
          }}
        />
      )}

      {/* Modals */}
      <DiscordInviteModal
        isOpen={isDiscordInviteModalOpen}
        onClose={() => setIsDiscordInviteModalOpen(false)}
        playerProfile={profile}
        defaultWordLength={settings.wordLength}
        initialRootWord={currentPuzzle?.root}
        onStartWithPuzzle={handleStartWithCustomPuzzle}
      />

      <ProfileModal
        profile={profile}
        isOpen={isProfileModalOpen}
        onSave={handleSaveProfile}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {currentPuzzle && (
        <DictionaryModal
          rootWord={currentPuzzle.root}
          allValidWords={currentPuzzle.allValidWords}
          playerWords={playerWords}
          isOpen={isDictionaryModalOpen}
          onClose={() => setIsDictionaryModalOpen(false)}
        />
      )}
    </GameBoyConsole>
  );
}

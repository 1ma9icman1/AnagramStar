import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameBoyConsole, LcdPalette } from './components/GameBoyConsole';
import { CyberConsole } from './components/CyberConsole';
import { NokiaConsole } from './components/NokiaConsole';
import { SkinSelectModal } from './components/SkinSelectModal';
import { GameBoard, GameBoardHandle } from './components/GameBoard';
import { ResultsView, ResultsViewHandle } from './components/ResultsView';
import { LobbyView, LobbyViewHandle } from './components/LobbyView';
import { ProfileModal } from './components/ProfileModal';
import { DictionaryModal } from './components/DictionaryModal';
import { DiscordInviteModal } from './components/DiscordInviteModal';
import { SecretMenuModal } from './components/SecretMenuModal';
import {
  GameState,
  SubmittedWord,
  PlayerProfile,
  GameSettings,
  Opponent,
  AppSkin,
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
  // Active Skin Selection ('gameboy' | 'nokia' | 'cyber')
  const [currentSkin, setCurrentSkin] = useState<AppSkin>(() => {
    const saved = localStorage.getItem('anagram_skin_preference');
    return (saved === 'gameboy' || saved === 'nokia' || saved === 'cyber') ? saved : 'gameboy';
  });

  // Always show Skin Selection GUI on start / launch
  const [isSkinModalOpen, setIsSkinModalOpen] = useState<boolean>(true);

  // LCD Palette selection for Game Boy ('dmg', 'pocket', 'light', 'gbc')
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

  // Component references for console physical button dispatch
  const gameBoardRef = useRef<GameBoardHandle>(null);
  const lobbyViewRef = useRef<LobbyViewHandle>(null);
  const resultsViewRef = useRef<ResultsViewHandle>(null);

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
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [isMa9icUnlocked, setIsMa9icUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('anagram_ma9ic_unlocked') === 'true';
  });

  // Hacker Green / Ma9ic Unlock Handler
  const handleUnlockMa9ic = useCallback(() => {
    setIsMa9icUnlocked(true);
    localStorage.setItem('anagram_ma9ic_unlocked', 'true');
    setCurrentSkin('cyber');
    localStorage.setItem('anagram_skin_preference', 'cyber');

    setProfile((prev) => {
      const updated: PlayerProfile = {
        ...prev,
        name: prev.name === 'PLAYER 1' || prev.name === 'Neo' ? 'MA9IC HACKER' : prev.name,
        avatarEmoji: '🧙‍♂️',
        highestScore: Math.max(prev.highestScore, 999999),
        totalWordsFound: Math.max(prev.totalWordsFound, 9999),
        gamesPlayed: Math.max(prev.gamesPlayed, 1337),
      };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const handleSwitchToHackerGreen = useCallback(() => {
    setCurrentSkin('cyber');
    localStorage.setItem('anagram_skin_preference', 'cyber');
  }, []);


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

  // Secret Key Sequence Listener ("ma9ic" or "`")
  useEffect(() => {
    let keyBuffer = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in an input or textarea, don't hijack unless it's the tilde key
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        setIsSecretModalOpen(true);
        return;
      }

      if (isInput) return;

      keyBuffer += e.key.toLowerCase();
      if (keyBuffer.length > 10) {
        keyBuffer = keyBuffer.slice(-10);
      }

      if (keyBuffer.endsWith('ma9ic')) {
        keyBuffer = '';
        handleUnlockMa9ic();
        setIsSecretModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUnlockMa9ic]);

  // Skin selection confirmed
  const handleSelectSkin = (skin: AppSkin, remember: boolean) => {
    setCurrentSkin(skin);
    if (remember) {
      localStorage.setItem('anagram_skin_preference', skin);
    } else {
      localStorage.removeItem('anagram_skin_preference');
    }
    setIsSkinModalOpen(false);
  };

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
    if (gameState === 'playing') {
      gameBoardRef.current?.handleAPress();
    } else if (gameState === 'lobby') {
      if (lobbyViewRef.current) {
        lobbyViewRef.current.handleAPress();
      } else {
        handleStartSolo();
      }
    } else if (gameState === 'round_over') {
      setGameState('playing');
    } else if (gameState === 'results') {
      if (resultsViewRef.current) {
        resultsViewRef.current.handleAPress();
      } else if (passPlayState.isPassPlay) {
        handleStartPassPlay(passPlayState.p1Name, passPlayState.p2Name);
      } else {
        handleStartSolo();
      }
    }
  };

  const handleConsoleBPress = () => {
    if (gameState === 'playing') {
      gameBoardRef.current?.handleBPress();
    } else if (gameState === 'lobby') {
      lobbyViewRef.current?.handleBPress();
    } else if (gameState === 'round_over') {
      setGameState('lobby');
    } else if (gameState === 'results') {
      if (resultsViewRef.current) {
        resultsViewRef.current.handleBPress();
      } else {
        setGameState('lobby');
      }
    }
  };

  const handleConsoleSelectPress = () => {
    if (gameState === 'playing') {
      gameBoardRef.current?.handleSelectPress();
    } else if (gameState === 'lobby') {
      lobbyViewRef.current?.handleSelectPress();
    } else if (gameState === 'results') {
      if (resultsViewRef.current) {
        resultsViewRef.current.handleSelectPress();
      } else {
        setIsDictionaryModalOpen(true);
      }
    }
  };

  const handleConsoleStartPress = () => {
    if (gameState === 'playing') {
      gameBoardRef.current?.handleStartPress();
    } else if (gameState === 'lobby') {
      if (lobbyViewRef.current) {
        lobbyViewRef.current.handleStartPress();
      } else {
        handleStartSolo();
      }
    } else if (gameState === 'round_over') {
      setGameState('playing');
    } else if (gameState === 'results') {
      if (resultsViewRef.current) {
        resultsViewRef.current.handleStartPress();
      } else if (passPlayState.isPassPlay) {
        handleStartPassPlay(passPlayState.p1Name, passPlayState.p2Name);
      } else {
        handleStartSolo();
      }
    }
  };

  const handleConsoleDpadPress = (dir: 'up' | 'down' | 'left' | 'right') => {
    if (gameState === 'playing') {
      gameBoardRef.current?.handleDpadPress(dir);
    } else if (gameState === 'lobby') {
      lobbyViewRef.current?.handleDpadPress(dir);
    } else if (gameState === 'results') {
      resultsViewRef.current?.handleDpadPress(dir);
    }
  };

  const handleConsoleKeypadDigit = (digit: string) => {
    if (gameState === 'playing') {
      gameBoardRef.current?.handleKeypadDigit?.(digit);
    }
  };

  // Shared Inner View Content
  const renderInnerContent = () => (
    <>
      {/* 1. Lobby View */}
      {gameState === 'lobby' && (
        <LobbyView
          ref={lobbyViewRef}
          playerProfile={profile}
          settings={settings}
          incomingChallenge={incomingChallenge}
          onStartSolo={handleStartSolo}
          onStartBotMatch={handleStartBotMatch}
          onStartPassPlay={handleStartPassPlay}
          onOpenDiscordInvite={() => setIsDiscordInviteModalOpen(true)}
          onAcceptIncomingChallenge={handleAcceptIncomingChallenge}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenSecretMenu={() => setIsSecretModalOpen(true)}
          isMa9icUnlocked={isMa9icUnlocked}
          onUpdateSettings={setSettings}
          onLoadChallenge={handleLoadChallenge}
          skin={currentSkin}
        />
      )}

      {/* 2. Active Game Board */}
      {gameState === 'playing' && currentPuzzle && (
        <GameBoard
          ref={gameBoardRef}
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
          skin={currentSkin}
        />
      )}

      {/* 3. Pass & Play Intermission */}
      {gameState === 'round_over' && passPlayState.isPassPlay && passPlayState.turn === 2 && (
        <div
          className={`w-full h-full flex flex-col justify-between p-3 select-none text-center ${
            currentSkin === 'cyber'
              ? 'text-emerald-100 font-mono'
              : "text-[var(--lcd-darkest,#0f380f)] font-['Press_Start_2P',monospace]"
          }`}
        >
          <div
            className={`text-[8px] font-bold border-b-2 pb-1 ${
              currentSkin === 'cyber' ? 'border-emerald-500/40 text-emerald-400' : 'border-[var(--lcd-darkest,#0f380f)]'
            }`}
          >
            PLAYER HANDOFF MATRIX
          </div>

          <div className="my-auto flex flex-col items-center gap-2">
            <div
              className={`w-12 h-12 border-2 flex items-center justify-center text-2xl animate-bounce rounded ${
                currentSkin === 'cyber'
                  ? 'border-emerald-400 bg-emerald-950/60 shadow-[0_0_12px_#00ff66]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)]'
              }`}
            >
              🎮
            </div>
            <div className="text-[8px] leading-relaxed">
              <span className="font-bold">{passPlayState.p1Name}</span> SCORED:
              <div className={`text-base font-black my-1 ${currentSkin === 'cyber' ? 'text-[#00ff66]' : ''}`}>
                {passPlayState.p1Score} PTS
              </div>
              ({passPlayState.p1Words.length} WORDS)
            </div>
            <div
              className={`text-[7px] px-2 ${
                currentSkin === 'cyber' ? 'text-emerald-400/80' : 'text-[var(--lcd-dark,#306230)]'
              }`}
            >
              PASS DEVICE TO <span className="font-bold">{passPlayState.p2Name}</span>!
            </div>
          </div>

          <button
            type="button"
            onClick={() => setGameState('playing')}
            className={`w-full py-2.5 border-2 font-bold text-[8px] cursor-pointer active:scale-95 transition-all rounded ${
              currentSkin === 'cyber'
                ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_15px_#00ff66] hover:bg-[#33ff88]'
                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)]'
            }`}
          >
            ► START {passPlayState.p2Name}'S TURN
          </button>
        </div>
      )}

      {/* 4. Results View */}
      {gameState === 'results' && currentPuzzle && (
        <ResultsView
          ref={resultsViewRef}
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
          skin={currentSkin}
        />
      )}
    </>
  );

  return (
    <>
      {/* Skin Selection Modal on Load or Trigger */}
      <SkinSelectModal
        isOpen={isSkinModalOpen}
        currentSkin={currentSkin}
        onSelectSkin={handleSelectSkin}
        onClose={() => setIsSkinModalOpen(false)}
        canClose={true}
      />

      {/* Primary Layout Wrapper depending on skin */}
      {currentSkin === 'gameboy' ? (
        <GameBoyConsole
          currentPalette={currentPalette}
          onPaletteChange={setCurrentPalette}
          onAPress={handleConsoleAPress}
          onBPress={handleConsoleBPress}
          onSelectPress={handleConsoleSelectPress}
          onStartPress={handleConsoleStartPress}
          onDpadPress={handleConsoleDpadPress}
          onOpenSkinSelect={() => setIsSkinModalOpen(true)}
        >
          {renderInnerContent()}
        </GameBoyConsole>
      ) : currentSkin === 'nokia' ? (
        <NokiaConsole
          onAPress={handleConsoleAPress}
          onBPress={handleConsoleBPress}
          onSelectPress={handleConsoleSelectPress}
          onStartPress={handleConsoleStartPress}
          onDpadPress={handleConsoleDpadPress}
          onKeypadDigit={handleConsoleKeypadDigit}
          onOpenSkinSelect={() => setIsSkinModalOpen(true)}
          isSoundEnabled={settings.soundEnabled}
        >
          {renderInnerContent()}
        </NokiaConsole>
      ) : (
        <CyberConsole onOpenSkinSelect={() => setIsSkinModalOpen(true)}>
          {renderInnerContent()}
        </CyberConsole>
      )}

      {/* Common Modals */}
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
        isUnlocked={isMa9icUnlocked}
      />

      <SecretMenuModal
        isOpen={isSecretModalOpen}
        onClose={() => setIsSecretModalOpen(false)}
        isUnlocked={isMa9icUnlocked}
        onUnlockMa9ic={handleUnlockMa9ic}
        onSwitchToHackerGreen={handleSwitchToHackerGreen}
        playerProfile={profile}
        onUpdateProfile={handleSaveProfile}
        currentSkin={currentSkin}
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
    </>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { PlayerProfile, GameSettings, AppSkin } from '../types/game';
import { RoomState, RoomPlayer } from '../types/multiplayer';
import { multiplayerClient } from '../utils/multiplayerClient';
import { sound } from '../utils/sound';
import { openDiscordInviteDialog } from '../utils/discord';

interface TwoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerProfile: PlayerProfile;
  settings: GameSettings;
  skin?: AppSkin;
  onStartPassPlay: (p1Name: string, p2Name: string) => void;
  onStartOnlineMatch?: (puzzle: any, roundDuration: number, startedAt: number) => void;
  initialRoomCode?: string | null;
}

export const TwoPlayerModal: React.FC<TwoPlayerModalProps> = ({
  isOpen,
  onClose,
  playerProfile,
  settings,
  skin = 'gameboy',
  onStartPassPlay,
  onStartOnlineMatch,
  initialRoomCode,
}) => {
  const isCyber = skin === 'cyber';
  const isNormal = skin === 'normal';

  const [activeTab, setActiveTab] = useState<'online' | 'pass_play'>('online');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [p1Callsign, setP1Callsign] = useState(playerProfile.name || 'PLAYER 1');
  const [p2Callsign, setP2Callsign] = useState('PLAYER 2');

  const [roomState, setRoomState] = useState<RoomState | null>(() => multiplayerClient.getCurrentRoom());
  const [myPlayer, setMyPlayer] = useState<RoomPlayer | null>(() => multiplayerClient.getCurrentPlayer());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [countdownNum, setCountdownNum] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Sync profile callsign
  useEffect(() => {
    if (playerProfile.name) {
      setP1Callsign(playerProfile.name);
    }
  }, [playerProfile.name]);

  // Subscribe to multiplayer events
  useEffect(() => {
    const unsubscribe = multiplayerClient.addListener({
      onRoomState: (room, you) => {
        setRoomState(room);
        if (you) setMyPlayer(you);
        setIsConnecting(false);
      },
      onRoomCreated: (room, you) => {
        setRoomState(room);
        setMyPlayer(you);
        setIsConnecting(false);
        sound.playSuccessBeep();
      },
      onRoomError: (msg) => {
        setErrorMessage(msg);
        setIsConnecting(false);
        sound.playInvalidWord();
      },
      onCountdownTick: (count) => {
        setCountdownNum(count);
        sound.playCountdownBeep(count === 1);
      },
      onGameStart: (puzzle, duration, startedAt) => {
        setCountdownNum(null);
        sound.playCountdownBeep(true);
        onClose();
        onStartOnlineMatch?.(puzzle, duration, startedAt);
      },
      onPlayerLeft: (name) => {
        setErrorMessage(`${name} left the room.`);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [onClose, onStartOnlineMatch]);

  // Auto-join if initialRoomCode provided
  useEffect(() => {
    if (isOpen && initialRoomCode && initialRoomCode.trim()) {
      setActiveTab('online');
      setJoinCodeInput(initialRoomCode.trim().toUpperCase());
      setIsConnecting(true);
      multiplayerClient.joinRoom(initialRoomCode.trim().toUpperCase(), playerProfile);
    }
  }, [isOpen, initialRoomCode, playerProfile]);

  if (!isOpen) return null;

  const isHost = myPlayer?.isHost ?? false;
  const players = roomState?.players || [];
  const opponent = players.find((p) => p.id !== myPlayer?.id);

  const handleCreateRoom = () => {
    sound.playButtonClick();
    setErrorMessage(null);
    setIsConnecting(true);
    multiplayerClient.createRoom(playerProfile, settings);
  };

  const handleJoinRoom = () => {
    if (!joinCodeInput.trim()) {
      sound.playInvalidWord();
      setErrorMessage('Please enter a room code.');
      return;
    }
    sound.playButtonClick();
    setErrorMessage(null);
    setIsConnecting(true);
    multiplayerClient.joinRoom(joinCodeInput.trim().toUpperCase(), playerProfile);
  };

  const handleToggleReady = () => {
    sound.playButtonClick();
    multiplayerClient.toggleReady();
  };

  const handleStartDuel = () => {
    sound.playButtonClick();
    multiplayerClient.startGame();
  };

  const handleLeaveRoom = () => {
    sound.playButtonClick();
    multiplayerClient.leaveRoom();
    setRoomState(null);
    setMyPlayer(null);
    setErrorMessage(null);
    setCountdownNum(null);
  };

  const handleCopyCode = () => {
    if (!roomState?.code) return;
    sound.playTileClick();
    navigator.clipboard.writeText(roomState.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!roomState?.code) return;
    sound.playTileClick();
    const url = `${window.location.origin}${window.location.pathname}?duel=${roomState.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDiscordInvite = () => {
    if (!roomState?.code) return;
    sound.playTileClick();
    const url = `${window.location.origin}${window.location.pathname}?duel=${roomState.code}`;
    openDiscordInviteDialog(
      `⚔️ 1v1 Anagrams Duel! Join Room [${roomState.code}] to play head-to-head in real time!`,
      url
    );
  };

  const handleUpdateDuration = (duration: number) => {
    if (!isHost || !roomState) return;
    sound.playTileClick();
    multiplayerClient.updateSettings({ ...roomState.settings, roundDuration: duration });
  };

  const handleUpdateWordLength = (len: 6 | 7) => {
    if (!isHost || !roomState) return;
    sound.playTileClick();
    multiplayerClient.updateSettings({ ...roomState.settings, wordLength: len });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs font-mono">
      {/* Synchronized Countdown Overlay */}
      {countdownNum !== null && (
        <div className="absolute inset-0 z-60 flex flex-col items-center justify-center bg-black/90 text-center animate-in fade-in zoom-in">
          <div className="text-sm sm:text-base font-bold tracking-widest text-emerald-400 mb-3 animate-pulse">
            GET READY FOR DUEL!
          </div>
          <div
            className={`text-6xl sm:text-8xl font-black font-['Press_Start_2P',monospace] ${
              countdownNum === 1 ? 'text-rose-400 scale-110' : 'text-amber-300'
            } transition-all duration-300`}
          >
            {countdownNum}
          </div>
          <div className="text-[9px] sm:text-[11px] text-slate-300 mt-4 tracking-wider">
            SYNCHRONIZING SCRAMBLED LETTERS...
          </div>
        </div>
      )}

      <div
        className={`w-full max-w-md border-2 p-3 sm:p-4 flex flex-col gap-3 rounded-lg shadow-2xl relative ${
          isNormal
            ? 'border-indigo-600 bg-slate-900 text-slate-100'
            : isCyber
            ? 'border-emerald-500 bg-black text-emerald-300 shadow-[0_0_24px_rgba(0,255,102,0.25)]'
            : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] text-[var(--lcd-darkest,#0f380f)] shadow-[4px_4px_0_var(--lcd-darkest,#0f380f)]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b pb-2 ${
            isNormal
              ? 'border-slate-700'
              : isCyber
              ? 'border-emerald-500/40'
              : 'border-[var(--lcd-darkest,#0f380f)]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg">⚔️</span>
            <div>
              <div className="font-bold text-[10px] sm:text-xs tracking-wider">
                {roomState ? `DUEL ROOM [${roomState.code}]` : '2-PLAYER DUEL SYSTEM'}
              </div>
              <div className="text-[7px] sm:text-[8px] opacity-75">
                {roomState ? 'REAL-TIME LIVE OPPONENT LOBBY' : 'PLAY LIVE ONLINE OR SAME DEVICE'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-2 py-0.5 border font-bold text-[8px] sm:text-[9px] cursor-pointer active:scale-95 rounded ${
              isNormal
                ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                : isCyber
                ? 'border-emerald-800 hover:bg-emerald-950 text-emerald-400'
                : 'border-[var(--lcd-darkest,#0f380f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher (Only when NOT in an active room) */}
        {!roomState && (
          <div className="grid grid-cols-2 gap-1 text-[8px] sm:text-[9px] font-bold">
            <button
              type="button"
              onClick={() => {
                sound.playTileClick();
                setActiveTab('online');
                setErrorMessage(null);
              }}
              className={`py-1.5 border text-center cursor-pointer rounded-xs transition-all ${
                activeTab === 'online'
                  ? isNormal
                    ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                    : isCyber
                    ? 'border-emerald-400 bg-emerald-950 text-white shadow-[0_0_8px_rgba(0,255,102,0.3)]'
                    : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                  : isNormal
                  ? 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                  : isCyber
                  ? 'border-emerald-950 bg-black/40 text-emerald-600'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              🌐 ONLINE 1V1 (LINK CABLE)
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playTileClick();
                setActiveTab('pass_play');
                setErrorMessage(null);
              }}
              className={`py-1.5 border text-center cursor-pointer rounded-xs transition-all ${
                activeTab === 'pass_play'
                  ? isNormal
                    ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                    : isCyber
                    ? 'border-emerald-400 bg-emerald-950 text-white shadow-[0_0_8px_rgba(0,255,102,0.3)]'
                    : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                  : isNormal
                  ? 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                  : isCyber
                  ? 'border-emerald-950 bg-black/40 text-emerald-600'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              📱 PASS & PLAY (1 DEVICE)
            </button>
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div
            className={`p-1.5 border text-[7px] sm:text-[8px] flex items-center justify-between rounded ${
              isNormal
                ? 'border-rose-800 bg-rose-950/70 text-rose-200'
                : isCyber
                ? 'border-rose-600 bg-rose-950/60 text-rose-300'
                : 'border-[var(--lcd-darkest,#0f380f)] bg-red-100 text-red-900'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-[8px] hover:font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: ACTIVE ROOM LOBBY */}
        {/* ========================================================= */}
        {roomState ? (
          <div className="flex flex-col gap-2.5 text-[8px] sm:text-[9px]">
            {/* Room Code & Invite Share Bar */}
            <div
              className={`p-2 border rounded-lg flex flex-col gap-2 ${
                isNormal
                  ? 'border-indigo-700/60 bg-slate-950/80 text-slate-200'
                  : isCyber
                  ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold">ROOM CODE:</span>
                  <span
                    className={`font-black px-2 py-0.5 border text-[10px] sm:text-xs rounded ${
                      isNormal
                        ? 'border-amber-500/80 bg-amber-500/20 text-amber-200'
                        : isCyber
                        ? 'border-emerald-400 bg-emerald-900/60 text-emerald-200'
                        : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] text-[var(--lcd-darkest,#0f380f)]'
                    }`}
                  >
                    {roomState.code}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className={`px-2 py-1 border text-[7px] sm:text-[8px] font-bold cursor-pointer active:scale-95 rounded ${
                      copiedCode
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : isNormal
                        ? 'border-slate-700 bg-slate-800 hover:bg-slate-700'
                        : isCyber
                        ? 'border-emerald-700 bg-emerald-950 hover:bg-emerald-900'
                        : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                    }`}
                  >
                    {copiedCode ? '✓ COPIED' : '📋 CODE'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-2 py-1 border text-[7px] sm:text-[8px] font-bold cursor-pointer active:scale-95 rounded ${
                      copiedLink
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : isNormal
                        ? 'border-indigo-600 bg-indigo-700/80 hover:bg-indigo-600 text-white'
                        : isCyber
                        ? 'border-emerald-500 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200'
                        : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                    }`}
                  >
                    {copiedLink ? '✓ LINK COPIED' : '🔗 INVITE LINK'}
                  </button>
                </div>
              </div>

              {/* Discord Button inside room */}
              <button
                type="button"
                onClick={handleDiscordInvite}
                className={`w-full py-1.5 border font-bold text-[7px] sm:text-[8px] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 rounded ${
                  isNormal
                    ? 'border-indigo-500/60 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white hover:brightness-110'
                    : isCyber
                    ? 'border-emerald-600 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60'
                    : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] hover:bg-[var(--lcd-dark,#306230)] hover:text-[var(--lcd-bg-light,#9bbc0f)]'
                }`}
              >
                <span>✉</span>
                <span>SEND DISCORD 1V1 INVITE</span>
              </button>
            </div>

            {/* Two Player Pods */}
            <div className="grid grid-cols-2 gap-2">
              {/* Host Pod */}
              <div
                className={`p-2 border rounded-lg flex flex-col items-center text-center gap-1 ${
                  isNormal
                    ? 'border-slate-700 bg-slate-900/90'
                    : isCyber
                    ? 'border-emerald-800 bg-emerald-950/50'
                    : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
                }`}
              >
                <div className="text-[6px] sm:text-[7px] font-bold opacity-75">👑 HOST</div>
                <div className="text-xl sm:text-2xl">{players[0]?.avatarEmoji || '🎮'}</div>
                <div className="font-bold text-[8px] sm:text-[9px] truncate max-w-full">
                  {players[0]?.name || 'Host'}
                </div>
                <div
                  className={`text-[6px] sm:text-[7px] px-1.5 py-0.5 border rounded-full font-bold ${
                    isNormal
                      ? 'border-emerald-600 bg-emerald-950 text-emerald-300'
                      : isCyber
                      ? 'border-emerald-400 bg-emerald-900 text-emerald-200'
                      : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                  }`}
                >
                  ✓ HOST READY
                </div>
              </div>

              {/* Opponent Pod */}
              <div
                className={`p-2 border rounded-lg flex flex-col items-center text-center gap-1 ${
                  opponent
                    ? isNormal
                      ? 'border-slate-700 bg-slate-900/90'
                      : isCyber
                      ? 'border-emerald-800 bg-emerald-950/50'
                      : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
                    : isNormal
                    ? 'border-dashed border-slate-700 bg-slate-950/40 opacity-90'
                    : isCyber
                    ? 'border-dashed border-emerald-900 bg-black/40'
                    : 'border-dashed border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] opacity-85'
                }`}
              >
                <div className="text-[6px] sm:text-[7px] font-bold opacity-75">⚔️ CHALLENGER</div>
                {opponent ? (
                  <>
                    <div className="text-xl sm:text-2xl">{opponent.avatarEmoji || '🕹️'}</div>
                    <div className="font-bold text-[8px] sm:text-[9px] truncate max-w-full">
                      {opponent.name}
                    </div>
                    <div
                      className={`text-[6px] sm:text-[7px] px-1.5 py-0.5 border rounded-full font-bold ${
                        opponent.isReady
                          ? 'border-emerald-500 bg-emerald-900 text-emerald-200'
                          : 'border-amber-600 bg-amber-950 text-amber-300'
                      }`}
                    >
                      {opponent.isReady ? '✓ READY' : '⏳ PREPARING...'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl animate-pulse">⌛</div>
                    <div className="font-bold text-[7px] sm:text-[8px] text-amber-300 animate-pulse">
                      WAITING FOR FRIEND...
                    </div>
                    <div className="text-[6px] opacity-75">Share room code or invite link</div>
                  </>
                )}
              </div>
            </div>

            {/* Match Settings Panel */}
            <div
              className={`p-2 border rounded-lg flex flex-col gap-1.5 ${
                isNormal
                  ? 'border-slate-800 bg-slate-950/80 text-slate-300'
                  : isCyber
                  ? 'border-emerald-900 bg-black/60 text-emerald-400'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              <div className="flex items-center justify-between text-[7px]">
                <span className="font-bold">MATCH SETTINGS {isHost ? '(YOU ARE HOST)' : '(HOST CONTROLLED)'}</span>
                <span>{roomState.settings.wordLength} LETTERS • {roomState.settings.roundDuration > 0 ? `${roomState.settings.roundDuration}s` : 'ZEN'}</span>
              </div>

              {isHost && (
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <div>
                    <div className="text-[6px] opacity-75 mb-0.5">ROUND DURATION:</div>
                    <div className="grid grid-cols-4 gap-0.5">
                      {[30, 45, 60, 0].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleUpdateDuration(d)}
                          className={`py-0.5 border text-[6px] sm:text-[7px] font-bold rounded-xs ${
                            roomState.settings.roundDuration === d
                              ? isCyber
                                ? 'border-[#00ff66] bg-[#00ff66] text-black'
                                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                              : 'border-slate-700 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {d === 0 ? 'ZEN' : `${d}s`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[6px] opacity-75 mb-0.5">LETTER COUNT:</div>
                    <div className="grid grid-cols-2 gap-0.5">
                      {[6, 7].map((len) => (
                        <button
                          key={len}
                          type="button"
                          onClick={() => handleUpdateWordLength(len as 6 | 7)}
                          className={`py-0.5 border text-[6px] sm:text-[7px] font-bold rounded-xs ${
                            roomState.settings.wordLength === len
                              ? isCyber
                                ? 'border-[#00ff66] bg-[#00ff66] text-black'
                                : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                              : 'border-slate-700 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {len} LETTERS
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Duel Actions */}
            <div className="flex flex-col gap-1.5 pt-1">
              {isHost ? (
                <button
                  type="button"
                  onClick={handleStartDuel}
                  className={`w-full py-2.5 border-2 font-bold text-[9px] sm:text-[10px] cursor-pointer active:scale-95 transition-all rounded-lg ${
                    isNormal
                      ? 'border-amber-500 bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-md font-extrabold'
                      : isCyber
                      ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_16px_#00ff66] hover:bg-[#33ff88]'
                      : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)]'
                  }`}
                >
                  ► {opponent ? 'START 1V1 DUEL NOW' : 'START SOLO DUEL (WAITING FRIEND CAN JOIN)'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleReady}
                  className={`w-full py-2 border font-bold text-[8px] sm:text-[9px] cursor-pointer active:scale-95 transition-all rounded ${
                    myPlayer?.isReady
                      ? 'border-emerald-600 bg-emerald-800 text-white'
                      : isNormal
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : isCyber
                      ? 'border-emerald-500 bg-emerald-950 text-emerald-300'
                      : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                  }`}
                >
                  {myPlayer?.isReady ? '✓ YOU ARE READY (WAITING FOR HOST)' : '► CLICK WHEN READY'}
                </button>
              )}

              <button
                type="button"
                onClick={handleLeaveRoom}
                className={`w-full py-1.5 border font-bold text-[7px] sm:text-[8px] cursor-pointer opacity-80 hover:opacity-100 rounded ${
                  isNormal
                    ? 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                    : isCyber
                    ? 'border-rose-900 text-rose-400 hover:bg-rose-950/40'
                    : 'border-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-darkest,#0f380f)]'
                }`}
              >
                LEAVE ROOM & RETURN
              </button>
            </div>
          </div>
        ) : activeTab === 'online' ? (
          /* ========================================================= */
          /* VIEW 2: ONLINE 1V1 HUB (CREATE OR JOIN ROOM) */
          /* ========================================================= */
          <div className="flex flex-col gap-3 text-[8px] sm:text-[9px]">
            {/* Create Room Box */}
            <div
              className={`p-3 border rounded-lg flex flex-col gap-2 ${
                isNormal
                  ? 'border-indigo-600/70 bg-gradient-to-br from-indigo-950/60 to-slate-900 text-slate-100'
                  : isCyber
                  ? 'border-emerald-600 bg-emerald-950/40 text-emerald-300'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-[9px] sm:text-[10px] flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>CREATE A NEW DUEL ROOM</span>
                </div>
                <span className="text-[7px] opacity-75">HOST A MATCH</span>
              </div>
              <div className="text-[7px] sm:text-[8px] opacity-85 leading-relaxed">
                Generate a live room code. Friends can connect via link or code to play the same scrambled anagrams simultaneously!
              </div>

              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={isConnecting}
                className={`w-full py-2 sm:py-2.5 border-2 font-bold text-[8px] sm:text-[9px] cursor-pointer active:scale-95 transition-all rounded-lg ${
                  isNormal
                    ? 'border-indigo-500 bg-indigo-600 text-white hover:bg-indigo-500 shadow-md font-extrabold'
                    : isCyber
                    ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_12px_#00ff66] hover:bg-[#33ff88]'
                    : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)] shadow-[2px_2px_0_var(--lcd-darkest,#0f380f)]'
                }`}
              >
                {isConnecting ? 'CONNECTING TO SERVER...' : '► CREATE DUEL ROOM & GET CODE'}
              </button>
            </div>

            {/* Join Room Box */}
            <div
              className={`p-3 border rounded-lg flex flex-col gap-2 ${
                isNormal
                  ? 'border-amber-700/60 bg-slate-900/80 text-slate-200'
                  : isCyber
                  ? 'border-emerald-800 bg-black/60 text-emerald-300'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              <div className="font-bold text-[9px] sm:text-[10px] flex items-center gap-1.5">
                <span>🔗</span>
                <span>JOIN A FRIEND&apos;S ROOM</span>
              </div>
              <div className="text-[7px] sm:text-[8px] opacity-85">
                Enter the 5-character room code given by your friend:
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  maxLength={6}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. DUEL7"
                  className={`flex-1 px-2 py-1.5 border text-[10px] sm:text-xs font-bold uppercase tracking-widest outline-none rounded ${
                    isNormal
                      ? 'border-slate-700 bg-slate-950 text-amber-200 placeholder:text-slate-600'
                      : isCyber
                      ? 'border-emerald-600 bg-black text-emerald-200 placeholder:text-emerald-800'
                      : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)] text-[var(--lcd-darkest,#0f380f)]'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoinRoom();
                  }}
                />
                <button
                  type="button"
                  onClick={handleJoinRoom}
                  disabled={isConnecting}
                  className={`px-4 py-1.5 font-bold text-[8px] sm:text-[9px] cursor-pointer active:scale-95 transition-all rounded ${
                    isNormal
                      ? 'bg-amber-500 text-amber-950 hover:bg-amber-400 font-extrabold'
                      : isCyber
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
                  }`}
                >
                  JOIN ROOM
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 3: PASS & PLAY (SAME DEVICE) */
          /* ========================================================= */
          <div className="flex flex-col gap-2.5 text-[8px] sm:text-[9px]">
            <div
              className={`p-2.5 border rounded-lg text-[7px] sm:text-[8px] leading-relaxed ${
                isNormal
                  ? 'border-slate-800 bg-slate-950/80 text-slate-300'
                  : isCyber
                  ? 'border-emerald-900 bg-emerald-950/40 text-emerald-300'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              Take turns on the same device! Player 1 completes their round, hands off the device with a secret screen, and Player 2 attempts the exact same letters!
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[7px] font-bold mb-1">PLAYER 1 CALLSIGN:</div>
                <input
                  type="text"
                  maxLength={12}
                  value={p1Callsign}
                  onChange={(e) => setP1Callsign(e.target.value)}
                  className={`w-full px-2 py-1 border text-[8px] outline-none rounded ${
                    isNormal
                      ? 'border-slate-700 bg-slate-950 text-slate-200'
                      : isCyber
                      ? 'border-emerald-700 bg-black text-emerald-200'
                      : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)]'
                  }`}
                />
              </div>

              <div>
                <div className="text-[7px] font-bold mb-1">PLAYER 2 CALLSIGN:</div>
                <input
                  type="text"
                  maxLength={12}
                  value={p2Callsign}
                  onChange={(e) => setP2Callsign(e.target.value)}
                  className={`w-full px-2 py-1 border text-[8px] outline-none rounded ${
                    isNormal
                      ? 'border-slate-700 bg-slate-950 text-slate-200'
                      : isCyber
                      ? 'border-emerald-700 bg-black text-emerald-200'
                      : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-bg,#8bac0f)]'
                  }`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playButtonClick();
                onClose();
                onStartPassPlay(p1Callsign, p2Callsign);
              }}
              className={`w-full py-2.5 border-2 font-bold text-[9px] mt-2 cursor-pointer active:scale-95 transition-all rounded-lg ${
                isNormal
                  ? 'border-indigo-500 bg-indigo-600 text-white hover:bg-indigo-500 shadow-md font-extrabold'
                  : isCyber
                  ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_12px_#00ff66] hover:bg-[#33ff88]'
                  : 'border-[var(--lcd-darkest,#0f380f)] bg-[var(--lcd-darkest,#0f380f)] text-[var(--lcd-bg-light,#9bbc0f)]'
              }`}
            >
              ► START LOCAL PASS & PLAY DUEL
            </button>
          </div>
        )}

        {/* Footer info */}
        <div
          className={`pt-1.5 border-t flex items-center justify-between text-[7px] opacity-75 ${
            isNormal ? 'border-slate-800' : isCyber ? 'border-emerald-900' : 'border-[var(--lcd-darkest,#0f380f)]'
          }`}
        >
          <span>NETWORK: {roomState ? 'LINK CABLE ONLINE' : 'READY'}</span>
          <span>ANAGRAMS 1V1 ENGINE</span>
        </div>
      </div>
    </div>
  );
};

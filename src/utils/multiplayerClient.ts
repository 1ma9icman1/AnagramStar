import { GameSettings, PlayerProfile, SubmittedWord } from '../types/game';
import { RoomState, RoomPlayer, OpponentLiveUpdate } from '../types/multiplayer';

export type MultiplayerConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MultiplayerEvents {
  onRoomState?: (room: RoomState, you?: RoomPlayer) => void;
  onRoomCreated?: (room: RoomState, you: RoomPlayer) => void;
  onRoomError?: (message: string) => void;
  onCountdownTick?: (countdown: number, puzzle?: any) => void;
  onGameStart?: (puzzle: any, roundDuration: number, startedAt: number) => void;
  onOpponentWord?: (update: OpponentLiveUpdate) => void;
  onMatchResults?: (room: RoomState, winnerId: string | null) => void;
  onPlayerLeft?: (playerName: string, room: RoomState) => void;
  onConnectionChange?: (status: MultiplayerConnectionStatus) => void;
}

class MultiplayerClient {
  private ws: WebSocket | null = null;
  private listeners: Set<MultiplayerEvents> = new Set();
  private connectionStatus: MultiplayerConnectionStatus = 'disconnected';
  private currentRoom: RoomState | null = null;
  private currentPlayer: RoomPlayer | null = null;
  private pendingPayload: any = null;
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;

  constructor() {
    // Lazy connect when room operations are requested
  }

  public addListener(listener: MultiplayerEvents) {
    this.listeners.add(listener);
    if (this.currentRoom) {
      listener.onRoomState?.(this.currentRoom, this.currentPlayer || undefined);
    }
    listener.onConnectionChange?.(this.connectionStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(callback: (l: MultiplayerEvents) => void) {
    for (const l of this.listeners) {
      try {
        callback(l);
      } catch (err) {
        console.error('Multiplayer listener error:', err);
      }
    }
  }

  private setStatus(status: MultiplayerConnectionStatus) {
    this.connectionStatus = status;
    this.notify((l) => l.onConnectionChange?.(status));
  }

  public connect(): Promise<WebSocket> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve(this.ws);
    }

    this.setStatus('connecting');

    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}`;

        const socket = new WebSocket(wsUrl);
        this.ws = socket;

        socket.onopen = () => {
          this.setStatus('connected');
          this.reconnectAttempts = 0;
          if (this.pendingPayload) {
            this.sendRaw(this.pendingPayload);
            this.pendingPayload = null;
          }
          resolve(socket);
        };

        socket.onclose = () => {
          this.setStatus('disconnected');
          this.ws = null;
        };

        socket.onerror = (err) => {
          console.warn('Multiplayer WebSocket error:', err);
          this.setStatus('error');
          this.notify((l) => l.onRoomError?.('Unable to connect to game server.'));
          reject(err);
        };

        socket.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (err) {
        this.setStatus('error');
        reject(err);
      }
    });
  }

  private sendRaw(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.pendingPayload = data;
      this.connect();
    }
  }

  private handleMessage(data: string) {
    try {
      const parsed = JSON.parse(data);
      const { type, payload } = parsed;

      switch (type) {
        case 'ROOM_CREATED': {
          this.currentRoom = payload.room;
          this.currentPlayer = payload.you;
          this.notify((l) => l.onRoomCreated?.(payload.room, payload.you));
          this.notify((l) => l.onRoomState?.(payload.room, payload.you));
          break;
        }

        case 'ROOM_STATE': {
          this.currentRoom = payload.room;
          if (this.currentPlayer && payload.room?.players) {
            const updatedMe = payload.room.players.find((p: RoomPlayer) => p.id === this.currentPlayer?.id);
            if (updatedMe) this.currentPlayer = updatedMe;
          }
          this.notify((l) => l.onRoomState?.(payload.room, this.currentPlayer || undefined));
          break;
        }

        case 'ROOM_ERROR': {
          this.notify((l) => l.onRoomError?.(payload.message || 'Room error occurred.'));
          break;
        }

        case 'START_COUNTDOWN': {
          this.notify((l) => l.onCountdownTick?.(payload.countdown, payload.puzzle));
          if (payload.room) {
            this.currentRoom = payload.room;
            this.notify((l) => l.onRoomState?.(payload.room, this.currentPlayer || undefined));
          }
          break;
        }

        case 'COUNTDOWN_TICK': {
          this.notify((l) => l.onCountdownTick?.(payload.countdown));
          break;
        }

        case 'GAME_START': {
          if (payload.room) this.currentRoom = payload.room;
          this.notify((l) => l.onGameStart?.(payload.puzzle, payload.roundDuration, payload.startedAt));
          break;
        }

        case 'OPPONENT_WORD': {
          this.notify((l) => l.onOpponentWord?.(payload));
          break;
        }

        case 'MATCH_RESULTS': {
          if (payload.room) this.currentRoom = payload.room;
          this.notify((l) => l.onMatchResults?.(payload.room, payload.winnerId));
          break;
        }

        case 'PLAYER_LEFT': {
          if (payload.room) this.currentRoom = payload.room;
          this.notify((l) => l.onPlayerLeft?.(payload.playerName, payload.room));
          break;
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  }

  // --- Public Room Actions ---

  public createRoom(player: PlayerProfile, settings: GameSettings) {
    this.sendRaw({
      type: 'CREATE_ROOM',
      payload: {
        player: {
          id: `player_${player.name}_${Math.random().toString(36).substring(2, 6)}`,
          name: player.name,
          avatarEmoji: player.avatarEmoji,
          avatarColor: player.avatarColor,
          avatarUrl: player.customAvatarUrl,
        },
        settings,
      },
    });
  }

  public joinRoom(roomCode: string, player: PlayerProfile) {
    this.sendRaw({
      type: 'JOIN_ROOM',
      payload: {
        roomCode: roomCode.trim().toUpperCase(),
        player: {
          id: `player_${player.name}_${Math.random().toString(36).substring(2, 6)}`,
          name: player.name,
          avatarEmoji: player.avatarEmoji,
          avatarColor: player.avatarColor,
          avatarUrl: player.customAvatarUrl,
        },
      },
    });
  }

  public updateSettings(settings: GameSettings) {
    this.sendRaw({
      type: 'UPDATE_SETTINGS',
      payload: { settings },
    });
  }

  public toggleReady(isReady?: boolean) {
    this.sendRaw({
      type: 'TOGGLE_READY',
      payload: { isReady },
    });
  }

  public startGame(puzzle?: any) {
    this.sendRaw({
      type: 'START_GAME',
      payload: { puzzle },
    });
  }

  public submitWord(word: string, score: number, length: number) {
    this.sendRaw({
      type: 'SUBMIT_WORD',
      payload: { word, score, length },
    });
  }

  public finishGame(score: number, words: SubmittedWord[]) {
    this.sendRaw({
      type: 'PLAYER_FINISH',
      payload: { score, words },
    });
  }

  public requestRematch() {
    this.sendRaw({
      type: 'REMATCH_REQUEST',
      payload: {},
    });
  }

  public leaveRoom() {
    this.sendRaw({
      type: 'LEAVE_ROOM',
      payload: {},
    });
    this.currentRoom = null;
    this.currentPlayer = null;
  }

  public getCurrentRoom(): RoomState | null {
    return this.currentRoom;
  }

  public getCurrentPlayer(): RoomPlayer | null {
    return this.currentPlayer;
  }
}

export const multiplayerClient = new MultiplayerClient();

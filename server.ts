import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { InteractionType, InteractionResponseType, verifyKey } from "discord-interactions";

// Puzzle roots for server-side generation
const PUZZLE_ROOTS_6 = [
  "SPRAWL", "PLANET", "STREAM", "CASTLE", "FLOWER", "GARDEN", "SILVER", "FROZEN",
  "BASKET", "YELLOW", "TRAVEL", "WONDER", "BRIDGE", "MONKEY", "ROCKET", "KNIGHT",
  "DRAGON", "SPRING", "FOREST", "WINTER", "SUMMER", "GOLDEN", "BRIGHT", "SHADOW",
  "NATURE", "SPIRIT", "MASTER", "HEROIC", "PRINCE", "FRIEND", "FAMILY", "SIMPLE",
  "PERSON", "SYSTEM", "ACTIVE", "ACTION", "BEAUTY", "CAMERA", "CHARGE", "CIRCLE",
  "COFFEE", "DANGER", "DESERT", "DOCTOR", "DOLLAR", "ENERGY", "ENGINE", "FARMER",
  "FINGER", "FUTURE", "GUITAR", "HAMMER", "HEALTH", "HUNTER", "ISLAND", "JACKET",
  "JUNGLE", "LEADER", "MARKET", "MEMORY", "MINUTE", "MIRROR", "MOTION", "MUSEUM",
  "NATION", "NOTICE", "NUMBER", "OBJECT", "ORANGE", "PALACE", "PENCIL", "PIRATE",
  "POCKET", "PRISON", "RABBIT", "RECORD", "RIVER", "SAILOR", "SAMPLE", "SCHOOL",
  "SEASON", "SECRET", "SHIELD", "SIGNAL", "SISTER", "SOCKET", "SPIDER", "SQUARE",
  "STATUE", "STRIPE", "STUDIO", "SUNSET", "TARGET", "TEMPLE", "TICKET", "TIMBER",
  "TUNNEL", "VALLEY", "VESSEL", "VICTIM", "VOICE", "VOLUME", "WEAPON", "WINDOW",
  "WIZARD", "WRITER"
];

const PUZZLE_ROOTS_7 = [
  "MONSTER", "DIAMOND", "JOURNEY", "DOLPHIN", "CRYSTAL", "MYSTERY", "FEATHER",
  "CAPTAIN", "FORTUNE", "WEATHER", "THUNDER", "MORNING", "KITCHEN", "VILLAGE",
  "BLANKET", "CHAMBER", "HOLIDAY", "LANTERN", "COMPASS", "EXPLORE", "FANTASY",
  "GLACIER", "HORIZON", "ISLANDS", "JOURNAL", "KINGDOM", "MAJESTY", "NETWORK",
  "OCTOPUS", "PACKAGE", "QUARTER", "RAINBOW", "SCARLET", "TORNADO", "UNICORN",
  "VICTORY", "WARRIOR", "PYRAMID", "SPECIAL", "STATION", "STUDENT", "SURFACE"
];

function shuffleString(str: string): string {
  const arr = str.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join("");
  return result === str && str.length > 2 ? shuffleString(str) : result;
}

function generateServerPuzzle(length: 6 | 7 = 6) {
  const roots = length === 7 ? PUZZLE_ROOTS_7 : PUZZLE_ROOTS_6;
  const root = roots[Math.floor(Math.random() * roots.length)] || "PLANET";
  const scrambled = shuffleString(root);
  return {
    root,
    scrambled,
    allValidWords: [root],
    maxScore: 3000,
  };
}

interface PlayerSession {
  id: string;
  name: string;
  avatarEmoji: string;
  avatarColor: string;
  avatarUrl?: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  wordCount: number;
  latestWord?: string;
  latestWordScore?: number;
  words: Array<{ word: string; score: number; length: number; timestamp: number }>;
  isFinished: boolean;
  ws?: WebSocket;
}

interface GameRoom {
  code: string;
  hostId: string;
  status: 'waiting' | 'starting' | 'playing' | 'results';
  players: Map<string, PlayerSession>;
  settings: {
    roundDuration: number;
    wordLength: 6 | 7;
    soundEnabled: boolean;
    hapticFeedback: boolean;
    vibration: boolean;
  };
  puzzle: {
    root: string;
    scrambled: string;
    allValidWords: string[];
    maxScore: number;
  } | null;
  countdown: number;
  startedAt: number | null;
  winnerId: string | null;
  createdAt: number;
  countdownTimer?: NodeJS.Timeout;
}

const rooms = new Map<string, GameRoom>();

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function serializeRoom(room: GameRoom) {
  const playersList = Array.from(room.players.values()).map((p) => ({
    id: p.id,
    name: p.name,
    avatarEmoji: p.avatarEmoji,
    avatarColor: p.avatarColor,
    avatarUrl: p.avatarUrl,
    isHost: p.isHost,
    isReady: p.isReady,
    score: p.score,
    wordCount: p.wordCount,
    latestWord: p.latestWord,
    latestWordScore: p.latestWordScore,
    words: p.words,
    isFinished: p.isFinished,
  }));

  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    players: playersList,
    settings: room.settings,
    puzzle: room.puzzle,
    countdown: room.countdown,
    startedAt: room.startedAt,
    winnerId: room.winnerId,
  };
}

function broadcastToRoom(room: GameRoom, message: any, excludeWs?: WebSocket) {
  const data = JSON.stringify(message);
  for (const player of room.players.values()) {
    if (player.ws && player.ws !== excludeWs && player.ws.readyState === WebSocket.OPEN) {
      try {
        player.ws.send(data);
      } catch (err) {
        console.error("Error broadcasting to player:", err);
      }
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  // Use raw buffer for signature verification on Discord interactions
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  // Discord Interactions Endpoint (Slash commands & Discord Portal Verification)
  const handleDiscordInteraction = (req: express.Request, res: express.Response) => {
    const signature = req.get("X-Signature-Ed25519");
    const timestamp = req.get("X-Signature-Timestamp");
    const rawBody = (req as any).rawBody;
    const publicKey = process.env.DISCORD_PUBLIC_KEY;

    if (publicKey && signature && timestamp && rawBody) {
      try {
        const isValid = verifyKey(rawBody, signature, timestamp, publicKey);
        if (!isValid) {
          return res.status(401).send("Invalid request signature");
        }
      } catch (err) {
        console.error("Signature verification error:", err);
        return res.status(401).send("Invalid signature format");
      }
    }

    const { type, data } = req.body || {};

    if (type === InteractionType.PING || type === 1) {
      return res.json({ type: InteractionResponseType.PONG || 1 });
    }

    if (type === InteractionType.APPLICATION_COMMAND || type === 2) {
      const appUrl =
        process.env.APP_URL ||
        "https://ais-pre-743f4as74hyk23maxj7kvp-327004239589.us-west2.run.app";

      return res.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE || 4,
        data: {
          content: `🔤 **Anagrams Activity**\nClick below to launch and play Anagrams with your server!\n${appUrl}`,
        },
      });
    }

    return res.json({ type: InteractionResponseType.PONG || 1 });
  };

  app.post("/api/interactions", handleDiscordInteraction);
  app.post("/", handleDiscordInteraction);

  // API Health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "anagrams-discord-activity", activeRooms: rooms.size });
  });

  // REST Multiplayer endpoints for room lookup & creation
  app.post("/api/multiplayer/create", (req, res) => {
    const { player, settings } = req.body || {};
    const code = generateRoomCode();
    const newRoom: GameRoom = {
      code,
      hostId: player?.name || "Host",
      status: "waiting",
      players: new Map(),
      settings: {
        roundDuration: settings?.roundDuration ?? 60,
        wordLength: settings?.wordLength ?? 6,
        soundEnabled: true,
        hapticFeedback: true,
        vibration: true,
      },
      puzzle: null,
      countdown: 3,
      startedAt: null,
      winnerId: null,
      createdAt: Date.now(),
    };
    rooms.set(code, newRoom);
    res.json({ success: true, code, room: serializeRoom(newRoom) });
  });

  app.get("/api/multiplayer/room/:code", (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }
    return res.json({ success: true, room: serializeRoom(room) });
  });

  // High Scores Store
  let highScoresStore: any[] = [
    {
      id: "score-initial-1",
      playerName: "ma9ic",
      avatarEmoji: "🧙‍♂️",
      score: 3400,
      wordCount: 18,
      rootWord: "PLANET",
      bestWord: "PLANET",
      timestamp: Date.now() - 3600000 * 2,
      source: "discord",
    },
    {
      id: "score-initial-2",
      playerName: "Trinity",
      avatarEmoji: "🕶️",
      score: 2800,
      wordCount: 14,
      rootWord: "STREAM",
      bestWord: "MASTER",
      timestamp: Date.now() - 3600000 * 6,
      source: "web",
    },
    {
      id: "score-initial-3",
      playerName: "Cipher",
      avatarEmoji: "💻",
      score: 2200,
      wordCount: 11,
      rootWord: "CASTLE",
      bestWord: "CASTLE",
      timestamp: Date.now() - 3600000 * 12,
      source: "discord",
    },
    {
      id: "score-initial-4",
      playerName: "RetroGamer",
      avatarEmoji: "👾",
      score: 1600,
      wordCount: 8,
      rootWord: "WASPRL",
      bestWord: "SPRAWL",
      timestamp: Date.now() - 3600000 * 24,
      source: "web",
    },
  ];

  // Daily Challenge Leaderboard Store
  const dailyLeaderboardStore: Record<string, any[]> = {};

  const getTodayKey = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getOrCreateDailyLeaderboard = (dateKey: string) => {
    if (!dailyLeaderboardStore[dateKey]) {
      dailyLeaderboardStore[dateKey] = [
        {
          id: `daily-${dateKey}-1`,
          playerName: "ma9ic",
          avatarEmoji: "🧙‍♂️",
          score: 3200,
          wordCount: 16,
          rootWord: "PLANET",
          bestWord: "PLANET",
          timestamp: Date.now() - 3600000 * 1.5,
          source: "discord",
          dateKey,
        },
        {
          id: `daily-${dateKey}-2`,
          playerName: "Nova",
          avatarEmoji: "✨",
          score: 2600,
          wordCount: 13,
          rootWord: "PLANET",
          bestWord: "PLANET",
          timestamp: Date.now() - 3600000 * 4,
          source: "web",
          dateKey,
        },
        {
          id: `daily-${dateKey}-3`,
          playerName: "Echo",
          avatarEmoji: "🛰️",
          score: 1900,
          wordCount: 10,
          rootWord: "PLANET",
          bestWord: "PLANT",
          timestamp: Date.now() - 3600000 * 7,
          source: "discord",
          dateKey,
        },
        {
          id: `daily-${dateKey}-4`,
          playerName: "PixelFox",
          avatarEmoji: "🦊",
          score: 1400,
          wordCount: 7,
          rootWord: "PLANET",
          bestWord: "LANE",
          timestamp: Date.now() - 3600000 * 9,
          source: "web",
          dateKey,
        },
      ];
    }
    return dailyLeaderboardStore[dateKey];
  };

  app.get("/api/daily-leaderboard", (req, res) => {
    const dateKey = typeof req.query.date === "string" && req.query.date.trim() ? req.query.date.trim() : getTodayKey();
    const board = getOrCreateDailyLeaderboard(dateKey);
    res.json({
      success: true,
      dateKey,
      leaderboard: board.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp).slice(0, 50),
    });
  });

  app.post("/api/daily-leaderboard", (req, res) => {
    try {
      const { dateKey, playerName, avatarEmoji, score, wordCount, rootWord, bestWord, source, avatarUrl } = req.body || {};
      const targetDate = typeof dateKey === "string" && dateKey.trim() ? dateKey.trim() : getTodayKey();

      if (typeof score !== "number" || score <= 0) {
        return res.status(400).json({ error: "Invalid score value" });
      }

      const board = getOrCreateDailyLeaderboard(targetDate);

      const newEntry = {
        id: `daily-score-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        playerName: (typeof playerName === "string" && playerName.trim()) ? playerName.trim().substring(0, 24) : "Player",
        avatarEmoji: avatarEmoji || "🎮",
        avatarUrl: avatarUrl || undefined,
        score: Math.min(Math.max(score, 0), 999999),
        wordCount: typeof wordCount === "number" ? wordCount : 0,
        rootWord: typeof rootWord === "string" ? rootWord.toUpperCase() : "PLANET",
        bestWord: typeof bestWord === "string" ? bestWord.toUpperCase() : "",
        timestamp: Date.now(),
        source: source === "discord" ? "discord" : "web",
        dateKey: targetDate,
      };

      const filtered = board.filter(
        (e) => !(e.playerName.toLowerCase() === newEntry.playerName.toLowerCase() && e.source === newEntry.source)
      );
      filtered.push(newEntry);
      filtered.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);

      dailyLeaderboardStore[targetDate] = filtered.slice(0, 100);

      return res.json({
        success: true,
        entry: newEntry,
        leaderboard: dailyLeaderboardStore[targetDate].slice(0, 50),
      });
    } catch (err: any) {
      console.error("Error saving daily high score:", err);
      return res.status(500).json({ error: "Failed to store daily score" });
    }
  });

  app.get("/api/highscores", (_req, res) => {
    res.json({
      success: true,
      highScores: highScoresStore.sort((a, b) => b.score - a.score).slice(0, 50),
    });
  });

  app.post("/api/highscores", (req, res) => {
    try {
      const { playerName, avatarEmoji, score, wordCount, rootWord, bestWord, source, avatarUrl } = req.body || {};
      if (typeof score !== "number" || score <= 0) {
        return res.status(400).json({ error: "Invalid score value" });
      }

      const newEntry = {
        id: `score-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        playerName: (typeof playerName === "string" && playerName.trim()) ? playerName.trim().substring(0, 24) : "Player",
        avatarEmoji: avatarEmoji || "🎮",
        avatarUrl: avatarUrl || undefined,
        score: Math.min(Math.max(score, 0), 999999),
        wordCount: typeof wordCount === "number" ? wordCount : 0,
        rootWord: typeof rootWord === "string" ? rootWord.toUpperCase() : "WASPRL",
        bestWord: typeof bestWord === "string" ? bestWord.toUpperCase() : "",
        timestamp: Date.now(),
        source: source === "discord" ? "discord" : "web",
      };

      highScoresStore.push(newEntry);
      highScoresStore.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
      if (highScoresStore.length > 100) {
        highScoresStore = highScoresStore.slice(0, 100);
      }

      return res.json({
        success: true,
        entry: newEntry,
        highScores: highScoresStore.slice(0, 50),
      });
    } catch (err: any) {
      console.error("Error saving high score:", err);
      return res.status(500).json({ error: "Failed to store high score" });
    }
  });

  // Setup WebSocket Server for Real-Time 2-Player Duels
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket & { roomCode?: string; playerId?: string }) => {
    ws.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        const { type, payload } = message;

        // 1. CREATE ROOM
        if (type === "CREATE_ROOM") {
          const { player, settings } = payload || {};
          const code = generateRoomCode();
          const playerId = player?.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;

          const newPlayer: PlayerSession = {
            id: playerId,
            name: (player?.name || "Player 1").trim().substring(0, 14),
            avatarEmoji: player?.avatarEmoji || "🎮",
            avatarColor: player?.avatarColor || "#0f380f",
            avatarUrl: player?.avatarUrl,
            isHost: true,
            isReady: true,
            score: 0,
            wordCount: 0,
            words: [],
            isFinished: false,
            ws,
          };

          const newRoom: GameRoom = {
            code,
            hostId: playerId,
            status: "waiting",
            players: new Map([[playerId, newPlayer]]),
            settings: {
              roundDuration: settings?.roundDuration ?? 60,
              wordLength: settings?.wordLength ?? 6,
              soundEnabled: true,
              hapticFeedback: true,
              vibration: true,
            },
            puzzle: null,
            countdown: 3,
            startedAt: null,
            winnerId: null,
            createdAt: Date.now(),
          };

          rooms.set(code, newRoom);
          ws.roomCode = code;
          ws.playerId = playerId;

          ws.send(
            JSON.stringify({
              type: "ROOM_CREATED",
              payload: {
                room: serializeRoom(newRoom),
                you: newPlayer,
              },
            })
          );
          return;
        }

        // 2. JOIN ROOM
        if (type === "JOIN_ROOM") {
          const { roomCode, player } = payload || {};
          const code = (roomCode || "").toUpperCase().trim();
          const room = rooms.get(code);

          if (!room) {
            ws.send(JSON.stringify({ type: "ROOM_ERROR", payload: { message: "Room not found. Check the code." } }));
            return;
          }

          if (room.players.size >= 2 && !room.players.has(player?.id)) {
            ws.send(JSON.stringify({ type: "ROOM_ERROR", payload: { message: "Room is full (2/2 players)." } }));
            return;
          }

          if (room.status === "playing" && !room.players.has(player?.id)) {
            ws.send(JSON.stringify({ type: "ROOM_ERROR", payload: { message: "Match already in progress." } }));
            return;
          }

          const playerId = player?.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
          const isHost = room.players.size === 0;

          const joinedPlayer: PlayerSession = {
            id: playerId,
            name: (player?.name || "Player 2").trim().substring(0, 14),
            avatarEmoji: player?.avatarEmoji || "🕹️",
            avatarColor: player?.avatarColor || "#306230",
            avatarUrl: player?.avatarUrl,
            isHost,
            isReady: false,
            score: 0,
            wordCount: 0,
            words: [],
            isFinished: false,
            ws,
          };

          room.players.set(playerId, joinedPlayer);
          ws.roomCode = code;
          ws.playerId = playerId;

          // Broadcast to all
          broadcastToRoom(room, {
            type: "ROOM_STATE",
            payload: {
              room: serializeRoom(room),
            },
          });
          return;
        }

        // Retrieve existing room for subsequent room actions
        const room = ws.roomCode ? rooms.get(ws.roomCode) : null;
        if (!room || !ws.playerId) return;
        const player = room.players.get(ws.playerId);
        if (!player) return;

        // 3. UPDATE SETTINGS (Host only)
        if (type === "UPDATE_SETTINGS") {
          if (player.isHost && payload?.settings) {
            room.settings = {
              ...room.settings,
              roundDuration: payload.settings.roundDuration ?? room.settings.roundDuration,
              wordLength: payload.settings.wordLength ?? room.settings.wordLength,
            };
            broadcastToRoom(room, {
              type: "ROOM_STATE",
              payload: { room: serializeRoom(room) },
            });
          }
          return;
        }

        // 4. TOGGLE READY
        if (type === "TOGGLE_READY") {
          player.isReady = payload?.isReady !== undefined ? payload.isReady : !player.isReady;
          broadcastToRoom(room, {
            type: "ROOM_STATE",
            payload: { room: serializeRoom(room) },
          });
          return;
        }

        // 5. START GAME (Host or both ready)
        if (type === "START_GAME") {
          if (!player.isHost && room.players.size > 1) {
            return;
          }

          // Generate or use puzzle
          const puzzle = payload?.puzzle || generateServerPuzzle(room.settings.wordLength);
          room.puzzle = puzzle;
          room.status = "starting";
          room.countdown = 3;
          room.winnerId = null;

          // Reset player match data
          for (const p of room.players.values()) {
            p.score = 0;
            p.wordCount = 0;
            p.words = [];
            p.latestWord = undefined;
            p.latestWordScore = undefined;
            p.isFinished = false;
          }

          broadcastToRoom(room, {
            type: "START_COUNTDOWN",
            payload: {
              countdown: 3,
              puzzle,
              room: serializeRoom(room),
            },
          });

          // Countdown sequence
          if (room.countdownTimer) clearInterval(room.countdownTimer);
          let count = 3;
          room.countdownTimer = setInterval(() => {
            count--;
            room.countdown = count;
            if (count > 0) {
              broadcastToRoom(room, {
                type: "COUNTDOWN_TICK",
                payload: { countdown: count },
              });
            } else {
              clearInterval(room.countdownTimer);
              room.status = "playing";
              room.startedAt = Date.now();

              broadcastToRoom(room, {
                type: "GAME_START",
                payload: {
                  puzzle: room.puzzle,
                  roundDuration: room.settings.roundDuration,
                  startedAt: room.startedAt,
                  room: serializeRoom(room),
                },
              });
            }
          }, 1000);
          return;
        }

        // 6. SUBMIT WORD (Live opponent synchronization)
        if (type === "SUBMIT_WORD") {
          const { word, score, length } = payload || {};
          if (typeof word === "string" && typeof score === "number") {
            player.score += score;
            player.wordCount += 1;
            player.latestWord = word;
            player.latestWordScore = score;
            player.words.push({
              word,
              score,
              length: length || word.length,
              timestamp: Date.now(),
            });

            // Broadcast word to opponent
            broadcastToRoom(
              room,
              {
                type: "OPPONENT_WORD",
                payload: {
                  playerId: player.id,
                  playerName: player.name,
                  totalScore: player.score,
                  wordCount: player.wordCount,
                  latestWord: word,
                  latestWordScore: score,
                },
              },
              ws // do not echo back to sender
            );
          }
          return;
        }

        // 7. PLAYER FINISH
        if (type === "PLAYER_FINISH") {
          player.isFinished = true;
          if (typeof payload?.score === "number") {
            player.score = payload.score;
          }
          if (Array.isArray(payload?.words)) {
            player.words = payload.words;
            player.wordCount = payload.words.length;
          }

          // Check if all players finished
          const allFinished = Array.from(room.players.values()).every((p) => p.isFinished);
          if (allFinished || room.players.size === 1) {
            room.status = "results";
            // Determine winner
            const playersArr = Array.from(room.players.values());
            if (playersArr.length >= 2) {
              const [p1, p2] = playersArr;
              if (p1.score > p2.score) {
                room.winnerId = p1.id;
              } else if (p2.score > p1.score) {
                room.winnerId = p2.id;
              } else {
                room.winnerId = "TIE";
              }
            } else if (playersArr.length === 1) {
              room.winnerId = playersArr[0].id;
            }

            broadcastToRoom(room, {
              type: "MATCH_RESULTS",
              payload: {
                room: serializeRoom(room),
                winnerId: room.winnerId,
              },
            });
          } else {
            broadcastToRoom(room, {
              type: "ROOM_STATE",
              payload: { room: serializeRoom(room) },
            });
          }
          return;
        }

        // 8. REMATCH REQUEST
        if (type === "REMATCH_REQUEST") {
          room.status = "waiting";
          room.winnerId = null;
          room.puzzle = null;
          for (const p of room.players.values()) {
            p.score = 0;
            p.wordCount = 0;
            p.words = [];
            p.latestWord = undefined;
            p.latestWordScore = undefined;
            p.isFinished = false;
            p.isReady = p.isHost;
          }

          broadcastToRoom(room, {
            type: "ROOM_STATE",
            payload: { room: serializeRoom(room), isRematch: true },
          });
          return;
        }

        // 9. LEAVE ROOM
        if (type === "LEAVE_ROOM") {
          room.players.delete(ws.playerId);
          if (room.players.size === 0) {
            rooms.delete(room.code);
          } else {
            // Reassign host if host left
            const nextHost = Array.from(room.players.values())[0];
            if (nextHost) {
              nextHost.isHost = true;
              room.hostId = nextHost.id;
            }
            broadcastToRoom(room, {
              type: "PLAYER_LEFT",
              payload: {
                playerName: player.name,
                room: serializeRoom(room),
              },
            });
          }
          ws.roomCode = undefined;
          ws.playerId = undefined;
          return;
        }
      } catch (err) {
        console.error("WebSocket message handling error:", err);
      }
    });

    ws.on("close", () => {
      if (ws.roomCode && ws.playerId) {
        const room = rooms.get(ws.roomCode);
        if (room) {
          const leavingPlayer = room.players.get(ws.playerId);
          room.players.delete(ws.playerId);
          if (room.players.size === 0) {
            rooms.delete(room.code);
          } else {
            const nextHost = Array.from(room.players.values())[0];
            if (nextHost) {
              nextHost.isHost = true;
              room.hostId = nextHost.id;
            }
            broadcastToRoom(room, {
              type: "PLAYER_LEFT",
              payload: {
                playerName: leavingPlayer?.name || "Player",
                room: serializeRoom(room),
              },
            });
          }
        }
      }
    });
  });

  // Periodic room cleanup (empty or older than 4 hours)
  setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms.entries()) {
      if (room.players.size === 0 || now - room.createdAt > 14400000) {
        if (room.countdownTimer) clearInterval(room.countdownTimer);
        rooms.delete(code);
      }
    }
  }, 60000);

  // Vite middleware in dev / static in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} with WebSockets`);
  });
}

startServer();

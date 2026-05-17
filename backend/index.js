const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const cors = require('express-cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Express app setup
const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(cors({ credentials: true, origin: '*' }));

// Game state management
const gameState = {
  players: new Map(),
  games: new Map(),
  maxPlayersPerGame: 4,
};

// WebSocket setup
const wss = new WebSocket.Server({ server, path: '/ws' });

// Game class
class Game {
  constructor(gameId, maxPlayers = 4) {
    this.id = gameId;
    this.players = new Map();
    this.maxPlayers = maxPlayers;
    this.status = 'waiting'; // waiting, active, finished
    this.score = {};
    this.createdAt = new Date();
  }

  addPlayer(player) {
    if (this.players.size >= this.maxPlayers) {
      return false;
    }
    this.players.set(player.id, player);
    this.score[player.id] = 0;
    return true;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    delete this.score[playerId];
    return this.players.size === 0;
  }

  updateScore(playerId, points) {
    if (this.score.hasOwnProperty(playerId)) {
      this.score[playerId] += points;
    }
  }

  getLeaderboard() {
    return Object.entries(this.score)
      .sort(([, a], [, b]) => b - a)
      .map(([playerId, score]) => {
        const player = this.players.get(playerId);
        return {
          playerId,
          playerName: player?.name || 'Unknown',
          score,
        };
      });
  }
}

// Player class
class Player {
  constructor(playerId, name) {
    this.id = playerId;
    this.name = name;
    this.position = { x: Math.random() * 800, y: Math.random() * 600 };
    this.health = 100;
    this.score = 0;
    this.createdAt = new Date();
  }
}

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/games', (req, res) => {
  const games = Array.from(gameState.games.values()).map(game => ({
    id: game.id,
    status: game.status,
    playerCount: game.players.size,
    maxPlayers: game.maxPlayers,
    createdAt: game.createdAt,
  }));
  res.json({ games, total: games.length });
});

app.post('/api/games', (req, res) => {
  const gameId = uuidv4();
  const newGame = new Game(gameId, gameState.maxPlayersPerGame);
  gameState.games.set(gameId, newGame);
  
  res.status(201).json({
    gameId,
    status: newGame.status,
    message: 'Game created successfully',
  });
});

app.get('/api/games/:gameId', (req, res) => {
  const game = gameState.games.get(req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  res.json({
    id: game.id,
    status: game.status,
    players: Array.from(game.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      health: p.health,
      position: p.position,
    })),
    leaderboard: game.getLeaderboard(),
    createdAt: game.createdAt,
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalGames: gameState.games.size,
    totalPlayers: gameState.players.size,
    activeGames: Array.from(gameState.games.values())
      .filter(g => g.status === 'active').length,
  });
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const clientId = uuidv4();
  console.log(`Client connected: ${clientId}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    message: 'Welcome to the game server',
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleGameMessage(clientId, message, ws);
    } catch (error) {
      console.error('Invalid message format:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
      }));
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId}`);
    if (gameState.players.has(clientId)) {
      const player = gameState.players.get(clientId);
      if (player.gameId && gameState.games.has(player.gameId)) {
        const game = gameState.games.get(player.gameId);
        const isGameEmpty = game.removePlayer(clientId);
        if (isGameEmpty) {
          gameState.games.delete(player.gameId);
        }
      }
      gameState.players.delete(clientId);
      broadcastGameUpdate(player.gameId);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error (${clientId}):`, error);
  });
});

function handleGameMessage(clientId, message, ws) {
  const { type, payload } = message;

  switch (type) {
    case 'join_game': {
      const { gameId, playerName } = payload;
      const game = gameState.games.get(gameId);

      if (!game) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Game not found',
        }));
        return;
      }

      const player = new Player(clientId, playerName);
      if (game.addPlayer(player)) {
        player.gameId = gameId;
        gameState.players.set(clientId, player);

        ws.send(JSON.stringify({
          type: 'game_joined',
          gameId,
          playerId: clientId,
          playerName,
        }));

        broadcastGameUpdate(gameId);
        if (game.players.size === game.maxPlayers) {
          game.status = 'active';
          broadcastToGame(gameId, {
            type: 'game_started',
            message: 'All players joined. Game is starting!',
          });
        }
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Cannot join game: game is full or does not exist',
        }));
      }
      break;
    }

    case 'player_move': {
      const player = gameState.players.get(clientId);
      if (player) {
        const { x, y } = payload;
        player.position = { x, y };
        if (player.gameId) {
          broadcastToGame(player.gameId, {
            type: 'player_moved',
            playerId: clientId,
            position: player.position,
          });
        }
      }
      break;
    }

    case 'score_update': {
      const player = gameState.players.get(clientId);
      if (player && player.gameId) {
        const game = gameState.games.get(player.gameId);
        const { points } = payload;
        game.updateScore(clientId, points);
        player.score += points;

        broadcastToGame(player.gameId, {
          type: 'score_updated',
          playerId: clientId,
          playerName: player.name,
          points,
          leaderboard: game.getLeaderboard(),
        });
      }
      break;
    }

    case 'game_action': {
      const player = gameState.players.get(clientId);
      if (player && player.gameId) {
        const { action, data } = payload;
        broadcastToGame(player.gameId, {
          type: 'game_action',
          playerId: clientId,
          action,
          data,
        });
      }
      break;
    }

    case 'chat': {
      const player = gameState.players.get(clientId);
      if (player && player.gameId) {
        const { message } = payload;
        broadcastToGame(player.gameId, {
          type: 'chat_message',
          playerId: clientId,
          playerName: player.name,
          message,
          timestamp: new Date().toISOString(),
        });
      }
      break;
    }

    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${type}`,
      }));
  }
}

function broadcastToGame(gameId, message) {
  const game = gameState.games.get(gameId);
  if (!game) return;

  const data = JSON.stringify(message);
  game.players.forEach(player => {
    const ws = wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        const playerData = gameState.players.get(Array.from(gameState.players.keys()).find(
          key => gameState.players.get(key) === player
        ));
        if (playerData && playerData.gameId === gameId) {
          client.send(data);
        }
      }
    });
  });
}

function broadcastGameUpdate(gameId) {
  const game = gameState.games.get(gameId);
  if (game) {
    broadcastToGame(gameId, {
      type: 'game_update',
      playerCount: game.players.size,
      players: Array.from(game.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
        health: p.health,
      })),
      leaderboard: game.getLeaderboard(),
    });
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║    Game Server Started                 ║
╠════════════════════════════════════════╣
║  HTTP:      http://localhost:${PORT}     ║
║  WebSocket: ws://localhost:${PORT}/ws   ║
║  Environment: ${NODE_ENV}            ║
║  Node Version: ${process.version}         ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

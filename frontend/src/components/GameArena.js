import React, { useState, useEffect, useRef } from 'react';
import '../styles/GameArena.css';

const GameArena = ({ gameId, playerName, onLeaveGame }) => {
  const canvasRef = useRef(null);
  const [ws, setWs] = useState(null);
  const [players, setPlayers] = useState({});
  const [playerPosition, setPlayerPosition] = useState({ x: 400, y: 300 });
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerId, setPlayerId] = useState(null);
  const keysPressed = useRef({});
  const gameLoopRef = useRef(null);

  useEffect(() => {
    // WebSocket connection
    const wsUrl = `ws://localhost:3000/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setTimeout(() => {
        websocket.send(JSON.stringify({
          type: 'join_game',
          payload: { gameId, playerName },
        }));
      }, 100);
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleMessage(message);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(websocket);

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [gameId, playerName]);

  const handleMessage = (message) => {
    const { type, payload } = message;

    switch (type) {
      case 'game_joined':
        setPlayerId(message.playerId);
        break;
      case 'game_update':
        updatePlayers(message.players);
        break;
      case 'player_moved':
        updatePlayerPosition(message.playerId, message.position);
        break;
      case 'score_updated':
        setLeaderboard(message.leaderboard);
        break;
      default:
        break;
    }
  };

  const updatePlayers = (updatedPlayers) => {
    const playerMap = {};
    updatedPlayers.forEach(p => {
      playerMap[p.id] = p;
    });
    setPlayers(playerMap);
  };

  const updatePlayerPosition = (id, position) => {
    setPlayers(prev => ({
      ...prev,
      [id]: { ...prev[id], position }
    }));
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop for rendering and movement
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const SPEED = 5;
    const CANVAS_WIDTH = canvas.width;
    const CANVAS_HEIGHT = canvas.height;

    gameLoopRef.current = setInterval(() => {
      let newX = playerPosition.x;
      let newY = playerPosition.y;

      if (keysPressed.current['arrowup'] || keysPressed.current['w']) newY = Math.max(20, newY - SPEED);
      if (keysPressed.current['arrowdown'] || keysPressed.current['s']) newY = Math.min(CANVAS_HEIGHT - 20, newY + SPEED);
      if (keysPressed.current['arrowleft'] || keysPressed.current['a']) newX = Math.max(20, newX - SPEED);
      if (keysPressed.current['arrowright'] || keysPressed.current['d']) newX = Math.min(CANVAS_WIDTH - 20, newX + SPEED);

      if (newX !== playerPosition.x || newY !== playerPosition.y) {
        setPlayerPosition({ x: newX, y: newY });
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'player_move',
            payload: { x: newX, y: newY },
          }));
        }
      }

      // Clear canvas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw grid background
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_WIDTH, i);
        ctx.stroke();
      }

      // Draw all players
      Object.entries(players).forEach(([id, player]) => {
        const isCurrentPlayer = id === playerId;
        ctx.fillStyle = isCurrentPlayer ? '#3b82f6' : '#10b981';
        ctx.beginPath();
        ctx.arc(player.position.x, player.position.y, 12, 0, Math.PI * 2);
        ctx.fill();

        if (isCurrentPlayer) {
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(player.position.x, player.position.y, 20, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, player.position.x, player.position.y + 25);

        // Health bar
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(player.position.x - 15, player.position.y - 25, 30, 3);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(player.position.x - 15, player.position.y - 25, (player.health || 100) * 0.3, 3);
      });

      // Draw current player
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(playerPosition.x, playerPosition.y, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(playerPosition.x, playerPosition.y, 20, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(playerName, playerPosition.x, playerPosition.y + 25);
    }, 1000 / 60); // 60 FPS

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [playerPosition, players, playerId, playerName, ws]);

  const handleScoreClick = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      setScore(score + 10);
      ws.send(JSON.stringify({
        type: 'score_update',
        payload: { points: 10 },
      }));
    }
  };

  return (
    <div className="game-arena">
      <div className="arena-header">
        <div className="player-info">
          <h3>{playerName}</h3>
          <p>Score: <span className="score-value">{score}</span></p>
        </div>
        <button className="btn btn-leave" onClick={onLeaveGame}>
          🚪 Leave Game
        </button>
      </div>

      <div className="arena-content">
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="game-canvas"
            onClick={handleScoreClick}
            title="Click to score points!"
          />
          <div className="controls-hint">
            ⬆️ W/↑ | ⬅️ A/← | ⬇️ S/↓ | ➡️ D/→ | Click canvas to score
          </div>
        </div>

        <div className="leaderboard">
          <h4>🏆 Leaderboard</h4>
          <div className="leaderboard-list">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => (
                <div key={entry.playerId} className="leaderboard-entry">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{entry.playerName}</span>
                  <span className="points">{entry.score} pts</span>
                </div>
              ))
            ) : (
              <p className="no-data">No scores yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameArena;

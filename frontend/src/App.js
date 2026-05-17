import React, { useState, useEffect } from 'react';
import './App.css';
import GameLobby from './components/GameLobby';
import GameArena from './components/GameArena';
import ChatBox from './components/ChatBox';

function App() {
  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const [connected, setConnected] = useState(false);
  const [gameStatus, setGameStatus] = useState('lobby'); // lobby, playing, finished

  const handleJoinGame = (selectedGameId, name) => {
    setGameId(selectedGameId);
    setPlayerName(name);
    setGameStatus('playing');
  };

  const handleLeaveGame = () => {
    setGameId(null);
    setPlayerId(null);
    setPlayerName(null);
    setGameStatus('lobby');
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>🎮 Game Arena</h1>
          <div className="connection-status">
            <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </header>

      <main className="app-main">
        {gameStatus === 'lobby' ? (
          <GameLobby onJoinGame={handleJoinGame} setConnected={setConnected} />
        ) : (
          <div className="game-container">
            <GameArena
              gameId={gameId}
              playerName={playerName}
              onLeaveGame={handleLeaveGame}
            />
            <ChatBox gameId={gameId} playerName={playerName} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2024 Game Arena - Multiplayer Gaming Platform</p>
      </footer>
    </div>
  );
}

export default App;

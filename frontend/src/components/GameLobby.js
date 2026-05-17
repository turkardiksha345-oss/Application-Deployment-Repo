import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/GameLobby.css';

const GameLobby = ({ onJoinGame, setConnected }) => {
  const [games, setGames] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    checkServerHealth();
    fetchGames();
    const interval = setInterval(fetchGames, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkServerHealth = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/health');
      setServerStatus('online');
      setConnected(true);
    } catch (error) {
      setServerStatus('offline');
      setConnected(false);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/games');
      setGames(response.data.games);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch games:', error);
      setLoading(false);
    }
  };

  const createNewGame = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/games');
      const newGameId = response.data.gameId;
      setSelectedGameId(newGameId);
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      alert('Please enter your player name');
      return;
    }
    if (!selectedGameId) {
      alert('Please create or select a game');
      return;
    }
    onJoinGame(selectedGameId, playerName);
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h2>Welcome to Game Arena</h2>
        <div className={`server-status ${serverStatus}`}>
          Server: {serverStatus.toUpperCase()}
        </div>
      </div>

      <div className="lobby-content">
        <div className="player-setup">
          <div className="input-group">
            <label>Your Name:</label>
            <input
              type="text"
              placeholder="Enter your player name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>

          <button className="btn btn-primary" onClick={createNewGame}>
            ➕ Create New Game
          </button>
        </div>

        <div className="games-list">
          <h3>Available Games</h3>
          {loading ? (
            <div className="loading">Loading games...</div>
          ) : games.length === 0 ? (
            <div className="no-games">
              <p>No games available</p>
              <p>Create a new game to get started!</p>
            </div>
          ) : (
            <div className="games-grid">
              {games.map((game) => (
                <div
                  key={game.id}
                  className={`game-card ${selectedGameId === game.id ? 'selected' : ''}`}
                  onClick={() => setSelectedGameId(game.id)}
                >
                  <div className="game-card-header">
                    <span className={`game-status ${game.status}`}>
                      {game.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="game-card-body">
                    <p><strong>Players:</strong> {game.playerCount}/{game.maxPlayers}</p>
                    <p><strong>Game ID:</strong> {game.id.substring(0, 8)}...</p>
                    <p><strong>Created:</strong> {new Date(game.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="game-card-footer">
                    <div className="player-slots">
                      {Array.from({ length: game.maxPlayers }).map((_, i) => (
                        <div
                          key={i}
                          className={`slot ${i < game.playerCount ? 'filled' : 'empty'}`}
                          title={i < game.playerCount ? 'Occupied' : 'Empty'}
                        >
                          {i < game.playerCount ? '👤' : '⭕'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="btn btn-join"
          onClick={handleJoin}
          disabled={!playerName.trim() || !selectedGameId}
        >
          🚀 Join Game
        </button>
      </div>

      <div className="lobby-stats">
        <h4>Server Stats</h4>
        <p>Total Games: {games.length}</p>
        <p>Total Players: {games.reduce((sum, g) => sum + g.playerCount, 0)}</p>
      </div>
    </div>
  );
};

export default GameLobby;

import React, { useState, useEffect, useRef } from 'react';
import '../styles/ChatBox.css';

const ChatBox = ({ gameId, playerName }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const wsUrl = `ws://localhost:3000/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'chat_message') {
        setMessages(prev => [...prev, {
          playerName: message.playerName,
          text: message.message,
          timestamp: new Date(message.timestamp),
        }]);
      }
    };

    setWs(websocket);

    return () => {
      if (websocket) websocket.close();
    };
  }, [gameId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
      type: 'chat',
      payload: { message: inputValue },
    }));

    setInputValue('');
  };

  return (
    <div className="chat-box">
      <div className="chat-header">💬 Chat</div>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">No messages yet</div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="chat-message">
              <span className="message-sender">{msg.playerName}:</span>
              <span className="message-text">{msg.text}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit" className="chat-send-btn">Send</button>
      </form>
    </div>
  );
};

export default ChatBox;

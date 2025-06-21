import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PatientChat = ({ appointmentId, userId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/chat/${appointmentId}`);
      const fetched = res.data?.messages;
      setMessages(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/chat/send`, {
        appointmentId,
        senderType: 'user',
        senderId: userId,
        message: input,
      });
      setInput('');
      fetchMessages();
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [appointmentId]);

  return (
    <div className="chat-box">
      <div className="messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.senderType === 'user' ? 'user' : 'doctor'}`}
          >
            <strong>{msg.senderType}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <div className="input">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default PatientChat;

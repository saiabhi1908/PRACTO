import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AppContext } from "../context/AppContext";


const Verify2FA = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const { setToken } = useContext(AppContext);  // get setToken from context

  const handleVerify = async () => {
    const storedEmail = localStorage.getItem('2fa_email');

    if (!storedEmail) {
      toast.error('Email not found. Please login again.');
      navigate('/login');
      return;
    }

    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      const res = await axios.post(`http://localhost:4000/api/user/verify-2fa`, {
        email: storedEmail,
        token: code,
      });

      if (res.data.success) {
        // Save token in localStorage and also update React context state immediately
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);  // <-- THIS updates context & triggers logged-in UI
        localStorage.removeItem('2fa_email'); // cleanup temporary storage

        toast.success('2FA verified successfully!');
        navigate('/');  // redirect to home or dashboard
      } else {
        toast.error(res.data.message || 'Invalid or expired code');
      }
    } catch (err) {
      console.error('Error verifying 2FA:', err.response?.data || err.message);
      toast.error('Verification failed');
    }
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-4">Enter 6-digit code from Google Authenticator</h2>
      <input
        type="text"
        value={code}
        maxLength={6}
        onChange={(e) => setCode(e.target.value)}
        className="border rounded p-2 mb-4 text-center text-lg"
        placeholder="123456"
      />
      <button
        onClick={handleVerify}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Verify
      </button>
    </div>
  );
};

export default Verify2FA;

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Setup2FA = () => {
  const [qrCode, setQrCode] = useState('');
  const [token, setToken] = useState('');
  const { userData } = useContext(AppContext);
  const navigate = useNavigate();

  // Hardcoded backend URL
  const backendUrl = 'http://localhost:4000';

  useEffect(() => {
    const generateQR = async () => {
      try {
        console.log('Starting QR code generation for:', userData.email);
        const res = await axios.post(`${backendUrl}/api/user/generate-2fa`, { email: userData.email });
        console.log('QR Code from backend:', res.data.qrCode);

        let qrData = res.data.qrCode;
        if (qrData && !qrData.startsWith('data:image')) {
          qrData = `data:image/png;base64,${qrData}`;
        }
        setQrCode(qrData);
      } catch (err) {
        console.error('Error generating QR code:', err);
        toast.error('Failed to generate QR Code');
      }
    };

    if (userData?.email) {
      console.log('User email found, calling generateQR');
      generateQR();
    } else {
      console.log('User or user.email is not available');
    }
  }, [userData]);

  const verify2FA = async () => {
    if (!token || token.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      const res = await axios.post(`${backendUrl}/api/user/verify-2fa`, {
        email: userData.email,
        token,
      });

      if (res.data.success) {
        toast.success('✅ 2FA enabled successfully!');
        navigate('/');
      } else {
        toast.error(res.data.message || 'Failed to verify 2FA');
      }
    } catch (err) {
      console.error('Verification error:', err.response?.data || err.message);
      toast.error('Verification failed');
    }
  };

  if (!userData?.email) {
    return <p>Loading user info...</p>;
  }

  return (
    <div className="p-4 flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">Enable Google 2FA</h2>
      {qrCode && <img src={qrCode} alt="QR Code" className="mb-4" />}
      <p className="mb-2">Scan this QR code in Google Authenticator or Authy</p>
      <input
        type="text"
        placeholder="Enter 6-digit code"
        value={token}
        maxLength={6}
        onChange={(e) => setToken(e.target.value)}
        className="border rounded p-2 mb-4 text-center"
      />
      <button
        onClick={verify2FA}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Verify
      </button>

      {/* Optional: display raw QR code string for debugging */}
      {qrCode && (
        <pre className="max-w-xs break-words bg-gray-100 p-2 rounded mt-4">
          {qrCode}
        </pre>
      )}
    </div>
  );
};

export default Setup2FA;

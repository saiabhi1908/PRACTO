import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';

const backendUrl = 'http://localhost:4000'; // Change to your deployed URL in production

const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const purpose = location.state?.purpose || 'register'; // default to registration

  useEffect(() => {
    if (!email) {
      toast.error('Email not found. Please start from the Forgot Password or Register page.');
      navigate(purpose === 'reset' ? '/forgot-password' : '/register');
    }
  }, [email, navigate, purpose]);

  const handleVerify = async () => {
    if (!otp.trim()) {
      toast.error('Please enter OTP');
      return;
    }

    try {
      const endpoint = purpose === 'reset' ? '/api/user/verify-reset-otp' : '/api/user/verify-otp';
      const res = await axios.post(`${backendUrl}${endpoint}`, { email, otp });

      if (res.data.success) {
        toast.success('OTP verified');
        if (purpose === 'reset') {
          navigate('/reset-password', { state: { email, otp } });
        } else {
          navigate('/login');
        }
      } else {
        toast.error(res.data.message || 'OTP verification failed');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      toast.error('Error verifying OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Verify OTP</h2>
        <p className="text-sm text-center text-gray-600 mb-4">
          Please enter the 6-digit OTP sent to <span className="font-medium">{email}</span>
        </p>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          maxLength={6}
          className="w-full px-4 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleVerify}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Verify
        </button>
      </div>
    </div>
  );
};

export default VerifyOtp;

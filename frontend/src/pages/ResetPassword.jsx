import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { email, otp } = location.state || {};

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleReset = async () => {
    if (!password.trim()) {
      toast.error('Please enter a new password');
      return;
    }

    try {
      const res = await axios.post(`${backendUrl}/api/user/reset-password`, {
        email,
        otp,
        newPassword: password,
      });
      if (res.data.success) {
        toast.success('Password reset successful');
        navigate('/login');
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error resetting password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Reset Password</h2>
        <p className="text-sm text-center text-gray-600 mb-4">
          Set a new password for <span className="font-medium">{email}</span>
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="w-full px-4 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleReset}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;

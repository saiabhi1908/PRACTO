import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [state, setState] = useState('Sign Up');
  const [phase, setPhase] = useState('FORM'); // FORM or OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [tempToken, setTempToken] = useState('');

  const navigate = useNavigate();
  const { backendUrl, token, setToken } = useContext(AppContext);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (phase === 'OTP') return; // Prevent form submit during OTP

    if (state === 'Sign Up') {
      try {
        const { data } = await axios.post(`${backendUrl}/api/user/register`, { name, email, password });

        if (data.success) {
          const otpResponse = await axios.post(`${backendUrl}/api/user/send-otp`, { email });

          if (otpResponse.data.success) {
            toast.success('OTP sent to your email');
            setPhase('OTP');
          } else {
            toast.error(otpResponse.data.message);
          }
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error('Error occurred during registration');
      }
    } else {
      try {
        const { data } = await axios.post(`${backendUrl}/api/user/login`, { email, password });

        if (data.success) {
          if (data.twoFactorRequired) {
            localStorage.setItem("2fa_email", email);
            navigate('/verify-2fa');
          } else {
            localStorage.setItem('token', data.token);
            setToken(data.token);
          }
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error('Login failed');
      }
    }
  };

  const onVerifyOtp = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/verify-otp`, { email, otp });

      if (data.success) {
        toast.success('Email verified. You can now log in.');
        setState('Login');
        setPhase('FORM');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('OTP verification failed');
    }
  };

  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token]);

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>{state === 'Sign Up' ? 'Create Account' : 'Login'}</p>
        <p>Please {state === 'Sign Up' ? 'sign up' : 'log in'} to book appointment</p>

        {phase === 'FORM' && (
          <>
            {state === 'Sign Up' && (
              <div className='w-full'>
                <p>Full Name</p>
                <input
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  className='border border-[#DADADA] rounded w-full p-2 mt-1'
                  type="text"
                  required
                />
              </div>
            )}

            <div className='w-full'>
              <p>Email</p>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className='border border-[#DADADA] rounded w-full p-2 mt-1'
                type="email"
                required
              />
            </div>

            <div className='w-full'>
              <p>Password</p>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className='border border-[#DADADA] rounded w-full p-2 mt-1'
                type="password"
                required
              />
              {state === 'Login' && (
                <p className="text-right text-blue-600 text-sm mt-1 w-full">
                  <Link to="/forgot-password" className="hover:underline">Forgot Password?</Link>
                </p>
              )}
            </div>

            <button type="submit" className='bg-primary text-white w-full py-2 my-2 rounded-md text-base'>
              {state === 'Sign Up' ? 'Send OTP' : 'Login'}
            </button>
          </>
        )}

        {phase === 'OTP' && (
          <>
            <div className='w-full'>
              <p>Enter OTP sent to your email</p>
              <input
                onChange={(e) => setOtp(e.target.value)}
                value={otp}
                className='border border-[#DADADA] rounded w-full p-2 mt-1'
                type="text"
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onVerifyOtp();
                  }
                }}
              />
            </div>
            <button type="button" onClick={onVerifyOtp} className='bg-primary text-white w-full py-2 my-2 rounded-md text-base'>
              Verify OTP
            </button>
          </>
        )}

        {phase === 'FORM' && (
          <p>
            {state === 'Sign Up' ? 'Already have an account?' : 'Create a new account?'}{' '}
            <span
              onClick={() => {
                setState(state === 'Sign Up' ? 'Login' : 'Sign Up');
                setPhase('FORM');
              }}
              className='text-primary underline cursor-pointer'
            >
              {state === 'Sign Up' ? 'Login here' : 'Click here'}
            </span>
          </p>
        )}
      </div>
    </form>
  );
};

export default Login;

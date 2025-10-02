import axios from 'axios';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { useLoading } from '../context/LoadingContext';

const Signup = () => {
  const [phase, setPhase] = useState('FORM');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContext);
  const { setLoading } = useLoading();

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (phase === 'OTP') return;
  
    setLoading(true);
    
    const minLoadingPromise = new Promise(resolve => setTimeout(resolve, 500));
    try {
      const registerPromise = axios.post(`${backendUrl}/api/user/register`, { name, email, password });
      const [, response] = await Promise.all([minLoadingPromise, registerPromise]);
      const { data } = response;
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
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    setLoading(true);
    const minLoadingPromise = new Promise(resolve => setTimeout(resolve, 1000));
    try {
      const verifyPromise = axios.post(`${backendUrl}/api/user/verify-otp`, { email, otp });
      const [, response] = await Promise.all([minLoadingPromise, verifyPromise]);
      const { data } = response;
      if (data.success) {
        toast.success('Email verified. You can now log in.');
        setPhase('FORM');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('OTP verification failed');
    } finally {
      setLoading(false);
      navigate('/');
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>Create Account</p>
        <p>Please sign up to book appointment</p>

        {phase === 'FORM' && (
          <>
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
            </div>

            <button type="submit" className='w-full py-2 my-2 text-base text-white rounded-md bg-primary'>Send OTP</button>
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
            <button type="button" onClick={onVerifyOtp} className='w-full py-2 my-2 text-base text-white rounded-md bg-primary'>
              Verify OTP
            </button>
          </>
        )}

        {phase === 'FORM' && (
          <p>
            Already have an account{'  '}
            <span
              onClick={() => {
                setPhase('FORM');
                navigate('/login');
              }}
              className='underline cursor-pointer text-primary'
            >Login here</span>
          </p>
        )}
      </div>
    </form>
  );
};

export default Signup;
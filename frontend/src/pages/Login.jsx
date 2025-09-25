import axios from 'axios';
import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { useLoading } from '../context/LoadingContext';

export const Login = () => {
	const navigate = useNavigate()
	const { backendUrl, setToken, setUserData } = useContext(AppContext);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const { setLoading } = useLoading();

		const onSubmitHandler = async (event) => {
			event.preventDefault();
				setLoading(true);
				const minLoadingPromise = new Promise(resolve => setTimeout(resolve, 1000));
				try {
					const loginPromise = axios.post(`${backendUrl}/api/user/login`, { email, password });
					const [, response] = await Promise.all([minLoadingPromise, loginPromise]);
					const { data } = response;
					if (data.success) {
						if (data.twoFactorRequired) {
							localStorage.setItem("2fa_email", email);
							navigate('/verify-2fa');
						} else {
							localStorage.setItem('token', data.token);
							setToken(data.token);
							setUserData(data.userData);
							navigate('/');
						}
					} else {
						toast.error(data.message);
					}
				} catch (error) {
					toast.error('Login failed');
				} finally {
					setLoading(false);
				}
		}

	return (
		<form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
			<div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
				<p className='text-2xl font-semibold'>Login</p>
				<p>Please log in to book appointment</p>

					<>
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
								<p className="w-full mt-1 text-sm text-right text-blue-600">
									<Link to="/forgot-password" className="hover:underline">Forgot Password?</Link>
								</p>
						</div>

						<button type="submit" className='w-full py-2 my-2 text-base text-white rounded-md bg-primary'>
							Login
						</button>
					</>

					<p>
						Create a new account?{' '}
						<span onClick={() => navigate('/signup')} className='underline cursor-pointer text-primary'>Click here</span>
					</p>
			</div>
		</form>
	)
}

export default Login;
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
	const [showHomeModal, setShowHomeModal] = useState(false);

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
							navigate('/');
						} else {
							localStorage.setItem('token', data.token);
							setToken(data.token);
							setUserData(data.userData);
							setShowHomeModal(true);
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
			<>
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
				{showHomeModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
						<div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-lg">
							<h2 className="mb-2 text-lg font-semibold">Login Successful</h2>
							<p className="mb-4 text-center">You have successfully logged in. Would you like to go to the home page now?</p>
							<div className="flex gap-4">
								<button
									className="px-4 py-2 text-white rounded bg-primary hover:bg-blue-700"
									onClick={() => { setShowHomeModal(false); navigate('/'); }}
								>
									Go to Home
								</button>
								<button
									className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
									onClick={() => { setShowHomeModal(false); navigate('/setup-2fa'); }}
								>
									Enable Google 2FA
								</button>
							</div>
						</div>
					</div>
				)}
			</>
		)
}

export default Login;
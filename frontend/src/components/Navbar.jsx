import { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';
import { useLoading } from '../context/LoadingContext';

// import { ThemeContext } from '../context/ThemeContext'

const Navbar = () => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const { token, setToken, userData } = useContext(AppContext)
  const { setLoading } = useLoading();

  
  // const { darkMode, setDarkMode } = useContext(ThemeContext)

  const logout = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    localStorage.removeItem('token');
    setToken(false);
    setLoading(false);
    document.location.href = '/';
  }

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-[#ADADAD]'>
      <img onClick={() => navigate('/')} className='cursor-pointer w-44' src={assets.practo} alt="" />

      <ul className='items-start hidden gap-5 font-medium md:flex'>
        <NavLink to='/'><li className='py-1'>HOME</li></NavLink>
        <NavLink to='/doctors'><li className='py-1'>ALL DOCTORS</li></NavLink>
        <NavLink to='/about'><li className='py-1'>ABOUT</li></NavLink>
        <NavLink to='/contact'><li className='py-1'>CONTACT</li></NavLink>
        <NavLink to='/admin'><li className='py-1'>ADMIN PANEL</li></NavLink>
        <NavLink to='/insurance'><li className='py-1'>INSURANCE</li></NavLink>
        <NavLink to='/symptom-checker'><li className='py-1'>SYMPTOM CHECKER</li></NavLink>
      </ul>

      <div className='flex items-center gap-4'>
        {/* 🌙/🌞 Theme Toggle + Brightness */}
        {/* <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 transition border border-gray-300 rounded-full dark:border-gray-700 hover:scale-105"
            title="Toggle Theme"
          >
            {darkMode ? '🌞' : '🌙'}
          </button>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            onChange={(e) => {
              document.documentElement.style.filter = `brightness(${e.target.value})`;
            }}
            className="w-20 h-1 cursor-pointer"
            title="Adjust Brightness"
          />
        </div> */}

        {/* Auth Buttons */}
        {
          token && userData
            ? <div className='relative flex items-center gap-2 cursor-pointer group'>
              <img className='w-8 rounded-full' src={userData.image} alt="" />
              <img className='w-2.5' src={assets.dropdown_icon} alt="" />
              <div className='absolute top-0 right-0 z-20 hidden text-base font-medium text-gray-600 pt-14 group-hover:block'>
                <div className='flex flex-col gap-4 p-4 rounded min-w-48 bg-gray-50'>
                  <p onClick={() => navigate('/my-profile')} className='cursor-pointer hover:text-black'>My Profile</p>
                  <p onClick={() => navigate('/my-appointments')} className='cursor-pointer hover:text-black'>My Appointments</p>
                  <p onClick={() => navigate('/setup-2fa')} className='cursor-pointer hover:text-black'>Setup 2FA</p>
                  <p onClick={() => navigate('/my-reports')} className='cursor-pointer hover:text-black'>My Reports</p>
                  <p onClick={logout} className='cursor-pointer hover:text-black'>Logout</p>
                </div>
              </div>
            </div>
            : <div className='flex items-center gap-4'>
                <button onClick={() => navigate('/login')} className='h-10 text-base font-light border-2 rounded-full w-28 border-primary text-primary'>Login</button>
                <button onClick={() => navigate('/signup')} className='h-10 text-base font-light text-white rounded-full w-28 bg-primary md:block'>Signup</button>
              </div>
        }

        {/* Mobile Menu Icon */}
        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />

        {/* ---- Mobile Menu ---- */}
        <div className={`md:hidden ${showMenu ? 'fixed w-full' : 'h-0 w-0'} right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img src={assets.practo} className='w-36' alt="" />
            <img onClick={() => setShowMenu(false)} src={assets.cross_icon} className='w-7' alt="" />
          </div>
          <ul className='flex flex-col items-center gap-2 px-5 mt-5 text-lg font-medium'>
            <NavLink onClick={() => setShowMenu(false)} to='/'><p className='inline-block px-4 py-2 rounded full'>HOME</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/doctors'><p className='inline-block px-4 py-2 rounded full'>ALL DOCTORS</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about'><p className='inline-block px-4 py-2 rounded full'>ABOUT</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact'><p className='inline-block px-4 py-2 rounded full'>CONTACT</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/admin'><p className='inline-block px-4 py-2 rounded full'>ADMIN PANEL</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/insurance'><p className='inline-block px-4 py-2 rounded full'>INSURANCE</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/symptom-checker'><p className='inline-block px-4 py-2 rounded full'>SYMPTOM CHECKER</p></NavLink>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar

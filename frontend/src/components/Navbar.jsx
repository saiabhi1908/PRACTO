import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { ThemeContext } from '../context/ThemeContext'

const Navbar = () => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const { token, setToken, userData } = useContext(AppContext)
  const { darkMode, setDarkMode } = useContext(ThemeContext)

  const logout = () => {
    localStorage.removeItem('token')
    setToken(false)
    navigate('/login')
  }

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-[#ADADAD]'>
      <img onClick={() => navigate('/')} className='w-44 cursor-pointer' src={assets.practo} alt="" />

      <ul className='md:flex items-start gap-5 font-medium hidden'>
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full border border-gray-300 dark:border-gray-700 hover:scale-105 transition"
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
        </div>

        {/* Auth Buttons */}
        {
          token && userData
            ? <div className='flex items-center gap-2 cursor-pointer group relative'>
              <img className='w-8 rounded-full' src={userData.image} alt="" />
              <img className='w-2.5' src={assets.dropdown_icon} alt="" />
              <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                <div className='min-w-48 bg-gray-50 rounded flex flex-col gap-4 p-4'>
                  <p onClick={() => navigate('/my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                  <p onClick={() => navigate('/my-appointments')} className='hover:text-black cursor-pointer'>My Appointments</p>
                  <p onClick={() => navigate('/setup-2fa')} className='hover:text-black cursor-pointer'>Setup 2FA</p>
                  <p onClick={() => navigate('/my-reports')} className='hover:text-black cursor-pointer'>My Reports</p>
                  <p onClick={logout} className='hover:text-black cursor-pointer'>Logout</p>
                </div>
              </div>
            </div>
            : <button onClick={() => navigate('/login')} className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block'>Create account</button>
        }

        {/* Mobile Menu Icon */}
        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />

        {/* ---- Mobile Menu ---- */}
        <div className={`md:hidden ${showMenu ? 'fixed w-full' : 'h-0 w-0'} right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img src={assets.practo} className='w-36' alt="" />
            <img onClick={() => setShowMenu(false)} src={assets.cross_icon} className='w-7' alt="" />
          </div>
          <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
            <NavLink onClick={() => setShowMenu(false)} to='/'><p className='px-4 py-2 rounded full inline-block'>HOME</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/doctors'><p className='px-4 py-2 rounded full inline-block'>ALL DOCTORS</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about'><p className='px-4 py-2 rounded full inline-block'>ABOUT</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact'><p className='px-4 py-2 rounded full inline-block'>CONTACT</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/admin'><p className='px-4 py-2 rounded full inline-block'>ADMIN PANEL</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/insurance'><p className='px-4 py-2 rounded full inline-block'>INSURANCE</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/symptom-checker'><p className='px-4 py-2 rounded full inline-block'>SYMPTOM CHECKER</p></NavLink>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar

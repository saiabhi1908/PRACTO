import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { HMSRoomProvider } from '@100mslive/react-sdk';
import MyAppointmentChat from './pages/MyAppointmentChat';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import MedicalReports from './pages/MedicalReports';


import Navbar from './components/Navbar';
import Footer from './components/Footer';
import VoiceAssistant from './components/VoiceAssistant';
import AIChatBot from './components/AIChatBot';
import NearbyHospitals from './components/NearbyHospitals';
import LanguageRecommendation from './components/LanguageRecommendation';
import Insurance from './pages/Insurance';
import Setup2FA from './pages/Setup2FA';
import Verify2FA from './pages/Verify2FA';
import VideoCall from './pages/VideoCall';
import Home from './pages/Home';
import Doctors from './pages/Doctors';
import Login from './pages/Login';
import About from './pages/About';
import Contact from './pages/Contact';
import Appointment from './pages/Appointment';
import MyAppointments from './pages/MyAppointments';
import MyProfile from './pages/MyProfile';
import Verify from './pages/Verify';
import AdminPanel from './pages/AdminPanel';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import ResetPassword from './pages/ResetPassword';
import PaymentPage from './pages/PaymentPage'; // ✅ Ensure this is imported

// ✅ Stripe public key from .env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const App = () => {
  const [location, setLocation] = useState({ lat: null, lng: null });
  const currentLocation = useLocation();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error('Error getting location:', error)
      );
    }
  }, []);

  return (
    <Elements stripe={stripePromise}>
      <div className='mx-4 sm:mx-[10%]'>
        <ToastContainer />
        <Navbar />
        <VoiceAssistant />
        <AIChatBot />

        {currentLocation.pathname === '/' && <LanguageRecommendation />}
        {currentLocation.pathname === '/' && location.lat && location.lng && (
          <NearbyHospitals lat={location.lat} lng={location.lng} />
        )}

        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/doctors' element={<Doctors />} />
          <Route path='/doctors/:speciality' element={<Doctors />} />
          <Route path='/login' element={<Login />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/appointment/:docId' element={<Appointment />} />
          <Route path='/my-appointments' element={<MyAppointments />} />
          <Route path='/my-profile' element={<MyProfile />} />
          <Route path='/my-reports' element={<MedicalReports />} />
           <Route path="/my-appointments/:id/chat" element={<MyAppointmentChat />} />

          <Route path='/verify' element={<Verify />} />
          <Route path='/admin' element={<AdminPanel />} />
          <Route path='/setup-2fa' element={<Setup2FA />} />
          <Route path='/verify-2fa' element={<Verify2FA />} />
          <Route path="/insurance" element={<Insurance />} />
          <Route path='/payment-page' element={<PaymentPage />} /> {/* ✅ Add this route */}
          <Route
            path='/video-call'
            element={
              <HMSRoomProvider>
                <VideoCall />
              </HMSRoomProvider>
            }
          />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/verify-otp' element={<VerifyOtp />} />
          <Route path='/reset-password' element={<ResetPassword />} />
        </Routes>

        <Footer />
      </div>
    </Elements>
  );
};

export default App;

import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import LoadingOverlay from './components/LoadingOverlay';
import { LoadingProvider } from './context/LoadingContext';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { HMSRoomProvider } from '@100mslive/react-sdk';
import MyAppointmentChat from './pages/MyAppointmentChat';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import LanguageRecommendation from './components/LanguageRecommendation';
import MedicalReports from './pages/MedicalReports';
import SymptomChecker from "./pages/SymptomChecker";


import Footer from './components/Footer';
import Navbar from './components/Navbar';
import NearbyHospitals from './components/NearbyHospitals';
import VoiceAssistant from './components/VoiceAssistant';
import About from './pages/About';
import AdminPanel from './pages/AdminPanel';
import Appointment from './pages/Appointment';
import Contact from './pages/Contact';
import Doctors from './pages/Doctors';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Insurance from './pages/Insurance';
import Login from './pages/Login';
import MyAppointments from './pages/MyAppointments';
import MyProfile from './pages/MyProfile';
import PaymentPage from './pages/PaymentPage'; // ✅ Ensure this is imported
import ResetPassword from './pages/ResetPassword';
import Setup2FA from './pages/Setup2FA';
import Signup from './pages/Signup';
import Verify from './pages/Verify';
import Verify2FA from './pages/Verify2FA';
import VerifyOtp from './pages/VerifyOtp';
import VideoCall from './pages/VideoCall';

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
    <LoadingProvider>
      <Elements stripe={stripePromise}>
        <div className='mx-4 sm:mx-[10%]'>
          <LoadingOverlay />
          <ToastContainer />
          <Navbar />
          <VoiceAssistant />

          {currentLocation.pathname === '/' && location.lat && location.lng && (
            <NearbyHospitals lat={location.lat} lng={location.lng} />
          )}

          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/doctors' element={<Doctors />} />
            <Route path='/doctors/:speciality' element={<Doctors />} />
            <Route path='/login' element={<Login />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/about' element={<About />} />
            <Route path='/contact' element={<Contact />} />
            <Route path='/appointment/:docId' element={<Appointment />} />
            <Route path='/my-appointments' element={<MyAppointments />} />
            <Route path="/symptom-checker" element={<SymptomChecker userId={"logged-in-user-id"} />} />
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
    </LoadingProvider>
  );
};

export default App;

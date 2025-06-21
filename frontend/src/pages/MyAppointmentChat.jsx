import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import PatientChat from '../components/PatientChat';
import axios from 'axios';

const MyAppointments = () => {
  const { token, userData } = useContext(AppContext);
  const [appointments, setAppointments] = useState([]);
  const [openChatId, setOpenChatId] = useState(null); // Track open chat

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/appointments`, {
        headers: { token },
      });
      if (res.data.success && Array.isArray(res.data.appointments)) {
        setAppointments(res.data.appointments);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAppointments();
    }
  }, [token]);

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">My Appointments</h1>
      {appointments.length === 0 ? (
        <p className="text-center text-gray-600">No appointments found.</p>
      ) : (
        appointments.map((apt, idx) => (
          <div key={idx} className="bg-white shadow-md rounded p-4 mb-6">
            <div className="flex items-center gap-4">
              <img
                src={apt.docData?.image || '/default-doc.png'}
                alt={apt.docData?.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">{apt.docData?.name}</p>
                <p className="text-sm text-gray-500">Date: {apt.slotDate}</p>
                <p className="text-sm text-gray-500">Time: {apt.slotTime}</p>
              </div>
              <button
                onClick={() => setOpenChatId(openChatId === apt._id ? null : apt._id)}
                className="ml-auto bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
              >
                {openChatId === apt._id ? 'Close Chat' : 'Open Chat'}
              </button>
            </div>

            {/* ✅ Chat box rendered under selected appointment */}
            {openChatId === apt._id && (
              <div className="mt-4 border-t pt-4">
                <PatientChat appointmentId={apt._id} userId={userData._id} />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default MyAppointments;

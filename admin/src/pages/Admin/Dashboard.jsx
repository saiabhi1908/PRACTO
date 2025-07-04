import React, { useContext, useEffect, useState } from 'react';
import { assets } from '../../assets/assets';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import DoctorChat from '../../components/DoctorChat';

const Dashboard = () => {
  const { aToken, getDashData, cancelAppointment, dashData } = useContext(AdminContext);
  const { slotDateFormat } = useContext(AppContext);

  const [openChatId, setOpenChatId] = useState(null);

  useEffect(() => {
    if (aToken) {
      getDashData();
    }
  }, [aToken]);

  return dashData && (
    <div className='m-5'>

      <div className='flex flex-wrap gap-3'>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.doctor_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.doctors}</p>
            <p className='text-gray-400'>Doctors</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.appointments_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.appointments}</p>
            <p className='text-gray-400'>Appointments</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.patients_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.patients}</p>
            <p className='text-gray-400'>Patients</p>
          </div>
        </div>
      </div>

      <div className='bg-white'>
        <div className='flex items-center gap-2.5 px-4 py-4 mt-10 rounded-t border'>
          <img src={assets.list_icon} alt="" />
          <p className='font-semibold'>Latest Bookings</p>
        </div>

        <div className='pt-4 border border-t-0'>
          {dashData.latestAppointments.slice(0, 5).map((item, index) => (
            <div key={index}>
              <div className='flex items-center px-6 py-3 gap-3 hover:bg-gray-100'>
                <img className='rounded-full w-10' src={item.docData.image} alt="" />
                <div className='flex-1 text-sm'>
                  <p className='text-gray-800 font-medium'>{item.docData.name}</p>
                  <p className='text-gray-600'>Booking on {slotDateFormat(item.slotDate)}</p>
                </div>

                {item.cancelled ? (
                  <p className='text-red-400 text-xs font-medium'>Cancelled</p>
                ) : item.isCompleted ? (
                  <p className='text-green-500 text-xs font-medium'>Completed</p>
                ) : (
                  <>
                    <img
                      onClick={() => cancelAppointment(item._id)}
                      className='w-10 cursor-pointer'
                      src={assets.cancel_icon}
                      alt=""
                    />

                    <button
                      onClick={() => setOpenChatId(openChatId === item._id ? null : item._id)}
                      className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
                    >
                      {openChatId === item._id ? 'Close Chat' : 'Open Chat'}
                    </button>

                    {/* ✅ New Join Video Call Button */}
{item.videoConsultation && item.payment && (
  <button
    onClick={() =>
      window.open(`/video-call?room=${item._id}&user=${item.docData._id}&role=doctor`, "_blank")
    }
    className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded"
  >
    Join Video Call
  </button>
)}

                  </>
                )}
              </div>

              {openChatId === item._id && (
                <div className="ml-20 my-2 bg-gray-50 p-4 border rounded-md">
                  <DoctorChat appointmentId={item._id} doctorId={item.docData._id} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

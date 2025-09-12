import React, { useEffect, useContext } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AllAppointments = () => {
  const { aToken, appointments, cancelAppointment, getAllAppointments } = useContext(AdminContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)

  useEffect(() => {
    if (aToken) {
      getAllAppointments()
    }
  }, [aToken])

  // ✅ Debug log
  useEffect(() => {
    console.log("Appointments data:", appointments)
  }, [appointments])

  return (
    <div className='w-full max-w-6xl m-5 '>
      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Action</p>
        </div>

        {appointments?.length > 0 ? (
          appointments.map((item, index) => (
            <div
              className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
              key={item._id || index}
            >
              <p className='max-sm:hidden'>{index + 1}</p>

              {/* Patient Info */}
              <div className='flex items-center gap-2'>
                <img
                  src={item?.userData?.image || '/default-avatar.png'}
                  className='w-8 rounded-full'
                  alt={item?.userData?.name || 'Patient'}
                />
                <p>{item?.userData?.name || 'Unknown Patient'}</p>
              </div>

              {/* Age */}
              <p className='max-sm:hidden'>
                {item?.userData?.dob ? calculateAge(item.userData.dob) : 'N/A'}
              </p>

              {/* Date & Time */}
              <p>
                {item?.slotDate ? slotDateFormat(item.slotDate) : 'N/A'},{' '}
                {item?.slotTime || 'N/A'}
              </p>

              {/* Doctor Info */}
              <div className='flex items-center gap-2'>
                <img
                  src={item?.docData?.image || '/default-doctor.png'}
                  className='w-8 rounded-full bg-gray-200'
                  alt={item?.docData?.name || 'Doctor'}
                />
                <p>{item?.docData?.name || 'Unknown Doctor'}</p>
              </div>

              {/* Fees */}
              <p>
                {currency}
                {!isNaN(item?.amount) && item?.amount !== undefined && item?.amount !== null
                  ? item.amount
                  : '0'}
                {item?.insurance?.provider && (
                  <span className="text-green-600 text-sm font-medium">
                    {' '} (with {item.insurance.provider})
                  </span>
                )}
              </p>

              {/* Status / Cancel Action */}
              {item?.cancelled ? (
                <p className='text-red-400 text-xs font-medium'>Cancelled</p>
              ) : item?.isCompleted ? (
                <p className='text-green-500 text-xs font-medium'>Completed</p>
              ) : (
                <img
                  onClick={() => cancelAppointment(item._id)}
                  className='w-10 cursor-pointer'
                  src={assets.cancel_icon}
                  alt='Cancel Appointment'
                />
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-6">No appointments found</p>
        )}
      </div>
    </div>
  )
}

export default AllAppointments

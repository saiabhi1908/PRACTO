import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import PatientChat from '../components/PatientChat';

// ✅ Review Form Component
const ReviewForm = ({ doctorId, token }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const submitReview = async () => {
    try {
      const res = await axios.post(
        "http://localhost:4000/api/reviews/add",
        { doctorId, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success("Review submitted!");
        setRating(0);
        setComment("");
      }
    } catch (err) {
      toast.error("Failed to submit review");
    }
  };

  return (
    <div className="mt-3 p-3 border rounded bg-gray-50">
      <h4 className="font-semibold mb-2">Leave a Review</h4>
      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        className="border p-2 rounded w-full mb-2"
      >
        <option value={0}>Select rating</option>
        {[1, 2, 3, 4, 5].map((num) => (
          <option key={num} value={num}>{num} Stars</option>
        ))}
      </select>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write a comment..."
        className="border p-2 rounded w-full mb-2"
      />
      <button
        onClick={submitReview}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        Submit
      </button>
    </div>
  );
};

const formatFullDateTimeFromParts = (slotDate, slotTime) => {
  if (!slotDate || !slotTime) return 'Invalid date';
  const [day, month, year] = slotDate.split('_').map(Number);
  const match = slotTime.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 'Invalid time format';
  let [_, hourStr, minuteStr, meridian] = match;
  let hours = parseInt(hourStr, 10);
  let minutes = parseInt(minuteStr, 10);
  if (meridian.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (meridian.toUpperCase() === 'AM' && hours === 12) hours = 0;
  const localDate = new Date(year, month - 1, day, hours, minutes);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  }).format(localDate);
};

const MyAppointments = () => {
  const { backendUrl, token, doctors, getDoctorsData } = useContext(AppContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [payment, setPayment] = useState('');
  const [openChatId, setOpenChatId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState(null);

  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { token },
      });
      setAppointments(data.appointments.reverse());
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const switchMode = async (appointmentId, newMode) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/switch-appointment-mode`, {
        appointmentId,
        newMode,
      }, {
        headers: { token },
      });

      toast.success(data.message);
      getUserAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to switch mode.");
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Appointment Payment',
      description: 'Appointment Payment',
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const { data } = await axios.post(
            `${backendUrl}/api/user/verifyRazorpay`,
            response,
            { headers: { token } }
          );
          if (data.success) {
            navigate('/my-appointments');
            getUserAppointments();
          }
        } catch (error) {
          console.log(error);
          toast.error(error.message);
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const appointmentRazorpay = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/payment-razorpay`,
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        initPay(data.order);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const appointmentStripe = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/payment-stripe`,
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        window.location.replace(data.session_url);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (token) getUserAppointments();
  }, [token]);

  const fetchAvailableSlots = async (docId) => {
    try {
      await getDoctorsData();
      const doctor = doctors.find(doc => doc._id === docId);
      if (!doctor) {
        toast.error("Doctor not found.");
        return;
      }
      const slots = [];
      const today = new Date();
      const endHour = 21;
      for (let i = 0; i < 7; i++) {
        let day = new Date(today);
        day.setDate(today.getDate() + i);
        let current = new Date(day.setHours(10, 0, 0, 0));
        while (current.getHours() < endHour) {
          const slotTime = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const slotDate = `${current.getDate()}_${current.getMonth() + 1}_${current.getFullYear()}`;
          const isBooked = doctor.slots_booked?.[slotDate]?.includes(slotTime);
          if (!isBooked) slots.push({ datetime: new Date(current), slotDate, slotTime });
          current.setMinutes(current.getMinutes() + 10);
        }
      }
      setAvailableSlots(slots);
    } catch (err) {
      console.error("Error fetching slots:", err);
      toast.error("Unable to fetch available slots.");
    }
  };

  const handleReschedule = async () => {
    if (!selectedNewSlot || !selectedAppointment) {
      toast.error("Please select a new time slot.");
      return;
    }
    try {
      const { slotDate, slotTime } = selectedNewSlot;
      const { data } = await axios.post(
        `${backendUrl}/api/user/reschedule-appointment`,
        {
          appointmentId: selectedAppointment._id,
          newSlotDate: slotDate,
          newSlotTime: slotTime,
        },
        { headers: { token } }
      );
      if (data.success) {
        toast.success("Appointment rescheduled successfully!");
        getUserAppointments();
        setShowRescheduleDialog(false);
      } else {
        toast.error(data.message || "Failed to reschedule.");
      }
    } catch (err) {
      console.error("Reschedule error:", err);
      toast.error("Error rescheduling appointment.");
    }
  };

  return (
    <div>
      <p className='pb-3 mt-12 text-lg font-medium text-gray-600 border-b'>My appointments</p>
      <div>
        {appointments.map((item, index) => (
          <div key={index} className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b'>
            <div>
              <img className='w-36 bg-[#EAEFFF]' src={item.docData.image} alt='' />
            </div>
            <div className='flex-1 text-sm text-[#5E5E5E]'>
              <p className='text-[#262626] text-base font-semibold'>{item.docData.name}</p>
              <p>{item.docData.speciality}</p>
              <p className='text-[#464646] font-medium mt-1'>Address:</p>
              <p>{item.docData.address.line1}</p>
              <p>{item.docData.address.line2}</p>
              <p className='mt-1'>
                <span className='text-sm text-[#3C3C3C] font-medium'>Date & Time:</span>{' '}
                {formatFullDateTimeFromParts(item.slotDate, item.slotTime)}
              </p>
              {item.insurance && (
                <div className='mt-1 text-sm text-gray-700'>
                  <p><strong>Insurance:</strong> {item.insurance.provider} - #{item.insurance.policyNumber}</p>
                </div>
              )}
              <p className='mt-1'><strong>Final Amount:</strong> ${item.amount}</p>

              {!item.payment && !item.videoConsultation && (
                <p className="text-sm text-yellow-600 mt-1">
                  💡 Make a payment either in Clinic or Online — Appointment is already confirmed.
                </p>
              )}

              {!item.payment && item.videoConsultation && (
                <p className="text-sm text-red-600 mt-1">
                  💳 Payment required — Please pay online to confirm your video consultation. Join link will appear after payment.
                </p>
              )}

              {/* ✅ Switch mode buttons */}
              {!item.isCompleted && !item.cancelled && (
                <div className="mt-2 flex gap-2">
                  {item.videoConsultation ? (
                    <button
                      onClick={() => switchMode(item._id, "in-clinic")}
                      className="text-sm text-yellow-700 border border-yellow-400 px-2 py-1 rounded"
                    >
                      Switch to In-Clinic
                    </button>
                  ) : (
                    <button
                      onClick={() => switchMode(item._id, "video")}
                      className="text-sm text-blue-700 border border-blue-400 px-2 py-1 rounded"
                    >
                      Switch to Video
                    </button>
                  )}
                </div>
              )}

              <div className='mt-2'>
                <button
                  onClick={() => setOpenChatId(openChatId === item._id ? null : item._id)}
                  className='text-sm px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition'
                >
                  {openChatId === item._id ? 'Close Chat' : 'Open Chat'}
                </button>
                {openChatId === item._id && (
                  <div className='mt-4 border-t pt-3'>
                    <PatientChat appointmentId={item._id} userId={item.userId} />
                  </div>
                )}
              </div>

{!item.cancelled && (
  <ReviewForm doctorId={item.docId} token={token} />
)}

            </div>

            <div className='flex flex-col gap-2 justify-end text-sm text-center'>
              {!item.cancelled && !item.payment && !item.isCompleted && payment !== item._id && (
                <button
                  onClick={() => setPayment(item._id)}
                  className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'
                >
                  Pay Online
                </button>
              )}
              {!item.cancelled && !item.payment && !item.isCompleted && payment === item._id && (
                <>
                  <button
                    onClick={() => appointmentStripe(item._id)}
                    className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 transition-all duration-300 flex items-center justify-center'
                  >
                    <img className='max-w-20 max-h-5' src={assets.stripe_logo} alt='' />
                  </button>
                  <button
                    onClick={() => appointmentRazorpay(item._id)}
                    className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 transition-all duration-300 flex items-center justify-center'
                  >
                    <img className='max-w-20 max-h-5' src={assets.razorpay_logo} alt='' />
                  </button>
                </>
              )}

              {item.videoConsultation && item.payment && !item.cancelled && !item.isCompleted && (
                <button
                  onClick={() => navigate(`/video-call?room=${item._id}&user=${item.userId}&role=patient`)}
                  className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-green-600 hover:text-white transition-all duration-300'
                >
                  Join Video Call
                </button>
              )}

              {!item.cancelled && !item.isCompleted && (
                <button
                  onClick={() => {
                    setSelectedAppointmentId(item._id);
                    setShowConfirm(true);
                  }}
                  className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'
                >
                  Cancel appointment
                </button>
              )}
              {item.cancelled && !item.isCompleted && (
                <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>Appointment cancelled</button>
              )}
              {item.isCompleted && (
                <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>Completed</button>
              )}
              {!item.cancelled && !item.isCompleted && (
                <button
                  onClick={() => {
                    setSelectedAppointment(item);
                    setShowRescheduleDialog(true);
                    fetchAvailableSlots(item.docId);
                  }}
                  className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-yellow-500 hover:text-white transition-all duration-300'
                >
                  Reschedule
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cancel Confirmation Modal */}
      {showConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md'>
            <h2 className='text-lg font-semibold mb-4'>Cancel Appointment</h2>
            <p>Are you sure you want to cancel this appointment?</p>
            <div className='mt-6 flex justify-end gap-4'>
              <button onClick={() => setShowConfirm(false)} className='px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300'>No</button>
              <button onClick={() => { cancelAppointment(selectedAppointmentId); setShowConfirm(false); }} className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleDialog && selectedAppointment && (
        <div className='fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center'>
          <div className='bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-lg'>
            <h2 className='text-lg font-semibold mb-4'>Reschedule Appointment</h2>
            <p className='mb-2'>Select a new available time slot:</p>
            <div className='grid grid-cols-2 gap-3 max-h-64 overflow-y-auto'>
              {availableSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedNewSlot(slot)}
                  className={`p-2 border rounded ${selectedNewSlot?.slotTime === slot.slotTime && selectedNewSlot?.slotDate === slot.slotDate ? 'border-green-500 bg-green-100' : 'border-gray-300'}`}
                >
                  {slot.datetime.toLocaleString()}
                </button>
              ))}
            </div>
            <div className='mt-6 flex justify-end gap-3'>
              <button onClick={() => setShowRescheduleDialog(false)} className='px-4 py-2 bg-gray-200 rounded hover:bg-gray-300'>Cancel</button>
              <button onClick={handleReschedule} className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'>Confirm Reschedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;

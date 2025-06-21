import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PaymentModal = ({ show, onHide, appointmentId, backendUrl, token }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isPaymentInitiated = useRef(false);

  useEffect(() => {
    if (!show) return;

    const fetchAndInitiatePayment = async () => {
      try {
        setLoading(true);
        isPaymentInitiated.current = true;

        const { data: apptData } = await axios.get(
          `${backendUrl}/api/user/get-appointment/${appointmentId}`,
          { headers: { token } }
        );

        if (!apptData.success) {
          toast.error(apptData.message || 'Failed to fetch appointment');
          return;
        }

        const { amount, insurance } = apptData.appointment;

        if (isNaN(amount) || amount <= 0) {
          toast.error('Invalid amount');
          return;
        }

        const { data } = await axios.post(
          `${backendUrl}/api/user/payment-stripe`,
          { appointmentId, amount },
          { headers: { token } }
        );

        if (data.success) {
          navigate('/payment-page', {
            state: {
              clientSecret: data.clientSecret,
              appointmentId,
              amount,
              insurance,
            },
          });
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error('Failed to initiate payment');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId && show && !isPaymentInitiated.current) {
      fetchAndInitiatePayment();
    }
  }, [appointmentId, backendUrl, show, token, navigate]);

  if (!show) return null;

  return (
    <div className="modal" style={{ display: show ? 'block' : 'none' }}>
      <div className="modal-content">
        <h2>Redirecting to Payment Page...</h2>
        {loading && <p>Loading payment details...</p>}
        <button
          onClick={onHide}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;

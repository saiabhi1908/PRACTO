import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Insurance = () => {
  const [form, setForm] = useState({
    provider: '',
    policyNumber: '',
    coverageDetails: '',
    validTill: '',
  });

  const [insurances, setInsurances] = useState([]);

  const fetchInsurance = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/insurance`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      console.log('Fetched insurance data:', data);

      if (Array.isArray(data)) {
        setInsurances(data);
      } else {
        setInsurances([]);
      }
    } catch (error) {
      console.error(
        'Failed to fetch insurance',
        error.response?.data || error.message
      );
      setInsurances([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/insurance`,
        form,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setForm({ provider: '', policyNumber: '', coverageDetails: '', validTill: '' });
      fetchInsurance();
    } catch (error) {
      console.error(
        'Failed to add insurance',
        error.response?.data || error.message
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/insurance/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      fetchInsurance();
    } catch (error) {
      console.error('Delete failed', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchInsurance();
  }, []);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add Insurance</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Provider"
          value={form.provider}
          onChange={(e) => setForm({ ...form, provider: e.target.value })}
          required
          className="w-full p-2 border"
        />
        <input
          type="text"
          placeholder="Policy Number"
          value={form.policyNumber}
          onChange={(e) => setForm({ ...form, policyNumber: e.target.value })}
          required
          className="w-full p-2 border"
        />
        <input
          type="text"
          placeholder="Coverage Details"
          value={form.coverageDetails}
          onChange={(e) => setForm({ ...form, coverageDetails: e.target.value })}
          className="w-full p-2 border"
        />
        <input
          type="date"
          value={form.validTill}
          onChange={(e) => setForm({ ...form, validTill: e.target.value })}
          required
          className="w-full p-2 border"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Add Insurance
        </button>
      </form>

      <h3 className="text-xl font-semibold mt-8 mb-2">Your Insurance Policies</h3>
      <button
        onClick={fetchInsurance}
        className="mb-4 bg-green-600 text-white font-semibold px-4 py-2 rounded hover:bg-green-700"
      >
        Refresh Insurance Policies
      </button>

      {insurances.map((ins) => (
        <div key={ins._id} className="p-3 border my-2 rounded shadow">
          <p><strong>Provider:</strong> {ins.provider}</p>
          <p><strong>Policy #:</strong> {ins.policyNumber}</p>
          <p><strong>Coverage:</strong> {ins.coverageDetails}</p>
          <p><strong>Valid Till:</strong> {new Date(ins.validTill).toLocaleDateString()}</p>
          <button
            onClick={() => handleDelete(ins._id)}
            className="text-red-500 mt-2"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

export default Insurance;

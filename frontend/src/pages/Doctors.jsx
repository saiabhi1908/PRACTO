import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { useNavigate, useParams } from 'react-router-dom';

const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

const Doctors = () => {
  const { speciality } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AppContext); // user object with insurance info
  const userInsurance = user?.insuranceProvider || '';

  const [doctors, setDoctors] = useState([]);
  const [filterDoc, setFilterDoc] = useState([]);
  const [filterInsurance, setFilterInsurance] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  // Fetch doctors from backend with optional insurance filter
  const fetchDoctors = async (insurance) => {
    try {
      let url = `${backendUrl}/api/doctor/list`;
      if (insurance) {
        url += `?insuranceProvider=${encodeURIComponent(insurance)}`;
      }
      const { data } = await axios.get(url);
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  // Filter doctors by speciality on client side after fetching
  const applyFilter = () => {
    if (speciality) {
      const specialityLower = speciality.toLowerCase();

      const filtered = doctors.filter(doc => {
        // Check both specialization and speciality fields
        const specs = doc.specialization || doc.speciality || [];

        if (Array.isArray(specs)) {
          return specs.some(spec => spec.toLowerCase() === specialityLower);
        }

        if (typeof specs === 'string') {
          const specList = specs.split(',').map(s => s.trim().toLowerCase());
          return specList.includes(specialityLower);
        }

        return false;
      });

      setFilterDoc(filtered);
    } else {
      setFilterDoc(doctors);
    }
  };

  // Fetch doctors when component mounts and whenever insurance filter changes
  useEffect(() => {
    fetchDoctors(filterInsurance);
  }, [filterInsurance]);

  // Apply speciality filter whenever doctors or speciality param changes
  useEffect(() => {
    applyFilter();
  }, [doctors, speciality]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className='text-gray-600'>Browse through the doctors specialist.</p>

        {/* Insurance filter dropdown */}
        <select
          className="border p-2 rounded"
          value={filterInsurance}
          onChange={(e) => setFilterInsurance(e.target.value)}
        >
          <option value="">All Insurances</option>
          <option value="Aetna">Aetna</option>
          <option value="Blue Cross">Blue Cross</option>
          <option value="United">United</option>
          <option value="Cigna">Cigna</option>
          <option value="Humana">Humana</option>
          <option value="Medicare">Medicaid</option>
          <option value="Medicaid">Medicaid</option>
          <option value="Kaiser Permanente">Kaiser Permanente</option>
          <option value="UnitedHealthcare">UnitedHealthcare</option>
          {/* Add more options dynamically if needed */}
        </select>
      </div>

      <div className='flex flex-col sm:flex-row items-start gap-5 mt-5'>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${showFilter ? 'bg-primary text-white' : ''}`}
        >
          Filters
        </button>

        <div className={`flex-col gap-4 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'}`}>
          {["General physician", "Gynecologist", "Dermatologist", "Pediatricians", "Neurologist", "Gastroenterologist"].map((spec, idx) => (
            <p
              key={idx}
              onClick={() => speciality?.toLowerCase() === spec.toLowerCase() ? navigate('/doctors') : navigate(`/doctors/${spec}`)}
              className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
                speciality?.toLowerCase() === spec.toLowerCase() ? 'bg-[#E2E5FF] text-black' : ''
              }`}
            >
              {spec}
            </p>
          ))}
        </div>

        <div className='w-full grid grid-cols-auto gap-4 gap-y-6'>
          {filterDoc.length > 0 ? (
            filterDoc.map(doc => (
              <div
                key={doc._id}
                className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500'
              >
                <img className='bg-[#EAEFFF]' src={doc.image} alt={doc.name || "Doctor"} />
                <div className='p-4'>
                  <div className={`flex items-center gap-2 text-sm text-center ${doc.available ? 'text-green-500' : 'text-gray-500'}`}>
                    <p className={`w-2 h-2 rounded-full ${doc.available ? 'bg-green-500' : 'bg-gray-500'}`}></p>
                    <p>{doc.available ? 'Available' : 'Not Available'}</p>
                  </div>
                  <p className='text-[#262626] text-lg font-medium'>{doc.name}</p>
                  <p className='text-[#5C5C5C] text-sm'>{Array.isArray(doc.specialization) ? doc.specialization.join(', ') : doc.specialization}</p>

                  {/* Badge if doctor accepts user insurance */}
                  {userInsurance && doc.acceptedInsurances?.some(i => i.toLowerCase() === userInsurance.toLowerCase()) && (
                    <span className="text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded-full inline-block mt-1">
                      Accepts Your Insurance
                    </span>
                  )}

                  <div className='mt-3 flex justify-between gap-2'>
                    <button
                      onClick={() => {
                        navigate(`/appointment/${doc._id}`);
                        scrollTo(0, 0);
                      }}
                      className="px-3 py-1 bg-gray-200 rounded text-sm"
                    >
                      Book Appointment
                    </button>
                    <button
                      onClick={() => {
                        const appointmentId = Date.now().toString();
                        navigate(`/video-call/${appointmentId}`);
                      }}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                    >
                      Start Consultation
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full">No doctors found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Doctors;

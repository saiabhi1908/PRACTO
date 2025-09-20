import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

// Backend URLs
const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
const FLASK_URL = 'http://localhost:5001';

const Doctors = () => {
  const { speciality } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  const userInsurance = user?.insuranceProvider || '';

  const [doctors, setDoctors] = useState([]);
  const [filterDoc, setFilterDoc] = useState([]);
  const [filterInsurance, setFilterInsurance] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  // AI Matchmaking states
  const [query, setQuery] = useState('');
  const [aiMatches, setAiMatches] = useState([]);

  // Fetch doctors from backend
  const fetchDoctors = async (insurance) => {
    try {
      let url = `${backendUrl}/api/doctor/list`;
      if (insurance) url += `?insuranceProvider=${encodeURIComponent(insurance)}`;
      const { data } = await axios.get(url);
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  // Global refresh function
  useEffect(() => {
    window.refreshDoctors = () => fetchDoctors(filterInsurance);
    return () => { delete window.refreshDoctors; };
  }, [filterInsurance]);

  // Filter doctors by speciality
  const applyFilter = () => {
    if (speciality) {
      const specialityLower = speciality.toLowerCase();
      const filtered = doctors.filter(doc => {
        const specs = doc.specialization || doc.speciality || [];
        if (Array.isArray(specs)) return specs.some(spec => spec.toLowerCase() === specialityLower);
        if (typeof specs === 'string') return specs.split(',').map(s => s.trim().toLowerCase()).includes(specialityLower);
        return false;
      });
      setFilterDoc(filtered);
    } else {
      setFilterDoc(doctors);
    }
  };

  // AI Matchmaking
  const findMatches = async () => {
    try {
      const { data } = await axios.post(`${FLASK_URL}/match`, {
        query,
        preferences: { insurance: filterInsurance, languages: [user?.preferredLanguage || "English"] },
        top_k: 6
      });

      const matches = data.matches || [];
      if (matches.length === 0) {
        setAiMatches([]);
        return;
      }

      // Fetch full doctor info from backend
      const { data: fullData } = await axios.get(`${backendUrl}/api/doctor/list`);
      const fullDoctors = fullData.doctors || [];

      // Merge AI matches with backend doctor info
      const mergedMatches = matches.map(aiDoc => {
        const doc = fullDoctors.find(d => d._id.toString() === aiDoc.doctor_id.toString());
        if (!doc) return null;

        // Filter by speciality if selected
        if (speciality) {
          const specs = doc.specialization || [];
          if (!Array.isArray(specs) || !specs.some(s => s.toLowerCase() === speciality.toLowerCase())) {
            return null;
          }
        }

        // Filter by user insurance if selected
        if (filterInsurance && doc.acceptedInsurances) {
          if (!doc.acceptedInsurances.some(i => i.toLowerCase() === filterInsurance.toLowerCase())) {
            return null;
          }
        }

        return { ...doc, doctor_id: doc._id, aiScore: aiDoc.score };
      }).filter(Boolean);

      // Sort by AI score descending
      mergedMatches.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
      setAiMatches(mergedMatches);

    } catch (err) {
      console.error("AI match failed:", err);
    }
  };

  useEffect(() => { fetchDoctors(filterInsurance); }, [filterInsurance]);
  useEffect(() => { applyFilter(); }, [doctors, speciality]);

  // Render stars
  const renderStars = (rating, reviewsCount) => (
    <div className="flex items-center gap-1 mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-sm ${i < Math.floor(rating || 0) ? "text-yellow-400" : "text-gray-300"}`}>★</span>
      ))}
      <span className="ml-1 text-xs text-gray-600">
        {rating ? rating.toFixed(1) : "No rating"} {reviewsCount ? `(${reviewsCount} review${reviewsCount > 1 ? 's' : ''})` : ''}
      </span>
    </div>
  );

  return (
    <div>
      {/* Filters and AI Search */}
      <div className="flex items-center justify-between mb-4">
        <p className='text-gray-600'>Browse through the doctors specialist.</p>
        <select
          className="p-2 border rounded"
          value={filterInsurance}
          onChange={(e) => setFilterInsurance(e.target.value)}
        >
          <option value="">All Insurances</option>
          <option value="Aetna">Aetna</option>
          <option value="Blue Cross">Blue Cross</option>
          <option value="United">United</option>
          <option value="Cigna">Cigna</option>
          <option value="Humana">Humana</option>
          <option value="Medicare">Medicare</option>
          <option value="Medicaid">Medicaid</option>
          <option value="Kaiser Permanente">Kaiser Permanente</option>
          <option value="UnitedHealthcare">UnitedHealthcare</option>
        </select>
      </div>

      <div className="mb-4">
        <textarea
          className="w-full p-2 border"
          placeholder="Describe your symptoms or needs..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className="px-4 py-2 mt-2 text-white bg-blue-600 rounded" onClick={findMatches}>
          Find Best Matches (AI)
        </button>
      </div>

{/* AI Suggested Doctors */}
{aiMatches.length > 0 && (
  <div className="mt-4">
    <h3 className="mb-2 text-xl font-semibold">AI Suggested Doctors</h3>
    <div className="grid gap-4 grid-cols-auto">
      {aiMatches.map(doc => (
        <div key={doc.doctor_id} className="p-4 border rounded">
          <p className="font-bold">{doc.name}</p>

          {/* ✅ Show speciality */}
          <p className="text-sm text-gray-600">
            Speciality: {Array.isArray(doc.specialization) ? doc.specialization.join(', ') : doc.specialization || doc.speciality || 'N/A'}
          </p>

          <p>Languages: {doc.languagesKnown?.join(", ") || 'N/A'}</p>
          <p>Insurance: {doc.acceptedInsurances?.join(", ") || 'N/A'}</p>
          {renderStars(doc.rating, doc.reviewsCount)}
          <p className="mt-1 text-xs text-gray-500">AI Score: {doc.aiScore?.toFixed(2)}</p>

          <button onClick={() => navigate(`/appointment/${doc.doctor_id}`)}
            className="px-3 py-1 mt-2 text-white bg-green-500 rounded">Book Now</button>
        </div>
      ))}
    </div>
  </div>
)}

      {/* Doctor List */}
      <div className='flex flex-col items-start gap-5 mt-5 sm:flex-row'>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${showFilter ? 'bg-primary text-white' : ''}`}>
          Filters
        </button>

        <div className={`flex-col gap-4 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'}`}>
          {["General physician", "Gynecologist", "Dermatologist", "Pediatricians", "Neurologist", "Gastroenterologist", "Cardiologist", "Pulmonologist"].map((spec, idx) => (
            <p
              key={idx}
              onClick={() => speciality?.toLowerCase() === spec.toLowerCase() ? navigate('/doctors') : navigate(`/doctors/${spec}`)}
              className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality?.toLowerCase() === spec.toLowerCase() ? 'bg-[#E2E5FF] text-black' : ''}`}>
              {spec}
            </p>
          ))}
        </div>

        <div className='grid w-full gap-4 grid-cols-auto gap-y-6'>
          {filterDoc.length > 0 ? filterDoc.map(doc => (
            <div key={doc._id} className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer max-w-60 hover:translate-y-[-10px] transition-all duration-500'>
              <img className='bg-[#EAEFFF] w-full max-h-56 min-h-56 object-cover' src={doc.image} alt={doc.name || "Doctor"} />
              <div className='p-4'>
                <div className={`flex items-center gap-2 text-sm text-center ${doc.available ? 'text-green-500' : 'text-gray-500'}`}>
                  <p className={`w-2 h-2 rounded-full ${doc.available ? 'bg-green-500' : 'bg-gray-500'}`}></p>
                  <p>{doc.available ? 'Available' : 'Not Available'}</p>
                </div>
                <p className='text-[#262626] text-lg font-medium'>{doc.name}</p>
                <p className='text-[#5C5C5C] text-sm'>
                  {Array.isArray(doc.specialization) ? doc.specialization.join(', ') : doc.specialization}
                </p>
                {renderStars(doc.rating, doc.reviewsCount)}
                {userInsurance && doc.acceptedInsurances?.some(i => i.toLowerCase() === userInsurance.toLowerCase()) && (
                  <span className="inline-block px-2 py-1 mt-1 text-xs font-medium text-green-600 bg-green-100 rounded-full">
                    Accepts Your Insurance
                  </span>
                )}
                <div className='flex flex-col justify-between gap-2 mt-3'>
                  <button onClick={() => { navigate(`/appointment/${doc._id}`); scrollTo(0, 0); }}
                    className="px-3 py-2 text-sm bg-gray-200 rounded">Book Appointment</button>
                  <button onClick={() => { const appointmentId = Date.now().toString(); navigate(`/video-call/${appointmentId}`); }}
                    className="px-3 py-2 text-sm text-white bg-blue-500 rounded">Start Consultation</button>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-500 col-span-full">No doctors found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Doctors;

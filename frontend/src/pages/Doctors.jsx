import React, { useContext, useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { useNavigate, useParams } from 'react-router-dom';

// Backend URLs
const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
const FLASK_URL = 'http://localhost:5001';

// Speech Recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

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
  const [listening, setListening] = useState(false);   // voice recording state
  const recognitionRef = useRef(null);                 // voice recognition instance

  // 🔹 Setup voice recognition
  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) final += res[0].transcript + " ";
        else interim += res[0].transcript + " ";
      }
      setQuery(prev => (final ? prev + final : prev));
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;

    return () => recognition.stop?.();
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      alert("SpeechRecognition not supported in this browser.");
      return;
    }
    setQuery("");
    recognitionRef.current.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

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
      <span className="text-xs text-gray-600 ml-1">
        {rating ? rating.toFixed(1) : "No rating"} {reviewsCount ? `(${reviewsCount} review${reviewsCount > 1 ? 's' : ''})` : ''}
      </span>
    </div>
  );

  return (
    <div>
      {/* Filters and AI Search */}
      <div className="flex justify-between items-center mb-4">
        <p className='text-gray-600'>Browse through the doctors specialist.</p>
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
          <option value="Medicare">Medicare</option>
          <option value="Medicaid">Medicaid</option>
          <option value="Kaiser Permanente">Kaiser Permanente</option>
          <option value="UnitedHealthcare">UnitedHealthcare</option>
        </select>
      </div>

      {/* AI Search Box with Voice Button */}
      <div className="mb-4">
        <textarea
          className="border p-2 w-full"
          placeholder="Describe your symptoms or needs..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        {/* 🎙️ Voice button */}
        {SpeechRecognition && (
          <button
            onClick={() => (listening ? stopListening() : startListening())}
            className={`mt-2 px-4 py-2 rounded ${listening ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
          >
            {listening ? "Stop Recording" : "🎙️ Speak Symptoms"}
          </button>
        )}

        <button
          className="mt-2 ml-2 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={findMatches}
        >
          Find Best Matches (AI)
        </button>
      </div>

      {/* AI Suggested Doctors */}
      {aiMatches.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">AI Suggested Doctors</h3>
          <div className="grid grid-cols-auto gap-4">
            {aiMatches.map(doc => (
              <div key={doc.doctor_id} className="border p-4 rounded">
                <p className="font-bold">{doc.name}</p>

                <p className="text-sm text-gray-600">
                  Speciality: {Array.isArray(doc.specialization) ? doc.specialization.join(', ') : doc.specialization || doc.speciality || 'N/A'}
                </p>

                <p>Languages: {doc.languagesKnown?.join(", ") || 'N/A'}</p>
                <p>Insurance: {doc.acceptedInsurances?.join(", ") || 'N/A'}</p>
                {renderStars(doc.rating, doc.reviewsCount)}
                <p className="text-xs text-gray-500 mt-1">AI Score: {doc.aiScore?.toFixed(2)}</p>

                <button onClick={() => navigate(`/appointment/${doc.doctor_id}`)}
                  className="mt-2 px-3 py-1 bg-green-500 text-white rounded">Book Now</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doctor List */}
      <div className='flex flex-col sm:flex-row items-start gap-5 mt-5'>
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

        <div className='w-full grid grid-cols-auto gap-4 gap-y-6'>
          {filterDoc.length > 0 ? filterDoc.map(doc => (
            <div key={doc._id} className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500'>
              <img className='bg-[#EAEFFF]' src={doc.image} alt={doc.name || "Doctor"} />
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
                  <span className="text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded-full inline-block mt-1">
                    Accepts Your Insurance
                  </span>
                )}
                <div className='mt-3 flex justify-between gap-2'>
                  <button onClick={() => { navigate(`/appointment/${doc._id}`); scrollTo(0, 0); }}
                    className="px-3 py-1 bg-gray-200 rounded text-sm">Book Appointment</button>
                  <button onClick={() => { const appointmentId = Date.now().toString(); navigate(`/video-call/${appointmentId}`); }}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm">Start Consultation</button>
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

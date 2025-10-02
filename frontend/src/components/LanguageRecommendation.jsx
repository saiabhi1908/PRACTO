import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { countryFlags } from '../assets/assets';


const LanguageRecommendation = () => {
  const countries = [
    { name: "United States", language: "English", flag: countryFlags.flagUS },
    { name: "France", language: "French", flag: countryFlags.flagFrance },
    { name: "India", language: "Hindi", flag: countryFlags.flagIndia },
    { name: "Spain", language: "Spanish", flag: countryFlags.flagSpain },
    { name: "China", language: "Mandarin", flag: countryFlags.flagChina },
  ];
  const [language, setLanguage] = useState("");
  const [doctors, setDoctors] = useState([]);
  const navigate = useNavigate();

  const handleClickSearch = async (value) => {
    if (!value) return;
    try {
        const res = await axios.get(`http://localhost:4000/api/doctor/by-language?language=${value}`);
        setDoctors(res.data);
        console.log("resdata",res.data);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    }
  };

  const handleSearch = async () => {
    if (!language) return;
    try {
        const res = await axios.get(`http://localhost:4000/api/doctor/by-language?language=${language}`);
        setDoctors(res.data);
        console.log("resdata",res.data);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 mt-6 mb-24">
      <h1 className="text-3xl font-medium">Find Doctors by Language</h1>
      <p className='text-sm text-center sm:w-1/3'>Connect with doctors who speak your preferred language for clear and comfortable communication.</p>
      <div className="flex flex-col items-center" style={{marginTop: "20px", height: "120px", marginBottom: "64px"}}>
        <div className="grid grid-cols-5 gap-4 mb-8">
          {countries.map((country, index) => (
            <button
              key={index}
              onClick={() => handleClickSearch(country.language)}
              className="flex flex-col items-center gap-4 text-xs"
            >
              <img src={country.flag} className="w-24 h-24 rounded-full" alt="US Flag"/>
              <p>{country.name}</p>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-2 py-1 border rounded h w-60"
          >
            <option value=".">All Languages</option>
            <option value="Hindi">Hindi</option>
            <option value="Spanish">Spanish</option>
            <option value="English">English</option>
            <option value="French">French</option>
            <option value="Mandarin">Mandarin</option>
            {/* Add more languages as needed */}
          </select>
          <button onClick={handleSearch} className="px-4 py-1 text-white bg-blue-500 rounded">
            Search
          </button>
        </div>
      </div>

      {doctors.length > 0 && (
        <ul className="mt-4 space-y-2">
          {doctors.map((doc) => (
            <li
              key={doc._id}
              className="p-2 border rounded cursor-pointer hover:bg-blue-50"
              onClick={() => navigate(`/appointment/${doc._id}`)}
            >
              <p className="font-bold text-blue-700 underline">{doc.name}</p>
              <p>{doc.speciality}</p>
              {(doc.languagesKnown || []).length > 0 && (
                <p className="text-sm text-gray-500">
                  Speaks: {doc.languagesKnown.join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageRecommendation;

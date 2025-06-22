import React, { useState } from "react";
import axios from "axios";

const SymptomChecker = ({ userId }) => {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:4000/api/symptom-checker", { symptoms, userId });

      setResult(res.data.diagnosis);
    } catch (err) {
      setResult("Failed to fetch diagnosis.");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🧠 AI Symptom Checker</h2>
      <textarea
        className="w-full p-2 border rounded"
        rows="5"
        placeholder="Enter symptoms (e.g. fever, cough, sore throat)"
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
      />
      <button
        className="mt-3 bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleCheck}
        disabled={loading}
      >
        {loading ? "Checking..." : "Check Symptoms"}
      </button>

      {result && (
        <div className="mt-4 p-3 bg-gray-100 border rounded">
          <h4 className="font-semibold mb-1">Diagnosis:</h4>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;

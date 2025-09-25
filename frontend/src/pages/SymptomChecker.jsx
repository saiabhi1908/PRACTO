import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const SymptomChecker = ({ userId }) => {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
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
      setSymptoms((prev) => (final ? prev + final : prev));
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
    setSymptoms("");
    setResult(null);
    recognitionRef.current.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleCheck = async () => {
    if (!symptoms.trim()) return alert("Please enter or speak your symptoms.");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:4000/api/symptom-checker", {
        symptoms,
        userId,
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setResult({ error: "Failed to fetch diagnosis." });
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🧠 AI Symptom Checker</h2>

      <textarea
        className="w-full p-2 border rounded"
        rows="5"
        placeholder="Enter or speak your symptoms"
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
      />

      {/* Voice controls */}
      {SpeechRecognition && (
        <div className="flex gap-2 my-2">
          <button
            onClick={() => (listening ? stopListening() : startListening())}
            className={`px-3 py-2 rounded ${
              listening ? "bg-red-500 text-white" : "bg-green-500 text-white"
            }`}
          >
            {listening ? "Stop Recording" : "🎙️ Start Recording"}
          </button>
        </div>
      )}

      <button
        className="mt-3 bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleCheck}
        disabled={loading}
      >
        {loading ? "Checking..." : "Check Symptoms"}
      </button>

      {/* Results */}
      {result && (
        <div className="mt-4 p-3 bg-gray-100 border rounded">
          {result.error && <p className="text-red-600">{result.error}</p>}

          {result.diagnosisText && (
            <>
              <h4 className="font-semibold mb-1">Diagnosis (Raw AI Text):</h4>
              <p>{result.diagnosisText}</p>
            </>
          )}

          {result.ai && (
            <>
              <h4 className="font-semibold mt-2">Possible Conditions:</h4>
              <ul className="list-disc ml-6">
                {result.ai.conditions.map((c, i) => (
                  <li key={i}>
                    {c}{" "}
                    {result.ai.confidence?.[i]
                      ? `(${result.ai.confidence[i]})`
                      : ""}
                  </li>
                ))}
              </ul>

              <h4 className="font-semibold mt-2">Recommendations:</h4>
              <ul className="list-disc ml-6">
                {result.ai.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>

              <h4 className="font-semibold mt-2">Suggested Specializations:</h4>
              <p>{result.ai.specializations.join(", ")}</p>
            </>
          )}

          {result.suggestedDoctors &&
            result.suggestedDoctors.length > 0 && (
              <div className="mt-3">
                <h4 className="font-semibold">Suggested Doctors:</h4>
                <ul className="space-y-2">
                  {result.suggestedDoctors.map((doc) => (
                    <li key={doc._id} className="p-2 bg-white rounded border">
                      <div className="font-semibold">{doc.name}</div>
                      <div className="text-sm text-gray-600">
                        {doc.specialization} • Rating: {doc.rating ?? "N/A"}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;

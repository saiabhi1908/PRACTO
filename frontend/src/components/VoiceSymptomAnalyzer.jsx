// src/components/VoiceSymptomAnalyzer.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

const VoiceSymptomAnalyzer = ({ userId }) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      console.warn("Browser does not support SpeechRecognition API");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US"; // allow configuration if needed
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      // build the transcript from results
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) final += res[0].transcript + " ";
        else interim += res[0].transcript + " ";
      }
      setTranscript((prev) => (final ? prev + final : prev));
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error", e);
      setListening(false);
    };

    recognition.onend = () => {
      // when recognition ends (e.g., user stopped speaking)
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop?.();
      recognitionRef.current = null;
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return alert("SpeechRecognition not supported in this browser.");
    setTranscript("");
    setResult(null);
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (err) {
      console.error("start error", err);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setListening(false);
    // wait a tiny bit and then call analyze
    setTimeout(() => analyzeTranscript(transcript.trim()), 300);
  };

  const analyzeTranscript = async (text) => {
    if (!text || !text.trim()) return alert("No transcript to analyze — please say your symptoms.");
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post("http://localhost:4000/api/symptom-checker", { symptoms: text, userId });
      if (res.data.success) {
        setResult(res.data);
      } else {
        setResult({ error: res.data.message || "Unknown error" });
      }
    } catch (err) {
      console.error(err);
      setResult({ error: "Failed to contact symptom-checker endpoint." });
    } finally {
      setLoading(false);
    }
  };

  const manualAnalyze = () => analyzeTranscript(transcript);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-3">🎙️ Voice Symptom Analyzer</h2>

      <div className="mb-3">
        {!SpeechRecognition ? (
          <div className="p-3 bg-yellow-100 border rounded">Your browser doesn't support Speech Recognition. Use the text box below.</div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => (listening ? stopListening() : startListening())}
              className={`px-4 py-2 rounded ${listening ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
            >
              {listening ? "Stop" : "Start Recording"}
            </button>
            <button onClick={() => { setTranscript(""); setResult(null); }} className="px-3 py-2 bg-gray-200 rounded">
              Clear
            </button>
            <button onClick={manualAnalyze} disabled={!transcript || loading} className="px-3 py-2 bg-blue-500 text-white rounded">
              {loading ? "Analyzing..." : "Analyze Transcript"}
            </button>
          </div>
        )}
      </div>

      <textarea
        className="w-full p-2 border rounded mb-3"
        rows="4"
        placeholder="Transcript will appear here — you can also edit before sending..."
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
      />

      {result && result.error && <div className="text-red-600 mb-2">Error: {result.error}</div>}

      {result && result.diagnosisText && (
        <div className="p-3 bg-gray-50 border rounded mb-2">
          <h4 className="font-semibold">AI Diagnosis (raw):</h4>
          <pre className="whitespace-pre-wrap">{result.diagnosisText}</pre>
        </div>
      )}

      {result && result.ai && (
        <div className="p-3 bg-gray-50 border rounded mb-2">
          <h4 className="font-semibold mb-2">AI Suggestions</h4>
          <div>
            <strong>Likely conditions:</strong>
            <ul className="list-disc ml-6">
              {result.ai.conditions.map((c, idx) => (
                <li key={idx}>{c} {result.ai.confidence?.[idx] ? `(${result.ai.confidence[idx]})` : ""}</li>
              ))}
            </ul>
          </div>

          <div className="mt-2">
            <strong>Recommendations:</strong>
            <ul className="list-disc ml-6">
              {result.ai.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>

          <div className="mt-2">
            <strong>Suggested specializations:</strong> {result.ai.specializations.join(", ")}
          </div>
        </div>
      )}

      {result && result.suggestedDoctors && result.suggestedDoctors.length > 0 && (
        <div className="p-3 bg-white border rounded">
          <h4 className="font-semibold mb-2">Suggested Doctors</h4>
          <ul>
            {result.suggestedDoctors.map((doc) => (
              <li key={doc._id} className="mb-2 flex items-center gap-3">
                <img src={doc.profileImage || "/default-doc.png"} alt={doc.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <div className="font-semibold">{doc.name} <span className="text-sm text-gray-500">({doc.specialization})</span></div>
                  <div className="text-sm text-gray-600">Rating: {doc.rating ?? "N/A"} • {doc.reviewsCount ?? 0} reviews</div>
                  {/* Link to doctor profile or booking */}
                  <div className="mt-1">
                    <a href={`/doctor/${doc._id}`} className="text-blue-600 text-sm">View / Book</a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VoiceSymptomAnalyzer;

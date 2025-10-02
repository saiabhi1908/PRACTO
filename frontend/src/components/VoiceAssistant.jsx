import axios from "axios";
import Fuse from "fuse.js"; // fuzzy matching
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import mic_icon from '../assets/mic.svg';
import { AppContext } from "../context/AppContext";


const VoiceAssistant = () => {
  const navigate = useNavigate();
  const { backendUrl, token, userData, loadUserProfileData } = useContext(AppContext);

  const [isListening, setIsListening] = useState(false);
  const [response, setResponse] = useState("");
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [chosenDoctor, setChosenDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [manualCommand, setManualCommand] = useState("");
  const [step, setStep] = useState(1); // 1: specialty, 2: doctor, 3: slot, 4: insurance
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  const [userInsurances, setUserInsurances] = useState([]);
  const [selectedInsuranceId, setSelectedInsuranceId] = useState("");
  const [allSpecialties, setAllSpecialties] = useState([]);

  const speak = (text) => {
    const synth = window.speechSynthesis;
    synth.speak(new SpeechSynthesisUtterance(text));
  };

  const normalizeName = (name) =>
    name
      .toLowerCase()
      .replace(/(dr\.?|md)/g, "")
      .replace(/[.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  // ✅ Specialty normalizer (don’t strip "doctor"/"physician")
  const normalizeSpecialty = (speciality) =>
    speciality
      .toLowerCase()
      .replace(/(dr\.?|a )/g, "") // only strip "dr." or "a "
      .replace(/[.,]/g, "")
      .trim();

  // ✅ Fuzzy match helper
  const fuzzyMatchSpecialty = (spoken) => {
    if (!allSpecialties.length) return spoken;
    const fuse = new Fuse(allSpecialties, { threshold: 0.4 });
    const result = fuse.search(spoken.toLowerCase());
    return result.length ? result[0].item : spoken.toLowerCase();
  };

  // Load specialties once
  useEffect(() => {
    axios
      .get(`${backendUrl}/api/specialties`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setAllSpecialties(res.data.map((s) => s.toLowerCase()));
        }
      })
      .catch(() => {
        // fallback
        setAllSpecialties([
          "general physician",
          "gynecologist",
          "dermatologist",
          "pediatrician",
          "pediatricians",
          "neurologist",
          "gastroenterologist",
          "cardiologist",
          "pulmonologist",
        ]);
      });
  }, [backendUrl]);

  // Step 3: Slot click handler → move to insurance step
  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setStep(4);
    setResponse("Do you want to use insurance for this appointment?");
    speak("Do you want to use insurance for this appointment?");

    if (token) {
      axios
        .get(`${backendUrl}/api/insurance`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (Array.isArray(res.data)) setUserInsurances(res.data);
        })
        .catch((err) => {
          console.error("Error fetching insurance:", err);
        });
    }
  };

  // Step 4: Confirm booking
  const confirmBooking = async () => {
    if (!userData || !userData._id) {
      if (loadUserProfileData) await loadUserProfileData();
      if (!userData || !userData._id) {
        const msg = "Please login first.";
        setResponse(msg);
        speak(msg);
        return;
      }
    }

    try {
      const parts = selectedSlot.split(" ");
      const datePart = parts[0];
      const timePart = `${parts[1]} ${parts[2]}`;

      const payload = {
        userId: userData._id,
        docId: chosenDoctor._id || chosenDoctor.id,
        slotDate: datePart,
        slotTime: timePart,
        ...(selectedInsuranceId ? { insuranceId: selectedInsuranceId } : {}),
      };

      console.log("📤 Booking payload:", payload);

      const { data } = await axios.post(`${backendUrl}/api/user/book-appointment`, payload, {
        headers: { token },
      });

      setResponse(data.message || "Appointment booked!");
      speak(data.message || "Appointment booked!");

      // Reset
      setStep(1);
      setPendingDoctors([]);
      setChosenDoctor(null);
      setAvailableSlots([]);
      setSelectedSlot(null);
      setSelectedInsuranceId("");
    } catch (err) {
      console.error("Booking failed:", err.response?.data || err);
      const msg = "Booking failed. Please try again.";
      setResponse(msg);
      speak(msg);
    }
  };

  // ✅ Specialty routes (lowercase keys)
  const specialtyRoutes = {
    "general physician": "/doctors/General%20physician",
    "gynecologist": "/doctors/gynecologist",
    "dermatologist": "/doctors/dermatologist",
    "pediatrician": "/doctors/pediatricians",
    "pediatricians": "/doctors/pediatricians",
    "neurologist": "/doctors/neurologist",
    "gastroenterologist": "/doctors/gastroenterologist",
    "cardiologist": "/doctors/cardiologist",
    "pulmonologist": "/doctors/pulmonologist",
  };

  // ================== COMMANDS ==================
  const commands = [
    // ✅ Navigation
    {
      command: ["go to *", "open *", "show me *"],
      callback: (page) => {
        const formatted = normalizeSpecialty(page);

        if (specialtyRoutes[formatted]) {
          navigate(specialtyRoutes[formatted]);
          const msg = `Navigating to ${formatted} page.`;
          setResponse(msg);
          speak(msg);
        } else if (formatted === "doctors" || formatted === "doctor") {
          navigate("/doctors");
          const msg = "Navigating to all doctors page.";
          setResponse(msg);
          speak(msg);
        } else if (formatted.includes("profile")) navigate("/my-profile");
        else if (formatted.includes("appointments")) navigate("/my-appointments");
        else if (formatted.includes("contact")) navigate("/contact");
        else if (formatted.includes("about")) navigate("/about");
        else if (formatted.includes("symptom checker")) navigate("/symptom-checker");
        else if (formatted.includes("insurance")) navigate("/insurance");
        else if (formatted.includes("home")) navigate("/");
        else if (formatted.includes("logout")) navigate("/login");
        else {
          const msg = `Sorry, I don't recognize "${page}"`;
          setResponse(msg);
          speak(msg);
        }
      },
    },

    // Step 1: Choose specialty → fetch doctors
    {
      command: ["book appointment with a *", "find * doctor", "show me * doctors"],
      callback: async (speciality) => {
        try {
          const specialityNormalized = fuzzyMatchSpecialty(normalizeSpecialty(speciality));

          const { data } = await axios.get(
            `${backendUrl}/api/voice/doctors?speciality=${specialityNormalized}`,
            { headers: { token } }
          );

          if (data.success && data.doctors.length) {
            setPendingDoctors(data.doctors);
            setStep(2);

            const doctorNames = data.doctors
              .map(
                (d) =>
                  `Dr. ${d.name} (${d.rating ? d.rating.toFixed(1) : "No rating"}★ from ${
                    d.reviewsCount || 0
                  } reviews)`
              )
              .join(", ");

            const message = `I found ${data.doctors.length} ${specialityNormalized} doctors: ${doctorNames}. Please choose a doctor.`;
            setResponse(message);
            speak(message);
          } else {
            const msg = data.message || "No doctors found for this speciality.";
            setResponse(msg);
            speak(msg);
          }
        } catch (err) {
          console.error("Fetch doctors error:", err.response?.data || err);
          const msg = "Sorry, I couldn't fetch doctors.";
          setResponse(msg);
          speak(msg);
        }
      },
    },

    // Step 2: Select doctor
    {
      command: ["choose *", "select *", "book with *"],
      callback: async (doctorNameSpoken) => {
        if (step < 2) {
          const msg = "Please first ask for doctors of a speciality.";
          setResponse(msg);
          speak(msg);
          return;
        }

        const nameNormalized = normalizeName(doctorNameSpoken);
        const doctor = pendingDoctors.find((d) => {
          const normalizedDoctor = normalizeName(d.name);
          return (
            normalizedDoctor.includes(nameNormalized) ||
            nameNormalized.includes(normalizedDoctor)
          );
        });

        if (doctor) {
          setChosenDoctor(doctor);
          setStep(3);

          try {
            const doctorId = doctor._id || doctor.id;
            const { data } = await axios.get(`${backendUrl}/api/voice/slots/${doctorId}`, {
              headers: { token },
            });

            if (data.success && data.available.length) {
              setAvailableSlots(data.available);

              const message = `You chose Dr. ${doctor.name} (${
                doctor.rating ? doctor.rating.toFixed(1) : "No rating"
              }★ from ${doctor.reviewsCount || 0} reviews). I found ${
                data.available.length
              } available slots. Please select one from the buttons below.`;
              setResponse(message);
              speak(
                `You chose Dr. ${doctor.name}. I found ${data.available.length} available slots. Please select one.`
              );
            } else {
              const message = `You chose Dr. ${doctor.name}, but no slots are available.`;
              setResponse(message);
              speak(message);
            }
          } catch (err) {
            console.error("❌ Fetch slots error:", err.response?.data || err);
            const message = `Something went wrong fetching slots for Dr. ${doctor.name}.`;
            setResponse(message);
            speak(message);
          }
        } else {
          const doctorNames = pendingDoctors.map((d) => `Dr. ${d.name}`).join(", ");
          const msg = `I couldn't find "${doctorNameSpoken}". Please choose one of: ${doctorNames}`;
          setResponse(msg);
          speak(msg);
        }
      },
    },

    // Friendly commands
    { command: ["hello", "hi"], callback: () => speak("Hello! How can I assist you today?") },
    {
      command: ["goodbye", "bye"],
      callback: () => {
        speak("Goodbye!");
        setIsListening(false);
      },
    },
  ];

  const { transcript, listening, browserSupportsSpeechRecognition } =
    useSpeechRecognition({ commands });

  useEffect(() => {
    if (isListening) SpeechRecognition.startListening({ continuous: true });
    else SpeechRecognition.stopListening();
  }, [isListening]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const text = manualCommand.trim();
    if (!text) return;

    let matched = false;
    for (const cmd of commands) {
      if (Array.isArray(cmd.command)) {
        for (const phrase of cmd.command) {
          const pattern = new RegExp("^" + phrase.replace(/\*/g, "(.+)") + "$", "i");
          const match = text.match(pattern);
          if (match) {
            const args = match.slice(1).map((arg) => normalizeName(arg));
            cmd.callback(...args);
            matched = true;
            break;
          }
        }
      }
      if (matched) break;
    }

    if (!matched) setResponse(`I didn't understand: "${text}"`);
    setManualCommand("");
  };

  const handleOpenClose = () => {
    setIsOpen(!isOpen);
  }

  if (!browserSupportsSpeechRecognition) {
    return <span>Your browser does not support speech recognition.</span>;
  }

  return (
    <section>
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#fff",
          padding: "16px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontSize: "14px",
          width: "420px",
          zIndex: 1000,
        }}
        className="voice-assistant-container"
        hidden={isOpen}
      >
        <div className="flex items-center justify-between mb-2">
          <strong className="text-lg">Voice Assistant</strong>
          <button
            style={{
              color: "#5f6fff"
            }}
            onClick={handleOpenClose}
            className="text-lg font-bold">x</button>
        </div>
        <p>{listening ? "🎤 Listening..." : 'Say: "book appointment with a pediatrician"'}</p>
        {transcript && (
          <p>
            <strong>You said:</strong> {transcript}
          </p>
        )}
        {response && (
          <p>
            <strong>Response:</strong> {response}
          </p>
        )}
        {/* Step 3: Slots */}
        {step === 3 && chosenDoctor && availableSlots.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            <strong>Select a slot for Dr. {chosenDoctor.name}:</strong>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "8px",
                marginTop: "10px",
              }}
            >
              {availableSlots.map((slot) => {
                const [rawDate, time1, time2] = slot.split(" ");
                const date = rawDate.replace(/_/g, "/");
                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotClick(slot)}
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid #4CAF50",
                      backgroundColor: "#f9fff9",
                      cursor: "pointer",
                      fontSize: "12px",
                      transition: "all 0.2s",
                      textAlign: "center",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#e6f7e6")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f9fff9")
                    }
                  >
                    <div style={{ fontWeight: "600", marginBottom: "4px" }}>{date}</div>
                    <div>
                      {time1} {time2}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {/* Step 4: Insurance selection */}
        {step === 4 && selectedSlot && (
          <div style={{ marginTop: "10px" }}>
            <strong>Insurance:</strong>
            <select
              value={selectedInsuranceId}
              onChange={(e) => setSelectedInsuranceId(e.target.value)}
              style={{
                width: "100%",
                marginTop: "6px",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            >
              <option value="">No insurance</option>
              {userInsurances.map((ins) => (
                <option key={ins._id} value={ins._id}>
                  {ins.provider} ({ins.coverageDetails})
                </option>
              ))}
            </select>
            <button
              onClick={confirmBooking}
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "10px",
                backgroundColor: "#4CAF50",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Confirm Appointment
            </button>
          </div>
        )}
        <button
          onClick={() => setIsListening((prev) => !prev)}
          style={{
            marginTop: "10px",
            padding: "8px 12px",
            backgroundColor: isListening ? "#e53935" : "#5f6fff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            width: "100%",
          }}
        >
          {isListening ? "Stop Listening" : "Start Listening"}
        </button>
        <form onSubmit={handleManualSubmit} style={{ marginTop: "10px" }}>
          <input
            type="text"
            placeholder='Type: "book an appointment with a pediatrician"'
            value={manualCommand}
            onChange={(e) => setManualCommand(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          />
        </form>
      </div>
      <div 
        hidden={!isOpen}
        onClick={handleOpenClose}
        style={{background: "radial-gradient(circle at 30% 30%, #c7d2fe, #6366f1)", width: "64px", height: "64px", bottom: "135px", right: "15px", cursor: "pointer"}}
        className="fixed z-10 flex flex-col items-center justify-center gap-1 p-3 text-white transform -translate-x-1/2 rounded-full shadow-lg"
      >
        <img src={mic_icon} className="w-8 h-8" style={{filter: "invert(1)"}} alt="Description" />
      </div>
    </section>
  );
};

export default VoiceAssistant;

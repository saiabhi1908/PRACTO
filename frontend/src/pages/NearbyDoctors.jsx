import React, { useEffect, useState } from "react";
import axios from "axios";

export default function NearbyDoctors({ userId }) {
  const [location, setLocation] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDateTime, setAppointmentDateTime] = useState("");
  const [message, setMessage] = useState("");

  // Get user geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("Unable to retrieve your location")
    );
  }, []);

  // Fetch nearby doctors when location is available
  useEffect(() => {
    if (!location) return;

    async function fetchDoctors() {
      try {
        const res = await axios.get("/api/doctors/nearby", {
          params: {
            lat: location.lat,
            lng: location.lng,
            radius: 10, // radius in km
          },
        });
        setDoctors(res.data);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    }
    fetchDoctors();
  }, [location]);

  async function handleBooking() {
    if (!selectedDoctor) {
      alert("Please select a doctor");
      return;
    }
    if (!appointmentDateTime) {
      alert("Please select appointment date and time");
      return;
    }

    try {
      const hospitalId = selectedDoctor.hospitalIds?.[0]?._id || null;
      if (!hospitalId) {
        alert("Selected doctor has no associated hospital");
        return;
      }

      const res = await axios.post("/api/appointments/book", {
        doctorId: selectedDoctor._id,
        userId,
        hospitalId,
        appointmentDateTime,
      });

      setMessage(res.data.message);
    } catch (error) {
      console.error("Booking failed:", error);
      setMessage("Booking failed, please try again");
    }
  }

  return (
    <div>
      <h2>Nearby Doctors</h2>

      {!location && <p>Fetching your location...</p>}

      {doctors.length === 0 && location && <p>No doctors found nearby.</p>}

      <ul>
        {doctors.map((doc) => (
          <li key={doc._id} style={{ marginBottom: "1rem" }}>
            <label>
              <input
                type="radio"
                name="doctor"
                onChange={() => setSelectedDoctor(doc)}
                checked={selectedDoctor?._id === doc._id}
              />{" "}
              <strong>{doc.name}</strong> <br />
              Specialization: {doc.specialization.join(", ")} <br />
              Hospital:{" "}
              {doc.hospitalIds && doc.hospitalIds.length > 0
                ? doc.hospitalIds.map((h) => h.name).join(", ")
                : "N/A"}
            </label>
          </li>
        ))}
      </ul>

      {selectedDoctor && (
        <div>
          <h3>Book Appointment with {selectedDoctor.name}</h3>
          <input
            type="datetime-local"
            value={appointmentDateTime}
            onChange={(e) => setAppointmentDateTime(e.target.value)}
          />
          <button onClick={handleBooking}>Book Appointment</button>
        </div>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}

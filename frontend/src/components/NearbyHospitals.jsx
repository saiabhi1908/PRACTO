import React, { useEffect, useState } from "react";
import axios from "axios";

const NearbyHospitals = ({ lat, lng }) => {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    if (lat && lng) {
      axios
        .get(`http://localhost:4000/api/places/nearby?lat=${lat}&lng=${lng}`)
        .then((response) => setPlaces(response.data.results))
        .catch((error) => console.error("Error fetching places:", error));
    }
  }, [lat, lng]);

  return (
    <div style={styles.hospitalsContainer}>
      <h2 style={styles.title}>Nearby Hospitals</h2>
      <div style={styles.hospitalList}>
        {places.length > 0 ? (
          places.map((place) => (
            <a
              key={place.place_id}
              href={
                place.website ||
                `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <div style={styles.hospitalCard}>
                <h3 style={styles.hospitalName}>{place.name}</h3>
                <p style={styles.hospitalVicinity}>{place.vicinity}</p>
                <p style={styles.hospitalRating}>
                  ⭐ {place.rating || "N/A"}
                </p>
              </div>
            </a>
          ))
        ) : (
          <p>No hospitals found nearby.</p>
        )}
      </div>
    </div>
  );
};

// Styles as JS objects
const styles = {
  hospitalsContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "'Times New Roman', serif",
    color: "#333",
  },
  title: {
    textAlign: "center",
    fontSize: "1.5rem",
    color: "#333",
    marginBottom: "20px",
    fontWeight: "500",
  },
  hospitalList: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    marginTop: "20px",
  },
  hospitalCard: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "8px",
    boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease",
    cursor: "pointer",
    textAlign: "center",
  },
  hospitalName: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#007BFF",
    marginBottom: "6px",
    lineHeight: "1.3",
  },
  hospitalVicinity: {
    fontSize: "0.85rem",
    color: "#555",
    marginBottom: "6px",
  },
  hospitalRating: {
    fontSize: "0.9rem",
    color: "#FFB400",
    fontWeight: "500",
  },
};

export default NearbyHospitals;

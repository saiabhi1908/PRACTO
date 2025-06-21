import express from 'express';
import {
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  doctorList,
  changeAvailablity,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
} from '../controllers/doctorController.js';
import authDoctor from '../middleware/authDoctor.js';
import Doctor from '../models/doctorModel.js';

const doctorRouter = express.Router();

doctorRouter.post("/login", loginDoctor);
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel);
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor);
doctorRouter.get("/list", doctorList);
doctorRouter.post("/change-availability", authDoctor, changeAvailablity);
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete);
doctorRouter.get("/dashboard", authDoctor, doctorDashboard);
doctorRouter.get("/profile", authDoctor, doctorProfile);
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile);

// Seed sample doctors (only use in development/test)
doctorRouter.post("/seed", async (req, res) => {
  const sampleDoctors = [
    {
      name: "Dr. Alice Smith",
      specialization: "Cardiologist",
      hospital: "City Heart Hospital",
      address: { location: { type: "Point", coordinates: [77.5946, 12.9716] } },
      languages: ["English"]
    },
    {
      name: "Dr. Raj Patel",
      specialization: "Dermatologist",
      hospital: "Skin Health Clinic",
      address: { location: { type: "Point", coordinates: [77.6000, 12.9800] } },
      languages: ["Hindi"]
    },
    {
      name: "Dr. Maria Gomez",
      specialization: "Pediatrician",
      hospital: "Happy Kids Hospital",
      address: { location: { type: "Point", coordinates: [77.6100, 12.9600] } },
      languages: ["Spanish"]
    }
  ];

  await Doctor.deleteMany({});
  await Doctor.insertMany(sampleDoctors);

  res.json({ message: "Sample doctors seeded successfully." });
});

// Get doctors by language
doctorRouter.get("/by-language", async (req, res) => {
  const { language } = req.query;
  if (!language) return res.status(400).json({ message: "Language parameter is required" });

  try {
    const doctors = await Doctor.find({ languages: { $in: [language] } });
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors by language:", error);
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

// Get nearby doctors
doctorRouter.get("/nearby", async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) return res.status(400).send("Missing lat/lng");

    const radiusInMeters = (radius ? Number(radius) : 10) * 1000;

    const doctors = await Doctor.find({
      "address.location": {
        $geoWithin: {
          $centerSphere: [[Number(lng), Number(lat)], radiusInMeters / 6378137]
        }
      }
    }).select("-password");

    res.json(doctors);
  } catch (error) {
    console.error("Error fetching nearby doctors:", error);
    res.status(500).send("Server error");
  }
});

export default doctorRouter;

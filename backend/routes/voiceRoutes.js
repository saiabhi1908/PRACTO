import express from "express";
import authUser from "../middleware/authUser.js";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import Review from "../models/reviewModel.js"; // ✅ Import Review model

const router = express.Router();

/**
 * Step 1: Get doctors by speciality with dynamic ratings
 */
router.get("/doctors", authUser, async (req, res) => {
  try {
    const { speciality } = req.query;
    if (!speciality) {
      return res.json({ success: false, message: "Speciality is required" });
    }

    const doctors = await doctorModel.find({
      speciality: new RegExp(speciality, "i"),
    });

    if (!doctors.length) {
      return res.json({
        success: false,
        message: `No doctors found for ${speciality}`,
      });
    }

    // ✅ Calculate average ratings from Review collection
    const doctorsWithRatings = await Promise.all(
      doctors.map(async (doc) => {
        const reviews = await Review.find({ doctor: doc._id });
        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return {
          id: doc._id,
          name: doc.name,
          speciality: doc.speciality,
          fees: doc.fees || doc.fee,
          rating: avgRating,
          reviewsCount: reviews.length,
        };
      })
    );

    return res.json({
      success: true,
      doctors: doctorsWithRatings,
    });
  } catch (err) {
    console.error("Error fetching doctors:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Step 2: Book appointment by doctor name or ID
 */
router.post("/book-appointment", authUser, async (req, res) => {
  try {
    const { doctorName, doctorId, slotDate, slotTime, userId } = req.body;

    let doctor = null;
    if (doctorId) {
      doctor = await doctorModel.findById(doctorId);
    } else if (doctorName) {
      doctor = await doctorModel.findOne({ name: new RegExp(doctorName, "i") });
    }

    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    if (doctor.slots_booked[slotDate]?.includes(slotTime)) {
      return res.json({ success: false, message: "That slot is already booked" });
    }

    const appointment = await appointmentModel.create({
      userId,
      docId: doctor._id,
      slotDate,
      slotTime,
      userData: {},
      docData: doctor,
      amount: doctor.fees || doctor.fee || 0,
      date: Date.now(),
    });

    if (!doctor.slots_booked[slotDate]) doctor.slots_booked[slotDate] = [];
    doctor.slots_booked[slotDate].push(slotTime);
    await doctor.save();

    return res.json({
      success: true,
      message: `✅ Appointment confirmed with Dr. ${doctor.name} on ${slotDate} at ${slotTime}`,
      appointment,
    });
  } catch (err) {
    console.error("Voice booking failed:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Step 3: Get available slots for a doctor (today + next 7 days)
 */
router.get("/slots/:doctorId", authUser, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await doctorModel.findById(doctorId);

    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    const dailySlots = doctor.available_slots || [
      "10:00 AM",
      "11:00 AM",
      "12:00 PM",
      "02:00 PM",
      "04:00 PM",
      "06:00 PM",
    ];

    const formatDate = (d) => d.toLocaleDateString("en-GB").replace(/\//g, "_");

    const available = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(today);
      dateObj.setDate(today.getDate() + i);
      const dateKey = formatDate(dateObj);

      const booked = doctor.slots_booked?.[dateKey] || [];

      for (const time of dailySlots) {
        const slotDateTime = new Date(`${dateObj.toDateString()} ${time}`);
        if (i === 0 && slotDateTime < new Date()) continue;
        if (!booked.includes(time)) available.push(`${dateKey} ${time}`);
      }
    }

    res.json({ success: true, available });
  } catch (err) {
    console.error("Error fetching slots:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;

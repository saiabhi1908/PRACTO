import express from "express";
import Appointment from "../models/appointmentModel.js";
import { bookAppointment } from "../controllers/doctorController.js";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";

const appointmentRouter = express.Router();

// Simple authentication middleware for /book route
const authenticate = (req, res, next) => {
  if (!req.body.userId) {
    return res.status(401).json({ error: "Unauthorized. Missing userId." });
  }
  next();
};

/**
 * @route   POST /
 * @desc    Book an appointment via voice assistant or frontend form (no auth)
 * @access  Public
 *
 * ⚠️ Note: Because this router will be mounted at /api/appointments
 * in server.js, the final path becomes:
 * POST /api/appointments
 */
appointmentRouter.post("/", async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;

    console.log("📥 Incoming appointment booking:", req.body);

    // Validate required fields
    if (!userId || !docId || !slotDate || !slotTime) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, docId, slotDate, slotTime.",
      });
    }

    // Fetch user & doctor from DB
    const user = await userModel.findById(userId).select("-password");
    const doc = await doctorModel.findById(docId).select("-password");

    if (!user || !doc) {
      return res
        .status(404)
        .json({ success: false, error: "User or Doctor not found." });
    }

    // Parse date and time
    const [day, month, year] = slotDate.split("_").map(Number);
    let [timePart, meridian] = slotTime.split(" ");
    if (!meridian) meridian = "AM"; // fallback
    let [hours, minutes] = timePart.split(":").map(Number);
    if (meridian.toLowerCase() === "pm" && hours !== 12) hours += 12;
    if (meridian.toLowerCase() === "am" && hours === 12) hours = 0;

    const appointmentDateObj = new Date(
      year,
      month - 1,
      day,
      hours,
      minutes || 0,
      0
    );

    // Build appointment
    const appointment = new Appointment({
      userId: user._id.toString(),
      docId: doc._id.toString(),
      userData: user.toObject(), // includes image
      docData: { ...doc.toObject(), slots_booked: undefined },
      slotDate,
      slotTime,
      date: appointmentDateObj.getTime(), // store as number
      amount: Number(doc.fees || doc.fee || 0),
    });

    await appointment.save();

    console.log("✅ Appointment saved successfully:", appointment);
    return res
      .status(201)
      .json({ success: true, message: "Appointment Booked", appointment });
  } catch (error) {
    console.error("❌ Error booking appointment:", error);
    return res
      .status(500)
      .json({ success: false, error: error.message || "Server error" });
  }
});

/**
 * @route   POST /book
 * @desc    Book appointment with authentication & controller logic
 * @access  Protected (requires userId in body)
 *
 * Final path = /api/appointments/book
 */
appointmentRouter.post("/book", authenticate, bookAppointment);

export default appointmentRouter;

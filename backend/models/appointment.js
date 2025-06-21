// models/appointment.js
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
  appointmentDateTime: { type: Date, required: true },
  status: { type: String, default: "booked" },
});

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;

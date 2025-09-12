// models/doctor.js
import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  name: String,
  specialization: [String],
  hospitalIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hospital" }],
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number], // [lng, lat]
  },
  acceptedInsurances: {
    type: [String],
    default: [],
  },
  // ⭐ New rating field
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
});

doctorSchema.index({ location: "2dsphere" });

const Doctor = mongoose.model("Doctor", doctorSchema);
export default Doctor;

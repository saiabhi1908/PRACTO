// models/hospital.js
import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema({
  name: String,
  address: String,
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number], // [lng, lat]
  },
});
hospitalSchema.index({ location: "2dsphere" });

const Hospital = mongoose.model("Hospital", hospitalSchema);
export default Hospital;

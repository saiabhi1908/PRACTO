import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" }, // [lng, lat]
  }
});

const hospitalModel = mongoose.models.hospital || mongoose.model("hospital", hospitalSchema);
export default hospitalModel;

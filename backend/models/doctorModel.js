// models/doctorModel.js
import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // ✅ ensure every doctor has an image (with default)
    image: { type: String, default: "/default-doctor.png" },

    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },

    fees: { type: Number },
    fee: { type: Number }, // optional, remove if unused

    slots_booked: { type: Object, default: {} },
    address: { type: Object, required: true },
    date: { type: Number, required: true },

    acceptedInsurances: {
      type: [String],
      default: [],
    },

    languagesKnown: {
      type: [String],
      default: [],
    },

    hospitals: [
      {
        hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "hospital" },
        name: { type: String, required: true },
        address: { type: String },
      },
    ],

    // ⭐ Reviews array to store ratings & comments from patients
    reviews: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 0, max: 5 },
        comment: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { minimize: false }
);

// We calculate rating dynamically via aggregation in routes if needed
const doctorModel =
  mongoose.models.doctor || mongoose.model("doctor", doctorSchema);

export default doctorModel;

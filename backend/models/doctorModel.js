import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String, required: true },
  speciality: { type: String, required: true },
  degree: { type: String, required: true },
  experience: { type: String, required: true },
  about: { type: String, required: true },
  available: { type: Boolean, default: true },

  // ✅ Support both fields
  fees: { type: Number },
  fee: { type: Number },

  slots_booked: { type: Object, default: {} },
  address: { type: Object, required: true },
  date: { type: Number, required: true },

  acceptedInsurances: {
    type: [String],
    default: []
  },

  languages: { type: [String], default: [] },

  hospitals: [
    {
      hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "hospital" },
      name: { type: String, required: true },
      address: { type: String }
    }
  ]
}, { minimize: false });

const doctorModel = mongoose.models.doctor || mongoose.model("doctor", doctorSchema);
export default doctorModel;

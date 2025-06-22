import mongoose from "mongoose";

const symptomHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  symptoms: String,
  diagnosis: String,
  date: { type: Date, default: Date.now }
});

export default mongoose.model("SymptomHistory", symptomHistorySchema);

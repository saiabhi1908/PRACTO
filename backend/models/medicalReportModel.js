import mongoose from "mongoose";

const medicalReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  reportName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },

  // 🆕 Structured chart data
  chartData: {
    bloodPressure: [
      {
        date: { type: String, required: true },
        systolic: { type: Number, required: true },
        diastolic: { type: Number, required: true }
      }
    ],
    glucoseLevels: [
      {
        date: { type: String, required: true },
        value: { type: Number, required: true }
      }
    ],
    thyroidLevels: [ // 🆕 Add this block
      {
        date: { type: String, required: true },
        tsh: { type: Number, required: true },
      },
    ],
    heartRate: [
      {
        date: { type: String, required: true },
        bpm: { type: Number, required: true }
      }
    ]
  }
});

const medicalReportModel =
  mongoose.models.medicalReport || mongoose.model("medicalReport", medicalReportSchema);

export default medicalReportModel;

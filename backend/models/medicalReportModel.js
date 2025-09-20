import mongoose from "mongoose";

const medicalReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  reportName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },

  // ✅ Differentiate prescriptions vs. test reports
  type: { type: String, enum: ["prescription", "test"], required: true },

  // ✅ AI validation results (only meaningful for prescriptions)
  aiValidation: {
    status: {
      type: String,
      enum: ["pending", "safe", "warning", "danger"],
      default: "pending"
    },
    issues: [{ type: String }]
  },

  // ✅ Structured chart data (only meaningful for test reports)
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
    thyroidLevels: [
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

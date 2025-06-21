import medicalReportModel from "../models/medicalReportModel.js";
import { v2 as cloudinary } from "cloudinary";

// ✅ UPDATED: Upload Medical Report with chartData support
export const uploadMedicalReport = async (req, res) => {
  try {
    const { userId, chartData } = req.body;
    const file = req.file;

    if (!file || !userId) {
      return res.json({ success: false, message: "Missing file or userId" });
    }

    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto",                // auto detects type
      type: "upload",                       // ensure it's public delivery
      access_mode: "public",                // ensure visibility
      folder: "medical-reports",            // optional: keeps files organized
      use_filename: true,                   // use original file name
      unique_filename: false                // don't add random ID suffix
    });

    // ✅ Parse chartData if provided
    const parsedChartData = chartData ? JSON.parse(chartData) : undefined;

    const report = new medicalReportModel({
      userId,
      reportName: file.originalname,
      fileUrl: result.secure_url,
      chartData: parsedChartData
    });

    await report.save();
    res.status(201).json({ success: true, message: "Report uploaded", report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ UNCHANGED: Fetch reports for a specific user
export const getUserReports = async (req, res) => {
  try {
    const { userId } = req.body;
    const reports = await medicalReportModel.find({ userId }).sort({ uploadedAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

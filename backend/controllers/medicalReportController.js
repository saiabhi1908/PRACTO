import axios from 'axios'; // 🆕 Required to download original file
import medicalReportModel from "../models/medicalReportModel.js";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";
import sendEmail from "../utils/emailService.js";
import { getReportHTML } from "../utils/reportTemplate.js";
import { generateReportPDF } from "../utils/generateReportPDF.js";

// ✅ Upload Medical Report with chart images and double attachment email
export const uploadMedicalReport = async (req, res) => {
  try {
    const { userId, chartData, chartImages } = req.body;
    const file = req.file;

    if (!file || !userId) {
      return res.status(400).json({ success: false, message: "Missing file or userId" });
    }

    // ✅ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto",
      type: "upload",
      access_mode: "public",
      folder: "medical-reports",
      use_filename: true,
      unique_filename: false
    });

    // ✅ Parse chart data
    const parsedChartData = chartData ? JSON.parse(chartData) : {};
    const parsedChartImages = chartImages ? JSON.parse(chartImages) : {};

    // ✅ Save to DB
    const report = new medicalReportModel({
      userId,
      reportName: file.originalname,
      fileUrl: result.secure_url,
      chartData: parsedChartData
    });

    await report.save();

    // ✅ Email notification
    const user = await userModel.findById(userId);
    if (user?.email) {
      const subject = '📄 New Medical Report Uploaded';
      const message = `Hi ${user.name || 'User'},\n\nYour new report "${file.originalname}" has been uploaded. Please find the attached PDF and your original report file. \n Also you can view the same in your website login under My reports dropdown.\n\n If you don't find any reports in your login, report this mail as fraud or spam.\n\nThank you,\nPrescripta HealthCare`;

      // Generate PDF
      const htmlContent = getReportHTML(user, report, parsedChartData, parsedChartImages);
      const pdfBuffer = await generateReportPDF(htmlContent);

      // Download original file from Cloudinary
      const response = await axios.get(result.secure_url, { responseType: 'arraybuffer' });
      const originalFileBuffer = response.data;

      // Send email with 2 attachments
      await sendEmail(
        user.email,
        subject,
        message,
        pdfBuffer,
        `${file.originalname.replace(/\.[^/.]+$/, '')}.pdf`,
        {
          buffer: originalFileBuffer,
          filename: file.originalname
        }
      );

      console.log(`📧 Report email sent to ${user.email}`);
    }

    res.status(201).json({ success: true, message: "Report uploaded", report });

  } catch (err) {
    console.error("❌ Upload failed:", err.message);
    res.status(500).json({ success: false, message: "Server error. Upload failed." });
  }
};

// ✅ Fetch user-specific reports
export const getUserReports = async (req, res) => {
  try {
    const { userId } = req.body;
    const reports = await medicalReportModel.find({ userId }).sort({ uploadedAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

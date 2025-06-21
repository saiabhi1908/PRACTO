import express from "express";
import upload from "../middleware/multer.js";
import authAdmin from "../middleware/authAdmin.js";
import authUser from "../middleware/authUser.js";
import { uploadMedicalReport, getUserReports } from "../controllers/medicalReportController.js";

const router = express.Router();

// Admin uploads report for a user
router.post("/upload", authAdmin, upload.single("report"), uploadMedicalReport);

// User views their own reports
router.get("/user", authUser, getUserReports);

export default router;

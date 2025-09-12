// backend/routes/reviewRoutes.js
import express from "express";
import { addReview, getDoctorReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/add", protect, addReview);         // Protected route
router.get("/:doctorId", getDoctorReviews);      // Public route

export default router;

import express from "express";
import { checkSymptoms } from "../controllers/symptomCheckerController.js";

const router = express.Router();
router.post("/", checkSymptoms);
export default router;

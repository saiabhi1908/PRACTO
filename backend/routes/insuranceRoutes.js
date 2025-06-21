import express from 'express';
import {
  addInsurance,
  getUserInsurance,
  updateInsurance,
  deleteInsurance
} from '../controllers/insuranceController.js';
import { protect } from '../middleware/authMiddleware.js'; // already used in your app

const router = express.Router();

// Protected routes
router.post('/', protect, addInsurance);                // Add insurance
router.get('/', protect, getUserInsurance);             // Get all user insurances
router.put('/:id', protect, updateInsurance);           // Update insurance by ID
router.delete('/:id', protect, deleteInsurance);        // Delete insurance by ID

export default router;

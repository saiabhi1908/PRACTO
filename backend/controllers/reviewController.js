// backend/controllers/reviewController.js
import Review from "../models/reviewModel.js";
import Doctor from "../models/doctorModel.js";

// Add a new review
export const addReview = async (req, res) => {
  try {
    const { doctorId, rating, comment } = req.body;

    if (!doctorId || !rating) {
      return res.status(400).json({ success: false, message: "Doctor and rating are required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const review = await Review.create({
      user: req.user.id,
      doctor: doctorId,
      rating,
      comment,
    });

    res.status(201).json({ success: true, message: "Review submitted successfully", review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all reviews for a doctor
export const getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const reviews = await Review.find({ doctor: doctorId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import Insurance from "../models/Insurance.js"; // ✅ Insurance model

// ✅ Book appointment (Insurance Mandatory with Discounted Fees)
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime, userData, insuranceId } = req.body;

    // ✅ Enforce insurance selection
    if (!insuranceId) {
      return res.json({ success: false, message: 'Insurance selection is required to book an appointment' });
    }

    // ✅ Fetch insurance details
    const insuranceData = await Insurance.findById(insuranceId);
    if (!insuranceData) {
      return res.json({ success: false, message: 'Invalid insurance selected' });
    }

    // ✅ Fetch doctor
    const doctor = await doctorModel.findById(docId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // ✅ Calculate discounted fee
    let finalFee = doctor.fees;
    if (insuranceData.coverageDetails?.toLowerCase().includes("full")) {
      finalFee = 0;
    } else {
      finalFee = doctor.fees * 0.10; // 5% discount for partial coverage
    }

    // ✅ Convert date + time to timestamp
    const timestamp = new Date(`${slotDate}T${slotTime}`).getTime();

    // ✅ Create appointment
    const appointment = new appointmentModel({
      userId,
      docId,
      userData,
      docData: doctor,
      amount: finalFee,
      slotTime,
      slotDate,
      date: timestamp,
      insurance: insuranceData,
    });

    await appointment.save();
    res.status(201).json({ message: "Appointment booked successfully!" });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ error: "Failed to book appointment" });
  }
};

// Doctor login controller
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await doctorModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get appointments for doctor
const appointmentsDoctor = async (req, res) => {
  try {
    const { docId } = req.body;
    const appointments = await appointmentModel.find({ docId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Cancel appointment
const appointmentCancel = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (appointmentData && appointmentData.docId.toString() === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
      return res.json({ success: true, message: 'Appointment Cancelled' });
    }

    res.json({ success: false, message: 'Appointment cancellation failed' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Mark appointment completed
const appointmentComplete = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (appointmentData && appointmentData.docId.toString() === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
      return res.json({ success: true, message: 'Appointment Completed' });
    }

    res.json({ success: false, message: 'Marking appointment as completed failed' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// UPDATED doctorList to support insuranceProvider query param filtering
const doctorList = async (req, res) => {
  try {
    const { insuranceProvider } = req.query;

    const query = insuranceProvider
      ? { acceptedInsurances: insuranceProvider }
      : {};

    const doctors = await doctorModel.find(query).select(['-password', '-email']);
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Change doctor's availability
const changeAvailablity = async (req, res) => {
  try {
    const { docId } = req.body;

    const docData = await doctorModel.findById(docId);
    await doctorModel.findByIdAndUpdate(docId, { available: !docData.available });
    res.json({ success: true, message: 'Availability Changed' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get doctor's profile
const doctorProfile = async (req, res) => {
  try {
    const { docId } = req.body;
    const profileData = await doctorModel.findById(docId).select('-password');
    res.json({ success: true, profileData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Update doctor's profile
const updateDoctorProfile = async (req, res) => {
  try {
    const { docId, fees, address, available } = req.body;

    await doctorModel.findByIdAndUpdate(docId, { fees, address, available });
    res.json({ success: true, message: 'Profile Updated' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Doctor dashboard stats
const doctorDashboard = async (req, res) => {
  try {
    const { docId } = req.body;
    const appointments = await appointmentModel.find({ docId });

    let earnings = 0;
    appointments.forEach(item => {
      if (item.isCompleted || item.payment) earnings += item.amount || 0;
    });

    let patients = [...new Set(appointments.map(item => item.userId.toString()))];

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse()
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  doctorList,         // UPDATED export
  changeAvailablity,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  bookAppointment,    // Updated export
};

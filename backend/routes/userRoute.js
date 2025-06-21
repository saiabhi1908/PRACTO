import express from 'express';
import { 
    loginUser, 
    registerUser, 
    getProfile, 
    updateProfile, 
    bookAppointment, 
    listAppointment, 
    cancelAppointment, 
    paymentStripe, 
    verifyStripe,
    sendOTP,
    sendResetOTP,
    verifyOtp,
    getAppointmentById,
    verifyResetOTP,
    resetPassword
} from '../controllers/userController.js';

import upload from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const userRouter = express.Router();

// Auth routes
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

// Profile routes
userRouter.get("/get-profile", authUser, getProfile);
userRouter.put("/update-profile", upload.single('image'), authUser, updateProfile);
userRouter.get('/get-appointment/:id', authUser, getAppointmentById);

// Appointment routes
userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post("/cancel-appointment", authUser, cancelAppointment);

// Payment routes
userRouter.post("/payment-stripe", authUser, paymentStripe);
userRouter.post("/verify-stripe", authUser, verifyStripe);

// OTP routes
userRouter.post('/send-otp', sendOTP);               // Registration OTP
userRouter.post('/send-reset-otp', sendResetOTP);    // Password reset OTP
userRouter.post('/verify-otp', verifyOtp);           // Registration OTP verification
userRouter.post('/verify-reset-otp', verifyResetOTP);// Password reset OTP verification
userRouter.post('/reset-password', resetPassword);   // Password reset

// Two-Factor Authentication (2FA) routes
userRouter.post('/generate-2fa', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const secret = speakeasy.generateSecret({ name: `HealthApp (${email})` });
    user.twoFactorSecret = secret.base32;
    await user.save();

    QRCode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
        if (err) return res.status(500).json({ message: 'QR generation failed' });
        res.json({ qrCode: dataUrl });
    });
});

userRouter.post('/verify-2fa', async (req, res) => {
    const { email, token } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.twoFactorSecret) {
        return res.status(400).json({ message: '2FA not set up' });
    }

    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 1,
    });

    if (verified) {
        user.twoFactorEnabled = true;
        await user.save();
        const jwt = generateToken(user._id);
        return res.json({ success: true, token: jwt });
    }

    res.status(400).json({ message: 'Invalid 2FA code' });
});

// Test route
userRouter.get('/test', (req, res) => {
    res.send('✅ /api/user/test is working!');
});

export default userRouter;

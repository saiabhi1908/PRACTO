import jwt from "jsonwebtoken";

export const generateToken = async (req, res) => {
  try {
    const { room_id, user_id, role } = req.body;

    if (!room_id || !user_id || !role) {
      return res.status(400).json({ success: false, message: "Missing parameters" });
    }

    const payload = {
      access_key: process.env.HMS_ACCESS_KEY,
      room_id,
      user_id,
      role,
      type: "app",
      version: 2,
    };

    const token = jwt.sign(payload, process.env.HMS_SECRET, {
      algorithm: "HS256",
      expiresIn: "1h",
      jwtid: Date.now().toString(), // ✅ adds jti
    });

    return res.json({ success: true, token });
  } catch (err) {
    console.error("Error generating token", err);
    return res.status(500).json({ success: false, message: "Token generation failed" });
  }
};

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

function generate100msToken(room_id, user_id, role = "viewer") {
  const payload = {
    access_key: process.env.HMS_APP_ACCESS_KEY,
    type: "app",
    version: 2,
    role,
    room_id,
    user_id,
    jti: uuidv4(),
  };

  return jwt.sign(payload, process.env.HMS_APP_SECRET);
}

router.post("/generate-token", (req, res) => {
  const { room_id, user_id, role } = req.body;

  if (!room_id || !user_id) {
    return res.status(400).json({ error: "room_id and user_id are required" });
  }

  if (!["broadcaster", "viewer", "viewer-on-stage"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const token = generate100msToken(room_id, user_id, role || "viewer");
    return res.json({ token });
  } catch (err) {
    console.error("Error generating token:", err);
    return res.status(500).json({ error: "Failed to generate token" });
  }
});

module.exports = router;

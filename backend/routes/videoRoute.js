import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const router = express.Router();

router.post("/generate-token", (req, res) => {
  const { room_id, user_id, role = "viewer" } = req.body;

  if (!room_id || !user_id) {
    return res.status(400).json({ error: "room_id and user_id are required" });
  }

  if (!["broadcaster", "viewer", "viewer-on-stage"].includes(role)) {
    return res.status(400).json({ error: "Invalid role provided" });
  }

  const payload = {
    access_key: process.env.HMS_APP_ACCESS_KEY,
    type: "app",
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // valid for 24h
    room_id,
    role,
    user_id,
    jti: uuidv4(),
  };

  try {
    const token = jwt.sign(payload, process.env.HMS_APP_SECRET, {
      algorithm: "HS256",
    });
    return res.json({ token });
  } catch (err) {
    console.error("❌ Failed to sign token:", err);
    return res.status(500).json({ error: "Failed to generate token" });
  }
});

export default router;

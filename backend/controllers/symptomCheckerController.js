import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const checkSymptoms = async (req, res) => {
  try {
    const { symptoms, userId } = req.body;

    if (!symptoms || typeof symptoms !== "string" || !symptoms.trim()) {
      return res.status(400).json({ success: false, message: "Valid symptoms are required." });
    }

    const prompt = `A patient reports: ${symptoms.trim()}. Based on this, what are the most likely conditions and your recommendations as a virtual health assistant?`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173/",
          "Content-Type": "application/json",
        },
      }
    );

    const diagnosis = response?.data?.choices?.[0]?.message?.content?.trim() || "No diagnosis available.";

    res.json({ success: true, diagnosis });

  } catch (error) {
    console.error("Symptom checker error (OpenRouter):", error?.response?.data || error.message);
    res.status(500).json({ success: false, message: "Failed to fetch diagnosis from AI." });
  }
};

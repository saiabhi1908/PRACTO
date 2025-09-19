// controllers/symptomCheckerController.js
import axios from "axios";
import dotenv from "dotenv";
import Doctor from "../models/Doctor.js"; // adjust path to your Doctor mongoose model

dotenv.config();

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "mistralai/mixtral-8x7b-instruct";
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173/";

function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    // try to locate JSON inside text (common if LLM adds commentary)
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

export const checkSymptoms = async (req, res) => {
  try {
    const { symptoms, userId } = req.body;

    if (!symptoms || typeof symptoms !== "string" || !symptoms.trim()) {
      return res.status(400).json({ success: false, message: "Valid symptoms are required." });
    }

    // Ask LLM to respond in JSON only for reliable parsing
    const prompt = `
You are a clinical-level virtual health assistant (non-diagnostic advisor). A patient reports the following symptoms: "${symptoms.trim()}".

Return a JSON object ONLY (no extra commentary) with this schema:
{
  "conditions": ["Most likely condition 1", "condition 2", ...],
  "confidence": ["high"|"moderate"|"low", ...] (same length as conditions),
  "recommendations": ["Immediate advice / triage (e.g. see ER)", "next steps", ...],
  "specializations": ["pediatrics", "general physician", "cardiology", ...] (specialties to consult)
}

Keep arrays short (3 items max each). Use plain words for specializations that match common doctor.specialization values in the DB.
`;

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": FRONTEND,
          "Content-Type": "application/json",
        },
      }
    );

    const raw = response?.data?.choices?.[0]?.message?.content?.trim() || "";

    // Try to parse JSON from model output
    let parsed = safeParseJSON(raw);

    // If parsing fails, fallback to returning raw text
    if (!parsed) {
      console.warn("Failed to parse model JSON, returning raw text diagnosis");
      return res.json({
        success: true,
        diagnosisText: raw,
      });
    }

    // parsed should have specializations array
    const { conditions = [], confidence = [], recommendations = [], specializations = [] } = parsed;

    // Query doctors collection for matching specializations (limit 6)
    const uniqueSpecializations = Array.from(new Set(specializations.map(s => s.toLowerCase()))).slice(0, 4);

    let suggestedDoctors = [];
    if (uniqueSpecializations.length > 0) {
      // build a case-insensitive regex OR query for specialization matching
      const orQuery = uniqueSpecializations.map(spec => ({ specialization: { $regex: `^${spec}`, $options: "i" } }));
      suggestedDoctors = await Doctor.find({ $or: orQuery })
        .select("name specialization rating reviewsCount profileImage location") // adjust fields
        .sort({ rating: -1, reviewsCount: -1 })
        .limit(6)
        .lean();
    }

    res.json({
      success: true,
      ai: { conditions, confidence, recommendations, specializations },
      suggestedDoctors,
    });
  } catch (error) {
    console.error("Symptom checker error (OpenRouter):", error?.response?.data || error.message);
    res.status(500).json({ success: false, message: "Failed to fetch diagnosis from AI." });
  }
};

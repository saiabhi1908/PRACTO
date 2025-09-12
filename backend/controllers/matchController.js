// controllers/matchController.js
import axios from "axios";

export const matchDoctors = async (req, res) => {
  try {
    const { query, preferences } = req.body;

    // Call Python ML microservice
    const resp = await axios.post(
      process.env.ML_SERVICE_URL + "/match",
      { query, preferences, top_k: 10 }
    );

    return res.json(resp.data);
  } catch (err) {
    console.error("Match error:", err.message);
    return res.status(500).json({ error: "Doctor matching failed" });
  }
};

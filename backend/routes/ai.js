const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ── Helper: get Gemini model instance ─────────────────────────────────────
const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "AIzaSy_your_key_here" || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY is not set in your .env file. Get a free key at aistudio.google.com");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
};

// ── Helper: extract JSON from Gemini response ──────────────────────────────
const extractJSON = (text) => {
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace  = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new SyntaxError("No JSON object found in response");
  }
  cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  return JSON.parse(cleaned);
};

// ── Helper: language instruction for Gemini ────────────────────────────────
const getLangInstruction = (language) => {
  if (language === "hi") return "IMPORTANT: Respond with all text fields in Hindi (Devanagari script). Only use English for technical terms like crop names, chemical names, and units.";
  if (language === "mr") return "IMPORTANT: Respond with all text fields in Marathi (Devanagari script). Only use English for technical terms like crop names, chemical names, and units.";
  return "Respond in English.";
};

// ─── POST /api/ai/crop-advice ──────────────────────────────────────────────
router.post("/crop-advice", protect, async (req, res) => {
  try {
    const { soilType, season, location, currentCrop, language } = req.body;
    if (!soilType || !season) {
      return res.status(400).json({ message: "soilType and season are required." });
    }

    const model = getModel();
    const langInstruction = getLangInstruction(language);

    const prompt = `You are an expert agricultural advisor for Indian farmers in Uttar Pradesh and Maharashtra.
${langInstruction}

Farmer details:
- Soil Type: ${soilType}
- Season: ${season}
- Location: ${location || "Uttar Pradesh, India"}
- Last Crop: ${currentCrop || "Not specified"}

Respond with ONLY a valid JSON object, no other text, no markdown, no explanation:
{
  "recommendedCrops": [
    { "name": "string", "reason": "string", "expectedYield": "string", "marketPrice": "string" }
  ],
  "fertilizers": [
    { "name": "string", "quantity": "string", "timing": "string" }
  ],
  "pesticides": [
    { "name": "string", "use": "string", "timing": "string" }
  ],
  "equipment": ["string"],
  "irrigationAdvice": "string",
  "harvestTime": "string",
  "warnings": ["string"]
}`;

    const result  = await model.generateContent(prompt);
    const text    = result.response.text().trim();
    const parsed  = extractJSON(text);

    res.json({ advice: parsed });

  } catch (err) {
    console.error("Crop advice error:", err.message);
    if (err.message.includes("GEMINI_API_KEY")) return res.status(500).json({ message: err.message });
    if (err.message.includes("API_KEY_INVALID") || err.message.includes("401")) return res.status(500).json({ message: "Invalid Gemini API key. Please check your .env file." });
    if (err.message.includes("429") || err.message.includes("quota")) return res.status(429).json({ message: "Gemini API quota exceeded. Please wait a moment and try again." });
    if (err instanceof SyntaxError) return res.status(500).json({ message: "AI returned an unexpected format. Please try again." });
    res.status(500).json({ message: "AI service error: " + err.message });
  }
});

// ─── POST /api/ai/disease-detect ──────────────────────────────────────────
router.post("/disease-detect", protect, async (req, res) => {
  try {
    const { imageBase64, mimeType, cropName, language } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ message: "imageBase64 is required." });
    }

    const model = getModel();
    const langInstruction = getLangInstruction(language);

    const prompt = `You are an expert plant pathologist for Indian crops.
${langInstruction}
Analyze this crop image${cropName ? ` of ${cropName}` : ""}.
Respond with ONLY a valid JSON object, no other text, no markdown:
{
  "cropIdentified": "string",
  "healthStatus": "Healthy | Diseased | Pest Attack | Nutrient Deficiency",
  "issues": [
    { "name": "string", "severity": "Low | Medium | High", "description": "string" }
  ],
  "treatments": [
    { "type": "string", "name": "string", "dosage": "string", "instructions": "string" }
  ],
  "preventionTips": ["string"],
  "urgency": "Immediate action needed | Monitor closely | No action needed"
}`;

    const rawBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const imagePart = { inlineData: { data: rawBase64, mimeType: mimeType || "image/jpeg" } };

    const result  = await model.generateContent([prompt, imagePart]);
    const text    = result.response.text().trim();
    const parsed  = extractJSON(text);

    res.json({ analysis: parsed });

  } catch (err) {
    console.error("Disease detect error:", err.message);
    if (err.message.includes("GEMINI_API_KEY")) return res.status(500).json({ message: err.message });
    if (err.message.includes("API_KEY_INVALID") || err.message.includes("401")) return res.status(500).json({ message: "Invalid Gemini API key. Please check your .env file." });
    if (err.message.includes("429") || err.message.includes("quota")) return res.status(429).json({ message: "Gemini API quota exceeded. Please wait and try again." });
    if (err instanceof SyntaxError) return res.status(500).json({ message: "AI returned an unexpected format. Please try again." });
    res.status(500).json({ message: "AI analysis error: " + err.message });
  }
});

// ─── POST /api/ai/market-demand ───────────────────────────────────────────
router.post("/market-demand", protect, async (req, res) => {
  try {
    const { crops, location, language } = req.body;
    if (!crops || crops.length === 0) {
      return res.status(400).json({ message: "crops array is required." });
    }

    const model = getModel();
    const langInstruction = getLangInstruction(language);

    const prompt = `You are an agricultural market analyst for India.
${langInstruction}
Provide market demand and price forecast for: ${crops.join(", ")}
Location: ${location || "Uttar Pradesh, India"}

Respond with ONLY a valid JSON object, no other text, no markdown:
{
  "crops": [
    {
      "name": "string",
      "currentPrice": "string",
      "demand": "High | Medium | Low",
      "trend": "Rising | Stable | Falling",
      "bestTimeToSell": "string",
      "advice": "string"
    }
  ],
  "marketInsight": "string"
}`;

    const result  = await model.generateContent(prompt);
    const text    = result.response.text().trim();
    const parsed  = extractJSON(text);

    res.json({ market: parsed });

  } catch (err) {
    console.error("Market demand error:", err.message);
    if (err.message.includes("GEMINI_API_KEY")) return res.status(500).json({ message: err.message });
    if (err.message.includes("API_KEY_INVALID") || err.message.includes("401")) return res.status(500).json({ message: "Invalid Gemini API key. Please check your .env file." });
    if (err.message.includes("429") || err.message.includes("quota")) return res.status(429).json({ message: "Gemini API quota exceeded. Please wait and try again." });
    if (err instanceof SyntaxError) return res.status(500).json({ message: "AI returned an unexpected format. Please try again." });
    res.status(500).json({ message: "AI service error: " + err.message });
  }
});

module.exports = router;
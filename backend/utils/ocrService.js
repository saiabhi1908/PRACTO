import Tesseract from "tesseract.js";

export const extractTextFromImage = async (filePath) => {
  try {
    const { data: { text } } = await Tesseract.recognize(filePath, "eng");
    return text.trim();
  } catch (err) {
    console.error("❌ OCR failed:", err.message);
    return "";
  }
};

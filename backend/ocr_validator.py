# backend/ocr_validator.py
import os, re
from PIL import Image

# Try PaddleOCR first, fallback to pytesseract
try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except Exception:
    PADDLE_AVAILABLE = False

try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except Exception:
    PYTESSERACT_AVAILABLE = False

# Simple medication rules (extend as needed)
SIMPLE_DOSE_RULES = {
    "paracetamol": {"max_mg_per_day": 4000},
    "ibuprofen": {"max_mg_per_day": 2400},
}

def ocr_image(path: str) -> str:
    if PADDLE_AVAILABLE:
        ocr = PaddleOCR(use_angle_cls=True, lang='en')
        res = ocr.ocr(path, cls=True)
        lines = []
        for r in res:
            for line in r:
                lines.append(line[1][0])
        return "\n".join(lines)
    elif PYTESSERACT_AVAILABLE:
        img = Image.open(path)
        return pytesseract.image_to_string(img)
    else:
        raise RuntimeError("No OCR backend found. Install paddleocr or pytesseract + tesseract.")

def parse_meds(text: str):
    meds = []
    # regex for "DrugName 500 mg" style lines
    pattern = re.compile(r"([A-Za-z\-\s]+)\s+(\d{2,4})\s*mg(?:\s*(.*))?", re.IGNORECASE)
    for m in pattern.finditer(text):
        name = m.group(1).strip().lower()
        dose = int(m.group(2))
        freq = (m.group(3) or "").strip().lower()
        meds.append({"name": name, "dose_mg": dose, "freq": freq})
    return meds

def estimate_daily_doses(med: dict):
    freq = med.get("freq", "")
    if "once" in freq:
        per_day = 1
    elif "twice" in freq:
        per_day = 2
    elif "three" in freq or "3" in freq:
        per_day = 3
    else:
        per_day = 3
    return med["dose_mg"] * per_day

def validate_prescription_image(path: str, patient_age: int = None):
    text = ocr_image(path)
    meds = parse_meds(text)
    flags = []
    for m in meds:
        rule = SIMPLE_DOSE_RULES.get(m["name"])
        if rule:
            est = estimate_daily_doses(m)
            if est > rule["max_mg_per_day"]:
                flags.append({"med": m, "issue": f"estimated daily {est} mg > allowed {rule['max_mg_per_day']} mg"})
    return {"raw_text": text, "meds": meds, "flags": flags}

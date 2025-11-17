# backend/routes_ocr.py
from flask import Blueprint, request, jsonify
import os
from werkzeug.utils import secure_filename

# Allow local imports even if run from /backend/ml
import sys
sys.path.append(os.path.dirname(__file__))

from ocr_validator import validate_prescription_image

bp = Blueprint("ocr", __name__, url_prefix="/api")

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./backend/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@bp.route("/validate-prescription", methods=["POST"])
def validate_prescription():
    if "file" not in request.files:
        return jsonify({"error": "file required"}), 400

    f = request.files["file"]
    filename = secure_filename(f.filename)
    save_path = os.path.join(UPLOAD_DIR, filename)
    f.save(save_path)

    age = request.form.get("age")
    try:
        age_val = int(age) if age else None
    except:
        age_val = None

    try:
        out = validate_prescription_image(save_path, patient_age=age_val)
        return jsonify({"ok": True, "result": out})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


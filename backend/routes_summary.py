# backend/routes_summary.py
from flask import Blueprint, request, jsonify
from rag_summary import generate_summary


bp = Blueprint("summary", __name__, url_prefix="/api")

@bp.route("/summary", methods=["POST"])
def post_summary():
    data = request.get_json() or {}
    symptoms = data.get("symptoms")
    if not symptoms:
        return jsonify({"error": "symptoms required"}), 400
    k = int(data.get("k", 3))
    try:
        out = generate_summary(symptoms, k=k)
        return jsonify({"ok": True, "summary": out["summary"], "sources": out["sources"]})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

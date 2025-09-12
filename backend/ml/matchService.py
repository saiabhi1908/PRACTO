from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from pymongo import MongoClient
from bson.objectid import ObjectId
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")
EMBED_DIM = model.get_sentence_embedding_dimension()

# MongoDB Atlas connection
MONGO_URI = "mongodb+srv://skolli5:Laasyap1908@cluster0.pfmmw.mongodb.net/prescripta"
DB_NAME = "prescripta"
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
doctor_collection = db["doctors"]

# FAISS index for doctors
index = faiss.IndexFlatIP(EMBED_DIM)
doctor_ids = []

# Speciality embeddings
speciality_index = None
specialities = []
speciality_embeddings = None

def build_index():
    global index, doctor_ids, speciality_index, specialities, speciality_embeddings

    index = faiss.IndexFlatIP(EMBED_DIM)
    doctor_ids = []

    docs = list(doctor_collection.find({}))
    texts = []
    for d in docs:
        text = " ".join(filter(None, [
            f"Speciality: {d.get('speciality','')}",
            f"About: {d.get('about','')}",
            "Languages: " + ", ".join(d.get("languagesKnown", [])),
            "Insurances: " + ", ".join(d.get("acceptedInsurances", [])),
            "Hospitals: " + ", ".join([h.get("name","") for h in d.get("hospitals", [])])
        ]))
        texts.append(text)
        doctor_ids.append(str(d["_id"]))

    if texts:
        embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
        faiss.normalize_L2(embeddings)
        index.add(embeddings)
        print(f"✅ Indexed {len(texts)} doctors")

    # Build speciality embeddings
    specialities = list(set([d.get("speciality", "") for d in docs if d.get("speciality")]))
    if specialities:
        speciality_embeddings = model.encode(specialities, convert_to_numpy=True)
        faiss.normalize_L2(speciality_embeddings)
        speciality_index = faiss.IndexFlatIP(EMBED_DIM)
        speciality_index.add(speciality_embeddings)
        print(f"✅ Indexed {len(specialities)} specialities")

# Flask routes
@app.route("/")
def home():
    html = """
    <!doctype html>
    <html>
    <head>
        <title>Doctor Matcher</title>
        <style>
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            tr:hover {background-color: #f1f1f1;}
            input, button { padding: 5px; margin: 5px 0; }
        </style>
    </head>
    <body>
        <h2>Doctor Matcher</h2>
        <form id="matchForm">
            Describe your symptoms or needs:<br>
            <textarea name="query" rows="2" cols="50"></textarea><br>
            Insurance: <input type="text" name="insurance"><br>
            Languages (comma separated): <input type="text" name="languages"><br>
            Top K: <input type="number" name="top_k" value="5"><br>
            <button type="submit">Search</button>
        </form>

        <h3>Results:</h3>
        <table id="resultsTable" style="display:none;">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Speciality</th>
                    <th>Languages</th>
                    <th>Accepted Insurances</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody id="resultsBody"></tbody>
        </table>

        <script>
        document.getElementById("matchForm").onsubmit = async function(e){
            e.preventDefault();
            const formData = new FormData(this);
            const query = formData.get("query");
            const insurance = formData.get("insurance");
            const languages = formData.get("languages").split(",").map(s => s.trim()).filter(s => s);
            const top_k = parseInt(formData.get("top_k"));

            const resp = await fetch("/match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, preferences: {insurance, languages}, top_k })
            });
            const data = await resp.json();

            const table = document.getElementById("resultsTable");
            const tbody = document.getElementById("resultsBody");
            tbody.innerHTML = "";

            if(data.matches && data.matches.length > 0){
                data.matches.forEach(doc => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${doc.name}</td>
                        <td>${doc.speciality}</td>
                        <td>${doc.languagesKnown.join(", ")}</td>
                        <td>${doc.acceptedInsurances.join(", ")}</td>
                        <td>${doc.score}</td>
                    `;
                    tbody.appendChild(row);
                });
                table.style.display = "table";
            } else {
                table.style.display = "none";
                alert("No matches found!");
            }
        }
        </script>
    </body>
    </html>
    """
    return render_template_string(html)

@app.route("/rebuild_index", methods=["POST"])
def rebuild_index():
    build_index()
    return jsonify({"status": "ok", "count": index.ntotal})

@app.route("/match", methods=["POST"])
def match():
    body = request.json
    query = body.get("query", "")
    preferences = body.get("preferences", {})
    top_k = body.get("top_k", 5)

    if not query:
        return jsonify({"error": "query is required"}), 400

    query_embedding = model.encode([query], convert_to_numpy=True)
    faiss.normalize_L2(query_embedding)

    # 1️⃣ Search doctors in FAISS
    D, I = index.search(query_embedding, top_k)

    # 2️⃣ Search closest speciality
    speciality_boost = None
    if speciality_index is not None and specialities:
        D_spec, I_spec = speciality_index.search(query_embedding, 1)
        speciality_boost = specialities[I_spec[0][0]]  # top matched speciality

    results = []
    for score, idx in zip(D[0], I[0]):
        if idx == -1:
            continue
        doc_id = doctor_ids[idx]
        doctor = doctor_collection.find_one({"_id": ObjectId(doc_id)})
        if not doctor:
            continue

        score_value = float(score)

        # Insurance preference
        if preferences.get("insurance") and preferences["insurance"] not in doctor.get("acceptedInsurances", []):
            score_value -= 0.2

        # Language preference
        if preferences.get("languages"):
            if set(preferences["languages"]).intersection(set(doctor.get("languagesKnown", []))):
                score_value += 0.1
            else:
                score_value -= 0.1

        # Speciality boosting dynamically
        if speciality_boost and doctor.get("speciality", "").lower() == speciality_boost.lower():
            score_value += 0.3  # boost score if matches predicted speciality

        results.append({
            "doctor_id": str(doctor["_id"]),
            "name": doctor.get("name"),
            "speciality": doctor.get("speciality"),
            "languagesKnown": doctor.get("languagesKnown", []),
            "acceptedInsurances": doctor.get("acceptedInsurances", []),
            "score": round(score_value, 3)
        })

    results = sorted(results, key=lambda r: r["score"], reverse=True)
    return jsonify({"matches": results})

if __name__ == "__main__":
    build_index()
    app.run(host="0.0.0.0", port=5001)

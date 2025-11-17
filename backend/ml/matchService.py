from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
import sys
import threading
import time
import warnings
import json
import hashlib
import pathway as pw

# -------------------- CONFIG --------------------
warnings.filterwarnings("ignore")
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Flask + CORS
app = Flask(__name__)
CORS(app)

# MongoDB
MONGO_URI = "mongodb+srv://skolli5:Laasyap1908@cluster0.pfmmw.mongodb.net/prescripta"
DB_NAME = "prescripta"
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
doctor_collection = db["doctors"]

# Sentence Transformer
model = SentenceTransformer("all-MiniLM-L6-v2")
EMBED_DIM = model.get_sentence_embedding_dimension()

# FAISS index
index = faiss.IndexFlatIP(EMBED_DIM)
doctor_ids = []

# Speciality embeddings
speciality_index = None
specialities = []
speciality_embeddings = None

# Pathway
TARGET_COLLECTIONS = [
    "doctors","hospitals","appointments","insurances",
    "medicalreports","reviews","symptomhistories","users"
]
OUTPUT_PATH = "./pathway_live_docs.jsonl"
POLL_INTERVAL = 5000  # ms

# -------------------- FUNCTIONS --------------------
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

    # Specialities
    specialities = list(set([d.get("speciality","") for d in docs if d.get("speciality")]))
    if specialities:
        speciality_embeddings = model.encode(specialities, convert_to_numpy=True)
        faiss.normalize_L2(speciality_embeddings)
        speciality_index = faiss.IndexFlatIP(EMBED_DIM)
        speciality_index.add(speciality_embeddings)
        print(f"✅ Indexed {len(specialities)} specialities")

# -------------------- PATHWAY CONNECTOR --------------------
class DocSchema(pw.Schema):
    doc_id: str
    collection: str
    text: str
    version: str

def doc_hash(d):
    return hashlib.md5(json.dumps(d, sort_keys=True).encode()).hexdigest()

def build_text(collection, doc):
    if collection == "doctors":
        return " ".join(filter(None, [
            f"Doctor: {doc.get('name','')}",
            f"Speciality: {doc.get('speciality','')}",
            f"About: {doc.get('about','')}",
            "Languages: " + ", ".join(doc.get("languagesKnown", [])),
            "Insurances: " + ", ".join(doc.get("acceptedInsurances", [])),
        ]))
    if collection == "hospitals":
        return f"Hospital: {doc.get('name','')} {doc.get('location','')} Services: {doc.get('services','')}"
    if collection == "appointments":
        return f"Appointment with {doc.get('doctorName','')} on {doc.get('date','')} at {doc.get('time','')}"
    if collection == "insurances":
        return f"Insurance: {doc.get('provider','')} coverage: {doc.get('coverage','')}"
    if collection == "medicalreports":
        return f"Medical report for {doc.get('patientName','')} - {doc.get('type','')} Results: {doc.get('results','')}"
    if collection == "reviews":
        return f"Review by {doc.get('user','')} for {doc.get('doctor','')}: {doc.get('content','')}"
    if collection == "symptomhistories":
        return f"Symptoms: {doc.get('symptoms','')} Diagnosis: {doc.get('diagnosis','')}"
    if collection == "users":
        return f"User {doc.get('name','')} email {doc.get('email','')} role {doc.get('role','')}"
    return str(doc)

def fetch_rows(collection_name):
    col = db[collection_name]
    rows = []
    for d in col.find({}):
        rows.append({
            "doc_id": str(d["_id"]),
            "collection": collection_name,
            "text": build_text(collection_name, d),
            "version": doc_hash(d),
        })
    return rows

embedder = model
EMBED_DIM = embedder.get_sentence_embedding_dimension()

@pw.udf
def embed(text: str):
    if not text:
        return [0.0]*EMBED_DIM
    v = embedder.encode([text], convert_to_numpy=True)[0]
    norm = float((v**2).sum())**0.5 or 1.0
    return (v/norm).tolist()

class MongoSnapshotSource(pw.io.python.ConnectorSubject):
    def __init__(self, collection_name):
        super().__init__()
        self.collection_name = collection_name

    def run(self):
        while True:
            rows = fetch_rows(self.collection_name)
            print(f"[Pathway] Reloaded {self.collection_name}: {len(rows)} rows")
            for r in rows:
                r["_pw_status"]="update"
                yield r
            yield pw.PwContinue()
            pw.sleep(POLL_INTERVAL/1000.0)

def run_pathway():
    tables = []
    print("Loading tables from MongoDB...\n")
    for c in TARGET_COLLECTIONS:
        print(f" → Loading collection: {c}")
        source = MongoSnapshotSource(c)
        t = pw.io.python.read(source, schema=DocSchema, autocommit_duration_ms=POLL_INTERVAL).select(
            doc_id=pw.this.doc_id,
            collection=pw.this.collection,
            text=pw.this.text,
            version=pw.this.version,
            embedding=embed(pw.this.text),
        )
        tables.append(t)
    # Safe concat
    safe_tables=[]
    for i in range(len(tables)):
        t=tables[i]
        for j in range(i):
            t=t.promise_universes_are_disjoint(safe_tables[j])
        safe_tables.append(t)
    docs = pw.Table.concat(*safe_tables)
    pw.io.jsonlines.write(docs, OUTPUT_PATH)
    print("\n▶ Pathway is now watching MongoDB for LIVE changes...\n")
    pw.run()

# -------------------- FLASK ROUTES --------------------
@app.route("/")
def home():
    return "Doctor Matcher API is running. Use /match POST."

@app.route("/match", methods=["POST"])
def match():
    body = request.json
    query = body.get("query","")
    preferences = body.get("preferences",{})
    top_k = body.get("top_k",5)
    if not query:
        return jsonify({"error":"query is required"}),400
    query_embedding = model.encode([query], convert_to_numpy=True)
    faiss.normalize_L2(query_embedding)
    D,I = index.search(query_embedding, top_k)
    speciality_boost = None
    if speciality_index and specialities:
        D_spec,I_spec = speciality_index.search(query_embedding,1)
        speciality_boost = specialities[I_spec[0][0]]
    results=[]
    for score,idx in zip(D[0],I[0]):
        if idx==-1: continue
        doc_id = doctor_ids[idx]
        doctor = doctor_collection.find_one({"_id": ObjectId(doc_id)})
        if not doctor: continue
        score_value = float(score)
        if preferences.get("insurance") and preferences["insurance"] not in doctor.get("acceptedInsurances",[]):
            score_value -= 0.2
        if preferences.get("languages"):
            if set(preferences["languages"]).intersection(set(doctor.get("languagesKnown",[]))):
                score_value += 0.1
            else: score_value -= 0.1
        if speciality_boost and doctor.get("speciality","").lower() == speciality_boost.lower():
            score_value += 0.3
        results.append({
            "doctor_id": str(doctor["_id"]),
            "name": doctor.get("name"),
            "speciality": doctor.get("speciality"),
            "languagesKnown": doctor.get("languagesKnown",[]),
            "acceptedInsurances": doctor.get("acceptedInsurances",[]),
            "score": round(score_value,3)
        })
    results = sorted(results, key=lambda r:r["score"], reverse=True)
    return jsonify({"matches":results})

# -------------------- MAIN --------------------
if __name__=="__main__":
    # 1️⃣ Start FAISS index in background
    threading.Thread(target=build_index, daemon=True).start()
    
    # 2️⃣ Start Pathway watcher in background
    threading.Thread(target=run_pathway, daemon=True).start()
    
    # 3️⃣ Start Flask server
    app.run(host="0.0.0.0", port=5001)

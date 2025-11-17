# backend/pathway_connector.py
import os
import warnings
import json
import hashlib

# CLEAN WARNINGS
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

import pathway as pw
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer


# ----------------------------------------------------
# CONFIG
# ----------------------------------------------------
MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://skolli5:Laasyap1908@cluster0.pfmmw.mongodb.net/prescripta"
)
DB_NAME = os.getenv("MONGO_DB", "prescripta")

TARGET_COLLECTIONS = [
    "doctors",
    "hospitals",
    "appointments",
    "insurances",
    "medicalreports",
    "reviews",
    "symptomhistories",
    "users",
]

EMBED_MODEL = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "5")) * 1000  # ms
OUTPUT_PATH = "./pathway_live_docs.jsonl"

mongo_client = MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]


# ----------------------------------------------------
# PRINT COUNTS
# ----------------------------------------------------
def print_counts():
    print("\n--- MongoDB Document Counts ---")
    for c in TARGET_COLLECTIONS:
        count = db[c].count_documents({})
        print(f"{c}: {count}")
    print("--------------------------------\n")

print_counts()


# ----------------------------------------------------
# SCHEMA
# ----------------------------------------------------
class DocSchema(pw.Schema):
    doc_id: str
    collection: str
    text: str
    version: str   # IMPORTANT: forces update detection


# ----------------------------------------------------
# TEXT BUILDER
# ----------------------------------------------------
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


# ----------------------------------------------------
# VERSION HASH FOR CHANGE DETECTION
# ----------------------------------------------------
def doc_hash(d):
    return hashlib.md5(json.dumps(d, sort_keys=True).encode()).hexdigest()


# ----------------------------------------------------
# FETCH
# ----------------------------------------------------
def fetch_rows(collection_name):
    col = db[collection_name]
    rows = []
    for d in col.find({}):

        rows.append({
            "doc_id": str(d["_id"]),
            "collection": collection_name,
            "text": build_text(collection_name, d),
            "version": doc_hash(d),  # CHANGES ONLY IF THE DOCUMENT CHANGES
        })

    return rows


# ----------------------------------------------------
# EMBEDDINGS
# ----------------------------------------------------
embedder = SentenceTransformer(EMBED_MODEL)
EMBED_DIM = embedder.get_sentence_embedding_dimension()

@pw.udf
def embed(text: str):
    if not text:
        return [0.0] * EMBED_DIM
    v = embedder.encode([text], convert_to_numpy=True)[0]
    norm = float((v**2).sum())**0.5 or 1.0
    return (v / norm).tolist()


# ----------------------------------------------------
# CONTINUOUS STREAM CONNECTOR
# ----------------------------------------------------
class MongoSnapshotSource(pw.io.python.ConnectorSubject):
    def __init__(self, collection_name):
        super().__init__()
        self.collection_name = collection_name

    def run(self):
        while True:
            rows = fetch_rows(self.collection_name)

            print(f"[Pathway] Reloaded {self.collection_name}: {len(rows)} rows")

            for r in rows:
                r["_pw_status"] = "update"
                yield r

            yield pw.PwContinue()
            pw.sleep(POLL_INTERVAL / 1000.0)


# ----------------------------------------------------
# PIPELINE
# ----------------------------------------------------
tables = []

print("Loading tables from MongoDB...\n")

for c in TARGET_COLLECTIONS:
    print(f" → Loading collection: {c}")
    source = MongoSnapshotSource(c)

    t = pw.io.python.read(
        source,
        schema=DocSchema,
        autocommit_duration_ms=POLL_INTERVAL,
    ).select(
        doc_id=pw.this.doc_id,
        collection=pw.this.collection,
        text=pw.this.text,
        version=pw.this.version,
        embedding=embed(pw.this.text),
    )

    tables.append(t)

print(f"\nTotal tables loaded: {len(tables)}\n")


# ----------------------------------------------------
# SAFE CONCAT
# ----------------------------------------------------
print("Ensuring disjoint universes for concat...")

safe_tables = []
for i in range(len(tables)):
    t = tables[i]
    for j in range(i):
        t = t.promise_universes_are_disjoint(safe_tables[j])
    safe_tables.append(t)

docs = pw.Table.concat(*safe_tables)

print("Universe check complete.\n")


# ----------------------------------------------------
# OUTPUT
# ----------------------------------------------------
print(f"Writing Pathway output to {OUTPUT_PATH} ...")
pw.io.jsonlines.write(docs, OUTPUT_PATH)

print("\n▶ Pathway is now watching MongoDB for changes...\n")
pw.run()

import time
while True:
    time.sleep(999)

# backend/rag_summary.py
import os
import sys
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
import numpy as np

# --------------------------------------------------------------------
# ✅ Allow importing other backend files even if we run from /backend/ml
sys.path.append(os.path.dirname(__file__))

import pathway_connector_pathway as connector
from llm_client import call_llm_chat
# --------------------------------------------------------------------

# MongoDB connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb+srv://skolli5:Laasyap1908@cluster0.pfmmw.mongodb.net/prescripta")
DB_NAME = os.getenv("MONGO_DB", "prescripta")

mongo = MongoClient(MONGO_URI)
db = mongo[DB_NAME]
docs_col = db["documents"]

# Embedding model
EMBED_MODEL = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
embedder = SentenceTransformer(EMBED_MODEL)


def retrieve_top_k(symptoms: str, k: int = 3):
    """
    Use local FAISS index first. If empty, fallback to a naive text search.
    Returns list of docs.
    """
    if connector.faiss_index is not None and connector.faiss_index.ntotal > 0:
        q = embedder.encode([symptoms]).astype("float32")
        D, I = connector.faiss_index.search(q, k)
        docs = []
        for idx in I[0]:
            if idx < len(connector.index_to_docid):
                docid = connector.index_to_docid[idx]
                doc = docs_col.find_one({"_id": docid}) or docs_col.find_one({"_id": {"$oid": docid}})
                if not doc:
                    # fallback: if no doc found, pick any latest
                    doc = docs_col.find_one()
                docs.append(doc or {"title": "unknown", "text": ""})
        return docs
    else:
        # fallback: naive text search (requires text index in Mongo)
        try:
            results = list(docs_col.find({"$text": {"$search": symptoms}}).limit(k))
            return results
        except Exception:
            # if no text index, return latest k docs
            return list(docs_col.find().sort("ingested_at", -1).limit(k))


def build_prompt(symptoms: str, docs: list):
    """
    Builds the prompt for LLM summarization.
    """
    prompt = "You are an assistant that writes clinician-friendly patient summaries and attaches evidence citations.\n\n"
    prompt += f"Patient reported symptoms: {symptoms}\n\n"
    prompt += "Available sources:\n"

    for i, d in enumerate(docs):
        title = d.get("title", f"source_{i+1}")
        snippet = d.get("text", "")[:800].replace("\n", " ")
        prompt += f"[{i+1}] {title}: {snippet}\n\n"

    prompt += (
        "Write a concise patient summary (3–6 bullets). After each bullet, list supporting sources like [1],[2]. "
        "Also include a brief recommended next step for the clinician.\n"
    )
    return prompt


def generate_summary(symptoms: str, k=3):
    """
    Main entrypoint: retrieves top docs and calls LLM for summarization.
    """
    docs = retrieve_top_k(symptoms, k=k)
    prompt = build_prompt(symptoms, docs)
    system = "You are a helpful, evidence-focused medical assistant."
    response = call_llm_chat(system, prompt, max_tokens=500, temperature=0.0)

    return {
        "summary": response,
        "sources": [{"id": str(d.get("_id")), "title": d.get("title", "")} for d in docs],
    }


# --------------------------------------------------------------------
# Quick standalone test
if __name__ == "__main__":
    example = "fever for 3 days and sore throat"
    print(generate_summary(example, k=3))


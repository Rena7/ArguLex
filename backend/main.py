import os
import json
import datetime
import logging
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from llama_index.core import StorageContext, load_index_from_storage, Settings
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.schema import Document
from llama_index.core.base.llms.types import ChatMessage
from chromadb import PersistentClient

# ------------------------------
# Environment Setup
# ------------------------------
logging.getLogger("sentence_transformers.SentenceTransformer").setLevel(logging.ERROR)
os.environ["TOKENIZERS_PARALLELISM"] = "false"
model_name = "nlpaueb/legal-bert-base-uncased"
Settings.embed_model = HuggingFaceEmbedding(model_name=model_name)
Settings.llm = Ollama(model="llama3.1:latest", request_timeout=120.0)

# ------------------------------
# FastAPI Setup
# ------------------------------
app = FastAPI(title="Legal Argument Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------
# Argument Generator Class
# ------------------------------
class ArgumentGenerator:
    def __init__(self, model):
        self.model = model

    def generate_argument(self, question, context):
        prompt = f"""
You are a legal defense lawyer assistant. Using only the content from the retrieved legal context below, provide a well-reasoned legal argument that addresses the question.
If the context partially addresses the question, use what is available and avoid speculation beyond it.

--------------------
Legal Context:
{context}

--------------------
Legal Question:
{question}

Answer:
"""
        response = self.model.complete(prompt)
        return response.text.strip()

# ------------------------------
# ChromaDB Utility Functions
# ------------------------------
def load_chat_history(chroma_client):
    try:
        chat_collection = chroma_client.get_or_create_collection("chat_history")
        result = chat_collection.get()
        return [ChatMessage(role=meta.get("role", "unknown"), content=doc)
                for doc, meta in zip(result["documents"], result["metadatas"])]
    except Exception as e:
        print(f"Error loading chat history: {e}")
        return []

def save_chat_message(chroma_client, message_id, role, content):
    chat_collection = chroma_client.get_or_create_collection("chat_history")
    chat_collection.add(
        ids=[str(message_id)],
        documents=[content],
        metadatas=[{"role": role, "timestamp": datetime.datetime.now().isoformat()}]
    )

# ------------------------------
# Metadata Fallback Loader
# ------------------------------
def load_fallback_metadata(json_dir="./Final_data"):
    fallback_contexts = {}
    for folder in os.listdir(json_dir):
        json_path = os.path.join(json_dir, folder, "data.json")
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                    snippet = data.get("opinions", [{}])[0].get("snippet", "")
                    case_name = data.get("caseName", folder).lower()
                    judge = data.get("judge", "Unknown")
                    court = data.get("court", "Unknown")
                    fallback_contexts[case_name] = f"{snippet}\n\nJudge: {judge}\nCourt: {court}"
                except Exception as e:
                    print(f"Error loading {json_path}: {e}")
    return fallback_contexts

def search_fallback_context(query, fallback_contexts):
    query_lower = query.lower()
    for case_name, context in fallback_contexts.items():
        if case_name in query_lower:
            return context
    return None

# ------------------------------
# Streaming Response Endpoint
# ------------------------------
@app.get("/streamresponse")
async def streamresponse(prompt: str):
    # Load index and fallback contexts
    storage_context = StorageContext.from_defaults(persist_dir="./persisted_legal_index")
    index = load_index_from_storage(storage_context)
    fallback_contexts = load_fallback_metadata()

    # Retrieve relevant context
    query_engine = index.as_query_engine(similarity_top_k=3, include_text=True)
    response = query_engine.query(prompt)

    retrieved_context = ""
    if response.source_nodes:
        for node in response.source_nodes:
            retrieved_context += node.node.text.strip() + "\n\n"
    else:
        fallback = search_fallback_context(prompt, fallback_contexts)
        retrieved_context = fallback if fallback else "No relevant discussion found."

    # Generate legal argument
    arg_gen = ArgumentGenerator(Settings.llm)
    legal_argument = arg_gen.generate_argument(prompt, retrieved_context)

    # Stream response line-by-line
    async def event_generator():
        for line in legal_argument.splitlines():
            yield f"data: {line}\n\n"
            await asyncio.sleep(0.05)  # For real-time streaming effect

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# ------------------------------
# Root Endpoint
# ------------------------------
@app.get("/")
async def root():
    return {"message": "Welcome to the Legal Argument Generator API"}

# ------------------------------
# Chat Message Updater (Optional)
# ------------------------------
@app.post('/update')
def update(new_messages: list):
    chroma_client = PersistentClient(path="./chroma_db_legal")
    chat_collection = chroma_client.get_or_create_collection("chat_history")
    existing = chat_collection.get()
    next_id = len(existing.get("ids", [])) + 1
    for msg in new_messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        save_chat_message(chroma_client, next_id, role, content)
        next_id += 1
    return {"message": "Chat history updated."}

# ------------------------------
# Start the server (CLI only)
# ------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

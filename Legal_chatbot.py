import os
import json
import datetime
import logging
from llama_index.core import StorageContext, load_index_from_storage, Settings
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.schema import Document
from llama_index.core.base.llms.types import ChatMessage
from chromadb import PersistentClient

# Logging and environment setup
logging.getLogger("sentence_transformers.SentenceTransformer").setLevel(logging.ERROR)
os.environ["TOKENIZERS_PARALLELISM"] = "false"

model_name = "nlpaueb/legal-bert-base-uncased"
Settings.embed_model = HuggingFaceEmbedding(model_name=model_name)

# ------------------------------
# Argument Generator Class
# ------------------------------
class ArgumentGenerator:
    """Class to generate legal arguments using context-aware prompting."""
    
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
# Main Chat Application
# ------------------------------
def main():
    Settings.llm = Ollama(model="llama3.1:latest", request_timeout=120.0)

    storage_context = StorageContext.from_defaults(persist_dir="./persisted_legal_index")
    index = load_index_from_storage(storage_context)
    print("✅ Persisted index loaded successfully.")

    chroma_client = PersistentClient(path="./chroma_db_legal")
    chat_history = load_chat_history(chroma_client)

    fallback_contexts = load_fallback_metadata()
    arg_gen = ArgumentGenerator(Settings.llm)

    chat_collection = chroma_client.get_or_create_collection("chat_history")
    existing = chat_collection.get()
    next_message_id = len(existing.get("ids", [])) + 1

    print("\nWelcome to the Legal Argument Generator Chat Engine! Type 'exit' to quit.")

    while True:
        user_input = input("You: ")
        if user_input.strip().lower() == "exit":
            print("Goodbye!")
            break

        save_chat_message(chroma_client, next_message_id, "user", user_input)
        next_message_id += 1
        chat_history.append(ChatMessage(role="user", content=user_input))

        query_engine = index.as_query_engine(similarity_top_k=3, include_text=True)
        response = query_engine.query(user_input)

        retrieved_context = ""
        if response.source_nodes:
            print("\nTop 3 Relevant Chunks:")
            for node in response.source_nodes:
                chunk = node.node.text.strip()
                print("\n> Text:", chunk)
                print("Metadata:", node.node.metadata)
                retrieved_context += chunk + "\n\n"
        else:
            print("\nNo relevant chunks found. Searching fallback metadata.")
            fallback = search_fallback_context(user_input, fallback_contexts)
            if fallback:
                retrieved_context = fallback
            else:
                retrieved_context = "No relevant discussion found in the retrieved legal context."

        response_text = arg_gen.generate_argument(user_input, retrieved_context)

        print("\n📄 Legal Argument:\n", response_text)
        save_chat_message(chroma_client, next_message_id, "assistant", response_text)
        next_message_id += 1
        chat_history.append(ChatMessage(role="assistant", content=response_text))

if __name__ == "__main__":
    main()

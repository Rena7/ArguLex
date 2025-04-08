import os
import json
import re
import unicodedata
import pdfplumber
import torch
import numpy as np
import nltk
from nltk.tokenize import sent_tokenize
from transformers import AutoModel, AutoTokenizer
from sentence_transformers import SentenceTransformer
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import VectorStoreIndex, Settings, get_response_synthesizer
from llama_index.core.ingestion import IngestionPipeline
from llama_index.vector_stores.chroma import ChromaVectorStore
from chromadb import PersistentClient
from llama_index.core.query_engine import CustomQueryEngine
from llama_index.core.retrievers import BaseRetriever
from llama_index.core.response_synthesizers import BaseSynthesizer
from llama_index.llms.ollama import Ollama
from llama_index.core.schema import Document

nltk.download('punkt')

def new_preprocess_text(file_path, text):
    text = unicodedata.normalize('NFKC', text)
    text = re.sub(r'\.{3,}', '.', text)
    text = re.sub(r'\n\s*\n+', '\n\n', text)
    text = re.sub(r'Page\s+\d+\s+of\s+\d+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_pdf_text(pdf_file_path):
    text_runs = []
    try:
        with pdfplumber.open(pdf_file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_runs.append(page_text)
    except Exception as e:
        print(f"Error reading PDF {pdf_file_path}: {e}")
    return "\n".join(text_runs)

def load_metadata(metadata_file_path):
    try:
        with open(metadata_file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading metadata {metadata_file_path}: {e}")
        return {}

def load_case_documents(dataset_path: str) -> list[Document]:
    """
    Load and process case documents from folders containing PDFs and JSON metadata.
    Falls back to JSON snippet if PDF text is missing or unchunkable.
    """
    documents = []
    for case_folder in os.listdir(dataset_path):
        case_path = os.path.join(dataset_path, case_folder)
        if os.path.isdir(case_path):
            pdf_files = [os.path.join(case_path, f) for f in os.listdir(case_path) if f.lower().endswith(".pdf")]
            metadata_file = os.path.join(case_path, "data.json")
            
            if not pdf_files and not os.path.exists(metadata_file):
                print(f"Skipping folder {case_folder}: No PDF or JSON found.")
                continue

            metadata = load_metadata(metadata_file) if os.path.exists(metadata_file) else {}
            pdf_texts = []

            for pdf_file in sorted(pdf_files):
                pdf_text = extract_pdf_text(pdf_file)
                if pdf_text:
                    pdf_texts.append(pdf_text)

            combined_pdf_text = "\n\n".join(pdf_texts).strip()
            cleaned_text = new_preprocess_text(metadata_file, combined_pdf_text) if combined_pdf_text else ""

            # Final fallback to JSON snippet
            if not cleaned_text and "opinions" in metadata:
                cleaned_text = metadata["opinions"][0].get("snippet", "")

            if not cleaned_text:
                print(f"Skipping folder {case_folder}: No usable text in PDF or JSON.")
                continue

            metadata.update({
                "case_folder": case_folder,
                "pdf_files": pdf_files,
                "metadata_file": metadata_file if os.path.exists(metadata_file) else None
            })
            metadata["file_name"] = case_folder

            documents.append(Document(text=cleaned_text, metadata=metadata))
    return documents


def add_json_snippet_documents(documents, dataset_path):
    for case_folder in os.listdir(dataset_path):
        case_path = os.path.join(dataset_path, case_folder)
        metadata_file = os.path.join(case_path, "data.json")

        if os.path.isdir(case_path) and os.path.exists(metadata_file):
            try:
                with open(metadata_file, "r", encoding="utf-8") as f:
                    metadata = json.load(f)

                snippet = metadata.get("opinions", [{}])[0].get("snippet", "").strip()
                judge = metadata.get("judge", "")
                court = metadata.get("court", "")
                case_name = metadata.get("caseName", "")

                if snippet:
                    text = f"{snippet}\n\nJudge: {judge}\nCourt: {court}\nCase Name: {case_name}"
                    doc_metadata = {
                        "file_name": case_folder,
                        "case_folder": case_folder,
                        "source": "json_snippet",
                        "num_tokens": len(text.split()),
                        "num_chars": len(text),
                        "judge": judge,
                        "court": court,
                        "case_name": case_name
                    }
                    documents.append(Document(text=text, metadata=doc_metadata))
            except Exception as e:
                print(f"❌ Error processing JSON for folder '{case_folder}': {e}")
    return documents

def merge_short_chunks(chunks, min_tokens=20):
    if not chunks:
        return chunks

    new_chunks = []
    current_chunk = chunks[0]

    for i in range(1, len(chunks)):
        if len(current_chunk.split()) < min_tokens:
            current_chunk += " " + chunks[i]
        else:
            new_chunks.append(current_chunk)
            current_chunk = chunks[i]

    if len(current_chunk.split()) >= min_tokens:
        new_chunks.append(current_chunk)

    return new_chunks

def structure_aware_chunking(text):
    sections = re.split(r'(Case:|Document:|Ruling:|Facts:)', text)
    sections = [sections[i] + sections[i + 1] for i in range(0, len(sections) - 1, 2)]
    return sections

def sentence_grouping(text, model, threshold=0.75, max_tokens=150):
    sentences = sent_tokenize(text)
    embeddings = model.encode(sentences)
    chunks = []
    current_chunk = []
    current_embedding = []

    for sentence, emb in zip(sentences, embeddings):
        avg_embedding = np.mean(current_embedding, axis=0) if current_chunk else None
        similarity = np.dot(avg_embedding, emb) / (np.linalg.norm(avg_embedding) * np.linalg.norm(emb)) if avg_embedding is not None else 0

        if similarity >= threshold and len(" ".join(current_chunk).split()) < max_tokens:
            current_chunk.append(sentence)
            current_embedding.append(emb)
        else:
            if current_chunk:
                chunks.append(" ".join(current_chunk))
            current_chunk = [sentence]
            current_embedding = [emb]

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks

try:
    legal_model_name = "nlpaueb/legal-bert-base-uncased"
    Settings.embed_model = HuggingFaceEmbedding(model_name=legal_model_name)
    print(f"✅ Model {legal_model_name} loaded successfully for indexing.")
except Exception as e:
    print(f"❌ Error loading embedding model for indexing: {e}")
    exit()

Settings.llm = Ollama(model="llama3.1:latest", request_timeout=120.0)

legal_dataset_path = "/Users/liteshperumalla/Desktop/Files/masters/Legal LLM/Final_data"
docs = load_case_documents(legal_dataset_path)
docs = add_json_snippet_documents(docs, legal_dataset_path)

if not docs:
    print("❌ No case documents loaded. Check your dataset structure.")
    exit()
print(f"✅ Loaded {len(docs)} case documents from folders (PDF and JSON).")

semantic_model = SentenceTransformer("all-mpnet-base-v2")

processed_docs = []
for doc in docs:
    doc_text = doc.get_content()
    
    # Step 1: Try structure-aware chunking
    structured_chunks = structure_aware_chunking(doc_text)

    # Step 2: If failed, try paragraph-level chunks
    if not structured_chunks:
        structured_chunks = [p for p in doc_text.split("\n\n") if len(p.split()) > 20]

    # Step 3: If still empty, fallback to entire text
    if not structured_chunks:
        structured_chunks = [doc_text]

    final_chunks = []
    for section in structured_chunks:
        section_chunks = sentence_grouping(section, semantic_model)
        final_chunks.extend(section_chunks)

    # Merge tiny chunks if needed
    if final_chunks:
        final_chunks = merge_short_chunks(final_chunks)

    if not final_chunks:
        print(f"Skipping document {doc.metadata.get('file_name', 'Unknown')}: No valid chunks found.")
        continue

    for i, chunk in enumerate(final_chunks):
        metadata = {
            "case_folder": doc.metadata.get("case_folder", ""),
            "file_name": doc.metadata.get("file_name", ""),
            "num_tokens": len(chunk.split()),
            "num_chars": len(chunk)
        }
        print(f"--- Chunk {i+1} for case '{metadata['file_name']}' ---")
        print(chunk)
        print("Metadata:", metadata)
        print("\n")
        processed_docs.append({
            "doc_id": doc.doc_id,
            "text": chunk,
            "metadata": metadata,
        })


document_objects = [Document(text=d["text"], metadata=d["metadata"]) for d in processed_docs]

pipeline = IngestionPipeline(transformations=[Settings.embed_model])
try:
    nodes = pipeline.run(documents=document_objects)
    if not nodes:
        print("❌ No nodes were created. Check document parsing.")
        exit()
    print(f"✅ {len(nodes)} document nodes created and ready for indexing.")

    chroma_path = "./chroma_db_legal"
    chroma_client = PersistentClient(path=chroma_path)
    collection = chroma_client.get_or_create_collection("legal_document_chunks")
    vector_store = ChromaVectorStore(chroma_client, collection_name="legal_document_chunks")
    for i, node in enumerate(nodes):
        collection.add(
            ids=[str(i)],
            documents=[node.text],
            metadatas=[node.metadata]
        )
except Exception as e:
    print(f"❌ Error during ingestion pipeline: {e}")
    exit()

try:
    index = VectorStoreIndex(nodes, vector_store=vector_store)
    print("✅ Legal vector store index created successfully.")
    persist_dir = "./persisted_legal_index"
    os.makedirs(persist_dir, exist_ok=True)
    index.storage_context.persist(persist_dir=persist_dir)
    print(f"✅ Legal index persisted to {persist_dir}")
except Exception as e:
    print(f"❌ Error creating legal VectorStoreIndex: {e}")
    exit()
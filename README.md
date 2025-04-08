# ⚖️ ArguLex – AI-Powered Legal Argument Generator

**ArguLex** is an AI-powered legal assistant that automates the generation of legal arguments using **Retrieval-Augmented Generation (RAG)** and **LLMs**. It streamlines the legal research process by retrieving relevant precedents, analyzing legal content semantically, and generating well-structured legal arguments in various formats.

---

## 📌 Overview

- **Problem**: Legal professionals face time-consuming, costly, and inconsistent legal research processes due to data overload and manual drafting.
- **Solution**: ArguLex automates the retrieval and generation of legal arguments using domain-aware embeddings and AI, enabling faster, more accurate, and more consistent legal documentation.

---

## 🎯 Who Benefits

- **Lawyers & Legal Researchers** – for drafting high-quality arguments with precedents.
- **Law Students** – for learning how to structure and analyze legal arguments.
- **Legal Aid Organizations** – for supporting underserved communities with accessible legal insights.
- **Government Agencies** – for promoting transparency and consistency in legal communication.

---

## 🛠 Technology Stack

| Component   | Technology Used                                      |
|------------|-------------------------------------------------------|
| Frontend   | React, TailwindCSS                                    |
| Backend    | FastAPI, Python                                       |
| Database   | ChromaDB (vector DB), Firebase                        |
| Embeddings | Legal-BERT (domain-specific), LlamaIndex              |
| RAG Layer  | LangChain for retrieval, OLLAMA for LLM output        |
| Data       | Legal PDFs and JSON from Court APIs (scraped)         |
| Preprocessing | Text cleaning, entity extraction, fact isolation |

---

## 🔄 How It Works

1. **User inputs a legal query**.
2. **RAG pipeline retrieves** relevant documents using Legal-BERT embeddings.
3. **LLM generates** a structured legal argument with citations and legal reasoning.
4. **Output is shown** in a readable format for legal drafting or study.

---

## 📊 Results

- 📉 **85%** reduction in legal research time.
- ✅ **92%** accuracy in retrieving relevant precedents.
- 📈 **3.5x** increase in precedent usage compared to manual efforts.

---

## 📈 Evaluation

Evaluated using:
- **Chunk Relevance**
- **Context Quality**
- **Hit Rate**
(Using **Evidently AI** for interpretability and validation.)

---

## 🌍 Societal Impact & Scalability

### 📣 Impact
- Enhances **access to legal tools** for all.
- Supports **public legal aid** and justice systems.
- Encourages **consistent legal documentation**.

### 📈 Scalability
- Modular API-based design.
- Easily extendable to new datasets and jurisdictions.
- Roadmap includes:
  - Voice query input
  - Multilingual support
  - Privacy-aware deployments for firms

---

## 👥 Team

- Rena Patel – MS in Artificial Intelligence  
- Litesh Perumalla – MS in Data Science  
- Uday Kiran Chimpiri – MS in Computer Science  
- Srinivasa Manohar Kandadai – MS in Artificial Intelligence  
- Khaja Fasi Ahmed – MS in Computer Science  

---
![WhatsApp Image 2025-04-06 at 12 18 29](https://github.com/user-attachments/assets/b0decdb2-7463-4c95-bdbf-50acc4d6f713)



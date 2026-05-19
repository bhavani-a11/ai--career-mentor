# AI Career Mentor — Backend (FastAPI)

Python API server for the Career Mentor app.

## Quick start

```powershell
cd backend

python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
copy .env.example .env

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

| URL | Description |
|-----|-------------|
| http://localhost:8000 | API root |
| http://localhost:8000/docs | Swagger UI (interactive API docs) |
| http://localhost:8000/api/health | Health check |
| http://localhost:8000/api/chat | Chat — RAG + GitHub Models (POST) |
| http://localhost:8000/api/upload/pdf | Upload PDF → chunk → FAISS index (POST) |

### Chat endpoint example

```powershell
$body = @{ message = "What skills should I learn for a frontend developer role?" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/api/chat" -Method POST -Body $body -ContentType "application/json"
```

### PDF upload + RAG example

1. **Upload** a resume PDF (builds FAISS index):

```powershell
curl -X POST "http://localhost:8000/api/upload/pdf" -F "file=@C:\path\to\resume.pdf"
```

2. **Ask** about the document:

```powershell
$body = @{ message = "What skills are mentioned in my resume?"; use_rag = $true } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/api/chat" -Method POST -Body $body -ContentType "application/json"
```

Set `GITHUB_TOKEN` in `.env` ([GitHub token with models access](https://github.com/settings/tokens)).

### RAG stack

| Step | Tool |
|------|------|
| Chunking | LangChain `RecursiveCharacterTextSplitter` |
| Embeddings | Hugging Face `sentence-transformers/all-MiniLM-L6-v2` |
| Vector store | FAISS (`backend/vector_db/faiss_index/`) |
| LLM answers | GitHub Models only (`github_llm.py`) |

## Folder guide

See the main [README](../README.md) for the full project overview.

| Path | Purpose |
|------|---------|
| `app/main.py` | Creates the FastAPI app, CORS, registers routes |
| `app/config.py` | Loads settings from `.env` |
| `app/routes/` | HTTP endpoints (one file per feature) |
| `app/services/` | Business logic (chat, PDF extraction, etc.) |
| `app/models/` | Pydantic request/response schemas |
| `app/db/` | MongoDB helpers |
| `app/ai/` | LangChain + FAISS (add later) |
| `app/prompts/` | Prompt template files |
| `uploads/` | User-uploaded files |
| `vector_db/` | FAISS index storage |

## Adding a new route

1. Create `app/routes/my_feature.py` with an `APIRouter`.
2. Register it in `app/routes/__init__.py`.
3. Implement logic in `app/services/` — keep the route thin.

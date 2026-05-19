"""
Beginner-friendly RAG pipeline (Retrieval-Augmented Generation).

Steps:
  1. Chunk — split long PDF text into smaller pieces
  2. Embed — turn each chunk into a vector (numbers) with Hugging Face
  3. Store — save vectors in a FAISS index on disk
  4. Retrieve — find chunks most similar to the user's question
  5. Prompt — send those chunks + question to GitHub Models (via github_llm)
"""

from pathlib import Path

from fastapi import HTTPException, status
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings
from app.services import github_llm

# ---------------------------------------------------------------------------
# Paths & cached objects (loaded once per server process)
# ---------------------------------------------------------------------------

FAISS_INDEX_DIR = settings.vector_db_dir / "faiss_index"

_embeddings: HuggingFaceEmbeddings | None = None
_vectorstore: FAISS | None = None


def _get_embeddings() -> HuggingFaceEmbeddings:
    """
    Embeddings model: converts text → list of floats (a vector).

    Hugging Face downloads the model on first use (may take a minute).
    """
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name=settings.embedding_model,
        )
    return _embeddings


def _get_text_splitter() -> RecursiveCharacterTextSplitter:
    """
    Chunking: splits long text into overlapping pieces.

    - chunk_size: max characters per chunk
    - chunk_overlap: shared text between chunks so sentences aren't cut awkwardly
    """
    return RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )


# ---------------------------------------------------------------------------
# Step 1 — Chunking
# ---------------------------------------------------------------------------


def chunk_text(text: str, source: str = "document") -> list[Document]:
    """Split plain text into LangChain Document objects (page_content + metadata)."""
    splitter = _get_text_splitter()
    chunks = splitter.split_text(text)
    return [
        Document(page_content=chunk, metadata={"source": source, "chunk_id": i})
        for i, chunk in enumerate(chunks)
    ]


# ---------------------------------------------------------------------------
# Steps 2 & 3 — Embeddings + FAISS storage
# ---------------------------------------------------------------------------


def index_text(text: str, source: str = "document") -> int:
    """
    Build a new FAISS index from PDF text and save it to disk.

    Each upload replaces the previous index (one active document at a time).
    Returns the number of chunks stored.
    """
    global _vectorstore

    documents = chunk_text(text, source=source)
    if not documents:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No text chunks to index.",
        )

    embeddings = _get_embeddings()

    # FAISS builds an in-memory vector index from documents + embeddings
    _vectorstore = FAISS.from_documents(documents, embeddings)

    settings.vector_db_dir.mkdir(parents=True, exist_ok=True)
    _vectorstore.save_local(str(FAISS_INDEX_DIR))

    return len(documents)


def load_vectorstore() -> FAISS | None:
    """Load FAISS index from disk if it exists; otherwise return None."""
    global _vectorstore

    if _vectorstore is not None:
        return _vectorstore

    if not FAISS_INDEX_DIR.exists() or not any(FAISS_INDEX_DIR.iterdir()):
        return None

    embeddings = _get_embeddings()
    _vectorstore = FAISS.load_local(
        str(FAISS_INDEX_DIR),
        embeddings,
        allow_dangerous_deserialization=True,
    )
    return _vectorstore


def vectorstore_exists() -> bool:
    return FAISS_INDEX_DIR.exists() and any(FAISS_INDEX_DIR.iterdir())


# ---------------------------------------------------------------------------
# Step 4 — Retrieval (vector search)
# ---------------------------------------------------------------------------


def retrieve_relevant_chunks(query: str, k: int | None = None) -> list[Document]:
    """
    Vector search: compare the question's embedding to all chunk embeddings.

    Returns the top-k chunks with the smallest distance (most similar).
    """
    store = load_vectorstore()
    if store is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No document indexed yet. Upload a PDF first (POST /api/upload/pdf).",
        )

    top_k = k or settings.rag_top_k
    return store.similarity_search(query, k=top_k)


# ---------------------------------------------------------------------------
# Step 5 — Prompt creation + GitHub Models answer
# ---------------------------------------------------------------------------


def build_rag_user_prompt(question: str, chunks: list[Document]) -> str:
    """
    Combine retrieved chunks into one context block for the LLM.

    The model is instructed to answer only from this context when possible.
    """
    context_parts = []
    for i, doc in enumerate(chunks, start=1):
        context_parts.append(f"[Chunk {i}]\n{doc.page_content}")

    context = "\n\n".join(context_parts)

    return f"""Use the following excerpts from the user's uploaded document to answer the question.
If the answer is not in the context, say you don't see it in the document and give brief general advice.

--- DOCUMENT CONTEXT ---
{context}
--- END CONTEXT ---

Question: {question}

Answer clearly and helpfully:"""


def generate_rag_answer(question: str) -> tuple[str, int]:
    """
    Full RAG flow: retrieve chunks → build prompt → GitHub Models.

    Returns (answer_text, number_of_chunks_used).
    """
    chunks = retrieve_relevant_chunks(question)
    user_prompt = build_rag_user_prompt(question, chunks)

    system_prompt = github_llm.load_system_prompt()
    answer = github_llm.complete(system_prompt, user_prompt, temperature=0.5)

    return answer, len(chunks)

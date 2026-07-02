import uuid
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

from backend.pdf_utils import extract_pdf_text
from backend.llm_utils import (
    extract_pdf_metadata_and_claims,
    generate_chat_reply,
    check_reply_contradictions,
    generate_literature_review
)
from backend.cognee_utils import (
    init_db,
    add_paper_to_db,
    remember_paper,
    recall_context,
    get_all_papers_from_db,
    get_contradictions_from_db,
    get_claims_from_db,
    get_timeline_from_db,
    get_graph_from_db
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup SQLite database on startup
    init_db()
    yield

app = FastAPI(
    title="Research Paper Assistant API",
    description="Backend API powering the Cognee and Groq research assistant.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ChatMessage(BaseModel):
    role: str # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage]
    query_mode: str # 'cross-paper' | 'single-paper' | 'gap-finder' | 'research-qs'
    active_paper_id: Optional[str] = None

class ExportRequest(BaseModel):
    paper_ids: Optional[List[str]] = None

@app.get("/papers")
async def get_papers():
    """Retrieve all uploaded papers with their status badges."""
    try:
        return get_all_papers_from_db()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.post("/upload")
async def upload_paper(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Upload a PDF, extract metadata/claims using Groq, and ingest into Cognee."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        # 1. Read file bytes
        file_bytes = await file.read()
        
        # 2. Extract raw text
        text = extract_pdf_text(file_bytes)
        if not text.strip():
            raise HTTPException(status_code=400, detail="PDF has no extractable text.")
            
        # 3. Retrieve existing papers to detect relations
        existing = get_all_papers_from_db()
        
        # 4. Use LLM to extract title, authors, year, claims and relations
        metadata = extract_pdf_metadata_and_claims(text, existing)
        
        # 5. Generate a unique ID for this paper
        paper_id = f"paper_{uuid.uuid4().hex[:12]}"
        title = metadata.get("title", file.filename)
        authors = metadata.get("authors", "Unknown")
        year = metadata.get("year", 2026)
        summary = metadata.get("summary", "")
        consensus_status = metadata.get("consensus_status", "evolving")
        claims = metadata.get("claims", [])
        relations = metadata.get("relations", [])
        
        # 6. Add paper to SQL DB (sets status badge, timeline, and graph info)
        add_paper_to_db(
            paper_id=paper_id,
            title=title,
            authors=authors,
            year=year,
            summary=summary,
            consensus_status=consensus_status,
            claims=claims,
            relations=relations
        )
        
        # 7. Index paper text into Cognee in the background (prevent blocking endpoint)
        background_tasks.add_task(remember_paper, text, paper_id)
        
        return {
            "paper_id": paper_id,
            "title": title,
            "authors": authors,
            "year": year
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to process upload: {exc}")

@app.post("/chat")
async def chat_session(request: ChatRequest):
    """Handle chat messages, query Cognee for context, generate replies, and flag contradictions."""
    try:
        # 1. Recall semantic context from Cognee
        # We query with the user's message
        context = await recall_context(
            query=request.message,
            query_mode=request.query_mode,
            active_paper_id=request.active_paper_id
        )
        
        # 2. Convert message history to format expected by helper
        history_list = [{"role": msg.role, "content": msg.content} for msg in request.history]
        
        # 3. Generate response using Groq LLM wrapper
        reply = generate_chat_reply(
            query=request.message,
            context=context,
            history=history_list,
            query_mode=request.query_mode
        )
        
        # 4. Analyze reply for contradictions & claim counts
        validation = check_reply_contradictions(
            query=request.message,
            context=context,
            reply=reply
        )
        
        return {
            "reply": reply,
            "contradiction_detected": validation.get("contradiction_detected", False),
            "contradiction_detail": validation.get("contradiction_detail"),
            "claim_count": validation.get("claim_count", 0),
            "supporting_papers": validation.get("supporting_papers", [])
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.get("/contradictions")
async def get_contradictions():
    """Retrieve all contradiction cards."""
    try:
        return get_contradictions_from_db()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.get("/claims")
async def get_claims():
    """Retrieve all claim confidence metrics."""
    try:
        return get_claims_from_db()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.get("/timeline")
async def get_timeline():
    """Retrieve historical consensus timeline events."""
    try:
        return get_timeline_from_db()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.get("/graph")
async def get_graph():
    """Retrieve the paper relationship graph nodes and edges."""
    try:
        return get_graph_from_db()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.post("/export")
async def export_review(request: ExportRequest):
    """Generate and export a literature review in markdown format based on paper knowledge."""
    try:
        # Retrieve context relevant to literature review across requested papers or all
        # We query Cognee for a synthesis of all knowledge
        papers_filter = request.paper_ids if request.paper_ids else None
        
        # Generate summary query
        summary_query = "Summarize the key research objectives, findings, and consensus points in the paper library."
        
        context = await recall_context(
            query=summary_query,
            query_mode="cross-paper"
        )
        
        # Generate markdown via LLM
        markdown_str = generate_literature_review(context)
        
        return {"markdown": markdown_str}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

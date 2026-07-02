import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Get LLM API key and Model details
api_key = os.getenv("LLM_API_KEY")
raw_model = os.getenv("LLM_MODEL", "groq/llama-3.3-70b-versatile")

# Clean the model name for the official Groq client (e.g., removing 'groq/' prefix)
model_name = raw_model.replace("groq/", "") if raw_model else "llama-3.3-70b-versatile"

# Initialize Groq client
client = Groq(api_key=api_key) if api_key else None

def get_client() -> Groq:
    global client
    if not client:
        # Fallback reload check if api_key wasn't loaded initially
        key = os.getenv("LLM_API_KEY")
        if key:
            client = Groq(api_key=key)
        else:
            raise ValueError("Groq LLM_API_KEY is not set in environment or .env file.")
    return client

def extract_pdf_metadata_and_claims(text: str, existing_papers: list) -> dict:
    """
    Extract title, authors, year, claims, relationships, and consensus status from PDF text.
    Sends abstract/intro (approx. first 12,000 characters) to Groq in JSON mode.
    """
    groq_client = get_client()
    
    # We restrict text to first 12k chars to fit safely within rate limits while capturing intro/metadata.
    sample_text = text[:12000]
    
    existing_papers_summary = json.dumps([
        {"id": p.get("id"), "title": p.get("title"), "year": p.get("year")}
        for p in existing_papers
    ], indent=2)

    system_prompt = f"""You are an advanced scientific paper analyzer.
Your task is to extract paper metadata, key research claims, and map out how this paper relates to existing papers in the system.
You MUST output your response as a valid JSON object matching this exact schema:
{{
  "title": "Clean, official title of the paper",
  "authors": "Comma-separated list of authors, or 'Unknown'",
  "year": 2026, // publication year as integer
  "summary": "A 1-2 sentence high-level summary of the paper's key finding for a timeline.",
  "consensus_status": "strong_support", // MUST be one of: "strong_support", "reinforced", "fragmented", "evolving"
  "claims": [
    "Primary claim 1 text",
    "Primary claim 2 text"
  ],
  "relations": [
    {{
      "target_paper_title": "Title of existing paper (MUST match one of the titles in the existing list exactly if related)",
      "relation": "supports", // MUST be one of: "supports", "contradicts", "extends"
      "explanation": "Brief explanation of how this paper supports/contradicts/extends the target paper's claim"
    }}
  ]
}}

Here is the list of existing papers currently in the database:
{existing_papers_summary}

If there are no existing papers, keep 'relations' as an empty list [].
Verify that consensus_status is one of the four allowed strings.
"""

    try:
        response = groq_client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Extract details from the following paper text:\n\n{sample_text}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        result_content = response.choices[0].message.content
        return json.loads(result_content)
    except Exception as exc:
        print(f"Error during metadata extraction: {exc}")
        # Return fallback values
        return {
            "title": "Untitled Paper",
            "authors": "Unknown",
            "year": 2026,
            "summary": "Metadata extraction failed. Raw text ingested.",
            "consensus_status": "evolving",
            "claims": ["General research claim"],
            "relations": []
        }

def generate_chat_reply(query: str, context: str, history: list, query_mode: str) -> str:
    """
    Generate a conversational response based on query mode and retrieved Cognee context.
    """
    groq_client = get_client()

    # Formulate mode-specific instructions
    if query_mode == "single-paper":
        mode_instruction = (
            "Focus your answer ONLY on the provided paper's context. Do not make statements "
            "extrapolated beyond this context. If the answer cannot be found in the context, say so."
        )
    elif query_mode == "gap-finder":
        mode_instruction = (
            "Analyze the provided paper context specifically to identify unanswered questions, "
            "methodological gaps, limitations, or issues that the authors did not resolve. "
            "Format these gaps clearly as bullet points."
        )
    elif query_mode == "research-qs":
        mode_instruction = (
            "Based on the provided context, propose 3 to 5 future research questions. "
            "Make them specific, novel, and actionable. Add a brief sentence explaining why each question is high-impact."
        )
    else:  # cross-paper
        mode_instruction = (
            "Synthesize information across multiple papers provided in the context. "
            "Compare and contrast their findings. Cite the paper titles where appropriate."
        )

    system_prompt = f"""You are 'Antigravity Research Assistant', a premium scientific chatbot.
Your goal is to answer the user's questions based on the retrieved context from research papers.

Retrieved Context:
{context}

Mode-Specific Instructions:
{mode_instruction}

Answer the query accurately, maintaining a scientific and professional tone. Use markdown formatting for readability.
"""

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add chat history (format: [{'role': 'user'|'assistant', 'content': '...'}] )
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
        
    # Append the user's current message
    messages.append({"role": "user", "content": query})

    try:
        response = groq_client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.3
        )
        return response.choices[0].message.content
    except Exception as exc:
        return f"Error communicating with LLM: {exc}"

def check_reply_contradictions(query: str, context: str, reply: str) -> dict:
    """
    Check if the generated response is contradicted by any claims in the context,
    and count paper supports.
    """
    groq_client = get_client()

    system_prompt = """You are a scientific claim validator.
Analyze the user query, the context (knowledge from research papers), and the assistant's reply.
Determine if:
1. There is a contradiction or disagreement flagged between papers in the context regarding the claims made in the reply.
2. How many papers support the claims discussed in the reply.
3. Which specific papers support these claims.

You MUST output your response as a valid JSON object matching this exact schema:
{
  "contradiction_detected": false, // true if there is a contradiction in the papers regarding this topic
  "contradiction_detail": "Detailed explanation of the contradiction (e.g. Paper X claims A, whereas Paper Y claims B). Null if false.",
  "claim_count": 2, // number of papers in the context that support the main claim made in the reply
  "supporting_papers": ["Title of Paper A", "Title of Paper B"] // titles of supporting papers
}
"""

    user_content = f"""Query: {query}
Context: {context}
Reply: {reply}"""

    try:
        response = groq_client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        return json.loads(response.choices[0].message.content)
    except Exception as exc:
        print(f"Error checking contradictions: {exc}")
        return {
            "contradiction_detected": False,
            "contradiction_detail": None,
            "claim_count": 0,
            "supporting_papers": []
        }

def generate_literature_review(context: str) -> str:
    """
    Generate a structured literature review in markdown format based on retrieved knowledge graph context.
    """
    groq_client = get_client()

    system_prompt = """You are an expert academic writer.
Compile a structured, comprehensive literature review using the provided context from various research papers.
The literature review should include:
1. Executive Summary
2. Detailed Theme Analysis (grouping similar claims and comparing them)
3. Synthesis of Consensus and Contradictions
4. Identified Gaps and Future Work
5. Bibliography / List of Ingested Papers

Format the output in clean, professional Markdown. Use headings, bullet points, and tables where appropriate.
"""

    try:
        response = groq_client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Create literature review from this context:\n\n{context}"}
            ],
            temperature=0.4
        )
        return response.choices[0].message.content
    except Exception as exc:
        return f"# Literature Review\n\nError generating review: {exc}"

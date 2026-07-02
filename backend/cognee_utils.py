import os
import sqlite3
import uuid
import asyncio
import cognee

DB_PATH = os.path.join(os.path.dirname(__file__), "papers.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize SQLite database tables for structured insights."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Papers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS papers (
        id TEXT PRIMARY KEY,
        title TEXT UNIQUE,
        authors TEXT,
        year INTEGER,
        status TEXT DEFAULT 'under review'
    )
    """)
    
    # 2. Claims table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paper_id TEXT,
        claim_text TEXT,
        supporting INTEGER DEFAULT 0,
        contradicting INTEGER DEFAULT 0,
        total INTEGER DEFAULT 0,
        FOREIGN KEY(paper_id) REFERENCES papers(id) ON DELETE CASCADE
    )
    """)
    
    # 3. Contradictions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS contradictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim TEXT,
        paper_a TEXT,
        paper_b TEXT
    )
    """)
    
    # 4. Timeline table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS timeline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paper_id TEXT,
        year INTEGER,
        title TEXT,
        summary TEXT,
        consensus_status TEXT,
        FOREIGN KEY(paper_id) REFERENCES papers(id) ON DELETE CASCADE
    )
    """)
    
    # 5. Graph nodes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS graph_nodes (
        id TEXT PRIMARY KEY,
        label TEXT,
        year INTEGER
    )
    """)
    
    # 6. Graph edges
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS graph_edges (
        source TEXT,
        target TEXT,
        relation TEXT,
        PRIMARY KEY (source, target, relation),
        FOREIGN KEY(source) REFERENCES graph_nodes(id) ON DELETE CASCADE,
        FOREIGN KEY(target) REFERENCES graph_nodes(id) ON DELETE CASCADE
    )
    """)
    
    conn.commit()
    conn.close()

def get_all_papers_from_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, authors, year, status FROM papers")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def paper_title_exists(title: str) -> bool:
    """Check if a paper with the given title already exists in the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as cnt FROM papers WHERE title = ?", (title,))
    count = cursor.fetchone()["cnt"]
    conn.close()
    return count > 0

def get_contradictions_from_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT claim, paper_a, paper_b FROM contradictions")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_claims_from_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT claim_text, supporting, contradicting, total FROM claims")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_timeline_from_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT year, title, summary, consensus_status FROM timeline ORDER BY year ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_graph_from_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, label, year FROM graph_nodes")
    nodes = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT source, target, relation FROM graph_edges")
    edges = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    return {"nodes": nodes, "edges": edges}

def add_paper_to_db(paper_id: str, title: str, authors: str, year: int, summary: str, consensus_status: str, claims: list, relations: list):
    """Save paper metadata and process all relations and claim status changes."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert paper
        cursor.execute(
            "INSERT OR REPLACE INTO papers (id, title, authors, year, status) VALUES (?, ?, ?, ?, ?)",
            (paper_id, title, authors, year, 'under review')
        )
        
        # Insert into timeline
        cursor.execute(
            "INSERT OR REPLACE INTO timeline (paper_id, year, title, summary, consensus_status) VALUES (?, ?, ?, ?, ?)",
            (paper_id, year, title, summary, consensus_status)
        )
        
        # Insert into graph nodes
        cursor.execute(
            "INSERT OR REPLACE INTO graph_nodes (id, label, year) VALUES (?, ?, ?)",
            (paper_id, title, year)
        )
        
        # Save claims
        for claim in claims:
            cursor.execute(
                "INSERT INTO claims (paper_id, claim_text, supporting, contradicting, total) VALUES (?, ?, 0, 0, 0)",
                (paper_id, claim)
            )
            
        # Process relationships
        for rel in relations:
            target_title = rel.get("target_paper_title")
            relation_type = rel.get("relation")  # supports / contradicts / extends
            explanation = rel.get("explanation")
            
            # Find target paper ID
            cursor.execute("SELECT id FROM papers WHERE title = ?", (target_title,))
            target_row = cursor.fetchone()
            if target_row:
                target_id = target_row["id"]
                
                # Insert edge
                cursor.execute(
                    "INSERT OR IGNORE INTO graph_edges (source, target, relation) VALUES (?, ?, ?)",
                    (paper_id, target_id, relation_type)
                )
                
                # Process claim statistics and conflict lists
                if relation_type == "contradicts":
                    # Add to contradictions
                    cursor.execute(
                        "INSERT INTO contradictions (claim, paper_a, paper_b) VALUES (?, ?, ?)",
                        (explanation, title, target_title)
                    )
                    
                    # Update counts of any claim in target paper that fits
                    cursor.execute("UPDATE claims SET contradicting = contradicting + 1, total = total + 1 WHERE paper_id = ?", (target_id,))
                    cursor.execute("UPDATE claims SET contradicting = contradicting + 1, total = total + 1 WHERE paper_id = ?", (paper_id,))
                
                elif relation_type == "supports":
                    cursor.execute("UPDATE claims SET supporting = supporting + 1, total = total + 1 WHERE paper_id = ?", (target_id,))
                    cursor.execute("UPDATE claims SET supporting = supporting + 1, total = total + 1 WHERE paper_id = ?", (paper_id,))
                
                elif relation_type == "extends":
                    cursor.execute("UPDATE claims SET total = total + 1 WHERE paper_id = ?", (target_id,))
                    cursor.execute("UPDATE claims SET total = total + 1 WHERE paper_id = ?", (paper_id,))

        conn.commit()
        
        # Now recalculate status badges for all papers
        cursor.execute("SELECT id FROM papers")
        paper_ids = [row["id"] for row in cursor.fetchall()]
        
        for pid in paper_ids:
            # Count contradictions
            cursor.execute("SELECT COUNT(*) as count FROM graph_edges WHERE (source = ? OR target = ?) AND relation = 'contradicts'", (pid, pid))
            contradiction_count = cursor.fetchone()["count"]
            
            # Count supports
            cursor.execute("SELECT COUNT(*) as count FROM graph_edges WHERE (source = ? OR target = ?) AND relation = 'supports'", (pid, pid))
            support_count = cursor.fetchone()["count"]
            
            if contradiction_count > 0:
                status = f"{contradiction_count} contradiction{'s' if contradiction_count > 1 else ''}"
            elif support_count > 0:
                status = f"{support_count} claim{'s' if support_count > 1 else ''} verified"
            else:
                status = "under review"
                
            cursor.execute("UPDATE papers SET status = ? WHERE id = ?", (status, pid))
            
        conn.commit()

    except Exception as exc:
        conn.rollback()
        print(f"Database insertion failed: {exc}")
        raise exc
    finally:
        conn.close()

async def remember_paper(text: str, paper_id: str):
    """Index paper text in Cognee's Vector + Knowledge Graph store."""
    # Run remember asynchronously
    result = await cognee.remember(text, dataset_name=paper_id)
    # Await standard promise completion to ensure it's finished index block
    if hasattr(result, "status") and result.status == "running":
        await result

async def recall_context(query: str, query_mode: str, active_paper_id: str = None) -> str:
    """Recall matching context from Cognee based on query mode."""
    dataset_filter = None
    if query_mode == "single-paper" and active_paper_id:
        dataset_filter = [active_paper_id]
        
    try:
        # Recall from specific dataset or default all
        results = await cognee.recall(query_text=query, datasets=dataset_filter)
        if results:
            context_pieces = []
            for item in results:
                # Cognee Response entries usually contain a text block or node attributes
                text_val = getattr(item, "text", None)
                if not text_val and hasattr(item, "description"):
                    text_val = getattr(item, "description")
                if not text_val:
                    text_val = str(item)
                context_pieces.append(text_val)
            return "\n".join(context_pieces)
        return ""
    except Exception as exc:
        print(f"Cognee recall error: {exc}")
        return ""

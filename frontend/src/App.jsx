import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import InsightsPanel from "./components/InsightsPanel";

export default function App() {
  // App States
  const [papers, setPapers] = useState([]);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! Upload some PDFs in the sidebar, and let's explore their research claims. You can ask me to compare findings, find research gaps, or answer questions about a single paper.",
    },
  ]);
  const [activeTab, setActiveTab] = useState("chat");
  const [queryMode, setQueryMode] = useState("cross-paper");
  const [activePaperId, setActivePaperId] = useState(null);
  const [contradictions, setContradictions] = useState([]);
  const [claims, setClaims] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [isUploading, setIsUploading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);

  // Load initial data
  useEffect(() => {
    fetchPapers();
    fetchInsights();
  }, []);

  const fetchPapers = async () => {
    try {
      const res = await fetch("/papers");
      if (res.ok) {
        const data = await res.json();
        setPapers(data);
      }
    } catch (err) {
      console.error("Error fetching papers:", err);
    }
  };

  const fetchInsights = async () => {
    try {
      const [resContradictions, resClaims, resTimeline, resGraph] = await Promise.all([
        fetch("/contradictions"),
        fetch("/claims"),
        fetch("/timeline"),
        fetch("/graph"),
      ]);

      if (resContradictions.ok) {
        setContradictions(await resContradictions.json());
      }
      if (resClaims.ok) {
        setClaims(await resClaims.json());
      }
      if (resTimeline.ok) {
        setTimeline(await resTimeline.json());
      }
      if (resGraph.ok) {
        setGraph(await resGraph.json());
      }
    } catch (err) {
      console.error("Error fetching insights:", err);
    }
  };

  const handleUpload = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || "Upload failed");
        return;
      }

      const newPaper = await res.json();
      // Select the newly uploaded paper as active
      setActivePaperId(newPaper.paper_id);

      // Refresh paper list and graph/claims/timeline info
      await fetchPapers();
      await fetchInsights();
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Error uploading PDF");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || isChatting) return;

    // Append user message
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsChatting(true);

    // Format chat history (excluding current message)
    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          query_mode: queryMode,
          active_paper_id: activePaperId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to get reply");
      }

      const replyData = await res.json();

      // Append bot message with metadata
      const botMsg = {
        role: "assistant",
        content: replyData.reply,
        contradiction_detected: replyData.contradiction_detected,
        contradiction_detail: replyData.contradiction_detail,
        claim_count: replyData.claim_count,
        supporting_papers: replyData.supporting_papers,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Refresh insights live as we chat
      await fetchInsights();
    } catch (err) {
      console.error("Error during chat:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${err.message}`,
        },
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper_ids: activePaperId ? [activePaperId] : null,
        }),
      });

      if (!res.ok) {
        alert("Failed to export literature review");
        return;
      }

      const data = await res.json();
      const markdown = data.markdown;

      // Trigger download
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `literature_review_${activePaperId || "all"}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting review:", err);
      alert("Error generating download file");
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans text-[13px] antialiased">
      {/* ─── Solid Header Bar ────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 bg-zinc-950 border-b border-zinc-800/80 flex-shrink-0 z-10 select-none">
        <div className="flex items-center gap-3">
          {/* Flat logo with subtle blue hover styling */}
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500 shadow-inner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <h1 className="text-[13.5px] font-semibold tracking-tight text-zinc-200 flex items-center gap-1.5">
              CogniCite
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-900/30">Beta</span>
            </h1>
            <p className="text-[10px] text-zinc-500 tracking-wide font-medium">Research Consensus & Claim Verification</p>
          </div>
        </div>

        {/* Flat Stats Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-medium text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {papers.length} paper{papers.length !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-medium text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {claims.length} claim{claims.length !== 1 ? "s" : ""}
          </div>
          {contradictions.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-red-950/20 border border-red-900/30 text-[10px] font-medium text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {contradictions.length} conflict{contradictions.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </header>

      {/* ─── Main Panels Layout ──────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* 1. Left Sidebar */}
        <Sidebar
          papers={papers}
          activePaperId={activePaperId}
          setActivePaperId={setActivePaperId}
          onUpload={handleUpload}
          isUploading={isUploading}
        />

        {/* 2. Center Panel */}
        <ChatPanel
          messages={messages}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          queryMode={queryMode}
          setQueryMode={setQueryMode}
          activePaperId={activePaperId}
          papers={papers}
          timeline={timeline}
          graph={graph}
          onSendMessage={handleSendMessage}
          isChatting={isChatting}
        />

        {/* 3. Right Panel */}
        <InsightsPanel
          contradictions={contradictions}
          claims={claims}
          timeline={timeline}
          onExport={handleExport}
        />
      </div>
    </div>
  );
}

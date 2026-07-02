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
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans text-[13px] antialiased">
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
  );
}

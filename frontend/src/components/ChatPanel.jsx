import React, { useState, useRef, useEffect } from "react";
import Timeline from "./Timeline";
import GraphMap from "./GraphMap";

export default function ChatPanel({
  messages,
  activeTab,
  setActiveTab,
  queryMode,
  setQueryMode,
  activePaperId,
  papers,
  timeline,
  graph,
  onSendMessage,
  isChatting,
}) {
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatting]);

  const handleSend = () => {
    if (!input.trim() || isChatting) return;
    onSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Find active paper name for chips display
  const activePaper = papers.find((p) => p.id === activePaperId);

  // Helper to render simple text with basic Markdown features (bold, bullets, paragraphs)
  const formatMessageContent = (text) => {
    if (!text) return "";
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let content = line;
      
      // Check for bullet list
      const isBullet = content.trim().startsWith("- ") || content.trim().startsWith("* ");
      if (isBullet) {
        content = content.replace(/^[\s]*[-*]\s+/, "");
      }

      // Check for headers
      const isHeader = content.trim().startsWith("### ") || content.trim().startsWith("## ");
      if (isHeader) {
        content = content.replace(/^[\s]*#+\s+/, "");
      }

      // Replace bold syntax **text** with standard React nodes
      const splitParts = content.split("**");
      const renderedParts = splitParts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} className="font-bold text-zinc-100">{part}</strong>;
        }
        return part;
      });

      if (isHeader) {
        return (
          <h4 key={idx} className="text-sm font-semibold text-zinc-100 mt-3 mb-1">
            {renderedParts}
          </h4>
        );
      }

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc text-zinc-300 leading-relaxed text-[12.5px] py-0.5">
            {renderedParts}
          </li>
        );
      }

      return (
        <p key={idx} className="text-zinc-300 leading-relaxed text-[12.5px] mb-2 min-h-[6px]">
          {renderedParts}
        </p>
      );
    });
  };

  return (
    <main className="flex-1 h-full flex flex-col bg-[#05050a]">
      {/* Top Header Tabs - Solid Obsidian tech layout */}
      <div className="flex items-center justify-between border-b border-[#1e1c31] bg-[#07070d] px-6 py-2.5">
        <div className="flex space-x-1">
          {["chat", "timeline", "graph"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-1.5 px-3.5 text-[11.5px] font-semibold rounded transition-all-custom capitalize cursor-pointer border ${
                activeTab === tab
                  ? "bg-[#12111f] border-[#1e1c31] text-indigo-400 font-bold glow-indigo"
                  : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab === "graph" ? "Graph map" : tab}
            </button>
          ))}
        </div>

        {activePaper && (
          <div className="text-[10px] text-zinc-400 bg-[#0b0a12] px-3 py-1 rounded border border-[#1e1c31] flex items-center gap-1.5 max-w-[280px] animate-fade-in font-semibold">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
            <span className="truncate" title={activePaper.title}>
              Active: {activePaper.title}
            </span>
          </div>
        )}
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === "chat" && (
          <>
            {/* Query Mode Chips Bar */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-[#1e1c31]/30 bg-[#05050a] overflow-x-auto select-none">
              {[
                { id: "cross-paper", label: "Cross-paper" },
                { id: "single-paper", label: "Single paper" },
                { id: "gap-finder", label: "Gap finder" },
                { id: "research-qs", label: "Research Qs" },
              ].map((chip) => {
                const isSingleDisabled = chip.id === "single-paper" && !activePaperId;
                const isActive = queryMode === chip.id;

                return (
                  <button
                    key={chip.id}
                    disabled={isSingleDisabled}
                    onClick={() => setQueryMode(chip.id)}
                    className={`px-3 py-1 rounded text-[10.5px] font-semibold transition-all-custom select-none cursor-pointer border whitespace-nowrap ${
                      isActive
                        ? "bg-indigo-950/40 border-indigo-900/60 text-indigo-400"
                        : isSingleDisabled
                        ? "opacity-30 border-[#1e1c31] text-zinc-700 cursor-not-allowed"
                        : "bg-[#0b0a12] border-[#1e1c31] text-zinc-500 hover:text-zinc-300 hover:bg-[#12111f]"
                    }`}
                    title={isSingleDisabled ? "Select a paper in the sidebar to enable Single paper mode" : ""}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar bg-[#05050a]">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div key={index} className="flex gap-4.5 animate-fade-in-up items-start max-w-4xl mx-auto w-full">
                    {/* Avatars */}
                    <div className={`w-8.5 h-8.5 rounded flex items-center justify-center flex-shrink-0 text-[11px] font-bold border ${
                      isUser 
                        ? "bg-indigo-950/40 text-indigo-400 border-indigo-900/35 glow-indigo" 
                        : "bg-[#0b0a12] text-zinc-400 border-[#1e1c31]"
                    }`}>
                      {isUser ? "U" : "AI"}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase select-none flex items-center gap-1.5">
                        {isUser ? "You" : "Antigravity Assistant"}
                        {!isUser && <span className="w-1 h-1 rounded-full bg-indigo-500"></span>}
                      </div>
                      
                      <div
                        className={`p-4 rounded border text-[12.5px] leading-relaxed shadow-sm ${
                          isUser
                            ? "bg-[#16142c] text-zinc-200 border-[#29264c]"
                            : "bg-[#0e0d1a] text-zinc-350 border-[#1d1b33]"
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          formatMessageContent(msg.content)
                        )}
                      </div>

                      {/* Metadata Badges for Assistant Replies */}
                      {!isUser && (
                        <div className="flex flex-col gap-1.5 mt-2">
                          {/* Contradiction Tag */}
                          {msg.contradiction_detected && (
                            <div className="flex items-start gap-1.5 max-w-2xl text-[10.5px] font-semibold text-red-400 bg-red-950/15 border border-red-900/40 rounded px-3 py-1.5 animate-fade-in">
                              <span className="mt-0.5">⚠️</span>
                              <span>{msg.contradiction_detail || "Contradiction flagged in recalled sources"}</span>
                            </div>
                          )}

                          {/* Claim Count Tag */}
                          {msg.claim_count > 0 && (
                            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-400 bg-emerald-950/15 border border-emerald-900/40 rounded px-3 py-1.5 w-max group relative select-none animate-fade-in">
                              <span>✓</span>
                              <span>{msg.claim_count} papers support this claim</span>
                              
                              {/* Simple tooltip details */}
                              {msg.supporting_papers && msg.supporting_papers.length > 0 && (
                                <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block bg-[#0b0a12] border border-[#1e1c31] text-zinc-400 text-[10px] p-2.5 rounded w-[250px] pointer-events-none shadow-xl">
                                  <p className="font-bold text-zinc-300 mb-1 border-b border-[#1e1c31] pb-1">Supporting papers:</p>
                                  <ul className="list-disc pl-3.5 space-y-1 font-semibold">
                                    {msg.supporting_papers.map((title, pIdx) => (
                                      <li key={pIdx} className="truncate">{title}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isChatting && (
                <div className="flex gap-4.5 items-start animate-fade-in max-w-4xl mx-auto w-full">
                  <div className="w-8.5 h-8.5 rounded bg-[#0b0a12] border border-[#1e1c31] flex items-center justify-center text-[11px] font-bold text-zinc-650 animate-pulse">
                    ...
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider select-none">
                      Thinking...
                    </div>
                    <div className="flex mr-auto bg-[#0e0d1a] border border-[#1d1b33] rounded p-4 w-max">
                      <div className="flex items-center space-x-1.5 py-1">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Row */}
            <div className="p-4 border-t border-[#1e1c31]/60 bg-[#05050a]">
              <div className="flex items-center gap-2 bg-[#0b0a12] border border-[#1e1c31] rounded px-4 py-3 focus-within:border-[#2e2a4a] transition-all-custom max-w-4xl mx-auto w-full">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    queryMode === "single-paper"
                      ? "Ask questions about the active paper..."
                      : "Type your query..."
                  }
                  rows="1"
                  className="flex-1 bg-transparent border-0 outline-none text-zinc-200 placeholder-zinc-500 text-[12.5px] resize-none h-6 py-0.5 custom-scrollbar"
                />
                
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isChatting}
                  className="px-3.5 py-1.5 bg-[#12111f] hover:bg-[#1a192e] border border-[#1e1c31] hover:border-[#2e2a4a] disabled:opacity-50 disabled:bg-[#0b0a12] disabled:text-zinc-650 text-indigo-400 hover:text-indigo-300 font-bold rounded transition-all-custom cursor-pointer active:scale-95 text-[11px] glow-indigo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === "timeline" && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#05050a]">
            <Timeline timeline={timeline} />
          </div>
        )}

        {activeTab === "graph" && (
          <div className="flex-1 overflow-hidden bg-[#05050a]">
            <GraphMap graph={graph} />
          </div>
        )}
      </div>
    </main>
  );
}

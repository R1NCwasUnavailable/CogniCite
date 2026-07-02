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
    <main className="flex-1 h-full flex flex-col bg-zinc-950">
      {/* Top Header Tabs - Solid tech layout */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950 px-6 py-2">
        <div className="flex space-x-1">
          {["chat", "timeline", "graph"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-1.5 px-3.5 text-[12.5px] font-medium rounded transition-all-custom capitalize cursor-pointer border ${
                activeTab === tab
                  ? "bg-zinc-900 border-zinc-800 text-blue-400 font-semibold"
                  : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab === "graph" ? "Graph map" : tab}
            </button>
          ))}
        </div>

        {activePaper && (
          <div className="text-[11px] text-zinc-400 bg-zinc-900 px-3 py-1 rounded border border-zinc-800/80 flex items-center gap-1.5 max-w-[280px] animate-fade-in font-medium">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
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
            <div className="flex items-center gap-2 px-6 py-3 border-b border-zinc-800/40 bg-zinc-950 overflow-x-auto select-none">
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
                    className={`px-3 py-1 rounded text-[11px] font-medium transition-all-custom select-none cursor-pointer border whitespace-nowrap ${
                      isActive
                        ? "bg-blue-950/40 border-blue-900/60 text-blue-400"
                        : isSingleDisabled
                        ? "opacity-30 border-zinc-900 text-zinc-600 cursor-not-allowed"
                        : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
                    }`}
                    title={isSingleDisabled ? "Select a paper in the sidebar to enable Single paper mode" : ""}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 custom-scrollbar">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div key={index} className="flex gap-3 animate-fade-in-up items-start">
                    {/* Avatars */}
                    <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 text-[11px] font-bold ${
                      isUser 
                        ? "bg-blue-600/10 text-blue-400 border border-blue-900/30" 
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                    }`}>
                      {isUser ? "U" : "AI"}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase select-none">
                        {isUser ? "You" : "Antigravity Assistant"}
                      </div>
                      
                      <div
                        className={`max-w-[85%] p-3.5 rounded text-[12.5px] border ${
                          isUser
                            ? "bg-blue-950/20 text-zinc-150 border-blue-900/40"
                            : "bg-zinc-900 text-zinc-300 border-zinc-850"
                        }`}
                      >
                        {isUser ? (
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          formatMessageContent(msg.content)
                        )}
                      </div>

                      {/* Metadata Badges for Assistant Replies */}
                      {!isUser && (
                        <div className="flex flex-col gap-1.5 mt-2">
                          {/* Contradiction Tag */}
                          {msg.contradiction_detected && (
                            <div className="flex items-start gap-1.5 max-w-[85%] text-[10.5px] font-medium text-red-400 bg-red-950/20 border border-red-900/50 rounded px-2.5 py-1 animate-fade-in">
                              <span className="mt-0.5">⚠️</span>
                              <span>{msg.contradiction_detail || "Contradiction flagged in recalled sources"}</span>
                            </div>
                          )}

                          {/* Claim Count Tag */}
                          {msg.claim_count > 0 && (
                            <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 rounded px-2.5 py-1 w-max group relative select-none animate-fade-in">
                              <span>✓</span>
                              <span>{msg.claim_count} papers support this claim</span>
                              
                              {/* Simple tooltip details */}
                              {msg.supporting_papers && msg.supporting_papers.length > 0 && (
                                <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] p-2 rounded w-[240px] pointer-events-none shadow-xl">
                                  <p className="font-semibold text-zinc-200 mb-1 border-b border-zinc-850 pb-0.5">Supporting papers:</p>
                                  <ul className="list-disc pl-3.5 space-y-0.5 font-medium">
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
                <div className="flex gap-3 items-start animate-fade-in">
                  <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-500 animate-pulse">
                    ...
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider select-none">
                      Thinking...
                    </div>
                    <div className="flex mr-auto bg-zinc-900 text-zinc-400 border border-zinc-850 rounded p-3.5 w-max">
                      <div className="flex items-center space-x-1.5 py-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Row */}
            <div className="p-4 border-t border-zinc-800/80 bg-zinc-950">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800/80 rounded px-4 py-2.5 focus-within:border-zinc-700 transition-all-custom">
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
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium rounded transition-all-custom cursor-pointer active:scale-95 text-[11.5px] border border-blue-500/10"
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
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-zinc-950">
            <Timeline timeline={timeline} />
          </div>
        )}

        {activeTab === "graph" && (
          <div className="flex-1 overflow-hidden bg-zinc-950">
            <GraphMap graph={graph} />
          </div>
        )}
      </div>
    </main>
  );
}

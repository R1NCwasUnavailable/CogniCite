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
      {/* Top Header Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/40 px-6 py-2">
        <div className="flex space-x-4">
          {["chat", "timeline", "graph"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 text-sm font-medium border-b-2 transition-all-custom capitalize cursor-pointer ${
                activeTab === tab
                  ? "border-blue-500 text-blue-400 font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab === "graph" ? "Graph map" : tab}
            </button>
          ))}
        </div>

        {activePaper && (
          <div className="text-[11px] text-zinc-400 bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-800 flex items-center gap-1.5 max-w-[280px]">
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
            <div className="flex items-center gap-2 px-6 py-3 border-b border-zinc-800/40 bg-zinc-900/20 overflow-x-auto">
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
                    className={`px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all-custom select-none cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-blue-600/10 border-blue-500 text-blue-400"
                        : isSingleDisabled
                        ? "opacity-30 border-zinc-800 text-zinc-600 cursor-not-allowed"
                        : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                    }`}
                    title={isSingleDisabled ? "Select a paper in the sidebar to enable Single paper mode" : ""}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div key={index} className="flex flex-col">
                    <div
                      className={`max-w-[75%] p-3.5 rounded-2xl text-[12.5px] border ${
                        isUser
                          ? "ml-auto bg-blue-600 text-zinc-100 border-blue-500 rounded-br-none shadow-md shadow-blue-600/10"
                          : "mr-auto bg-zinc-900/50 text-zinc-300 border-zinc-800/80 rounded-bl-none"
                      }`}
                    >
                      {isUser ? (
                        <p className="leading-relaxed">{msg.content}</p>
                      ) : (
                        formatMessageContent(msg.content)
                      )}
                    </div>

                    {/* Metadata Badges for Assistant Replies */}
                    {!isUser && (
                      <div className="flex flex-col gap-1.5 mt-1.5 ml-1">
                        {/* Contradiction Tag */}
                        {msg.contradiction_detected && (
                          <div className="flex items-start gap-1.5 max-w-[75%] text-[10.5px] font-medium text-red-400 bg-red-950/20 border border-red-900/60 rounded px-2.5 py-1">
                            <span className="mt-0.5">⚠️</span>
                            <span>{msg.contradiction_detail || "Contradiction flagged in recalled sources"}</span>
                          </div>
                        )}

                        {/* Claim Count Tag */}
                        {msg.claim_count > 0 && (
                          <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-emerald-400 bg-emerald-950/20 border border-emerald-900/60 rounded px-2.5 py-1 w-max group relative">
                            <span>✓</span>
                            <span>{msg.claim_count} papers support this claim</span>
                            
                            {/* Simple tooltip details */}
                            {msg.supporting_papers && msg.supporting_papers.length > 0 && (
                              <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] p-2 rounded shadow-xl z-10 w-[240px] pointer-events-none">
                                <p className="font-semibold text-zinc-200 mb-1 border-b border-zinc-800 pb-0.5">Supporting papers:</p>
                                <ul className="list-disc pl-3.5 space-y-0.5">
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
                );
              })}

              {isChatting && (
                <div className="flex mr-auto bg-zinc-900/50 text-zinc-400 border border-zinc-800/80 rounded-2xl rounded-bl-none p-3.5 max-w-[75%]">
                  <div className="flex items-center space-x-1.5 py-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Row */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/10">
              <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2 focus-within:border-blue-500/60 transition-all-custom">
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
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium rounded-lg transition-all-custom cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === "timeline" && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <Timeline timeline={timeline} />
          </div>
        )}

        {activeTab === "graph" && (
          <div className="flex-1 overflow-hidden">
            <GraphMap graph={graph} />
          </div>
        )}
      </div>
    </main>
  );
}

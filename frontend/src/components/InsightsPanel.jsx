import React from "react";

export default function InsightsPanel({ contradictions, claims, timeline, onExport }) {
  // Get 4 most recent entries in timeline for the compact view
  const recentTimeline = timeline
    .slice()
    .sort((a, b) => b.year - a.year) // descending order to show most recent at top
    .slice(0, 4);

  // Helper for timeline status dots
  const getTimelineDotColor = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "strong_support":
        return "bg-blue-500";
      case "reinforced":
        return "bg-emerald-500";
      case "fragmented":
        return "bg-red-500";
      default:
        return "bg-amber-500";
    }
  };

  return (
    <aside className="w-[280px] h-full flex flex-col bg-zinc-900 border-l border-zinc-800/80">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Section 1: Contradictions */}
        <div>
          <h3 className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px] mb-3">
            Contradictions
          </h3>
          
          {contradictions.length === 0 ? (
            <div className="text-zinc-500 text-center py-5 border border-zinc-850 rounded text-[11px] animate-fade-in bg-zinc-950/20">
              No contradictions flagged.
            </div>
          ) : (
            <div className="space-y-3">
              {contradictions.map((item, index) => (
                <div
                  key={index}
                  className="bg-red-950/15 border border-red-900/30 p-3.5 rounded text-zinc-300 animate-slide-left hover:border-red-900/50 transition-colors"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <p className="font-semibold text-[11.5px] leading-snug mb-2.5 text-red-200">
                    "{item.claim}"
                  </p>
                  <div className="text-[10px] text-red-400/80 font-semibold flex items-center gap-1.5 border-t border-red-900/20 pt-2">
                    <svg className="w-3.5 h-3.5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="truncate" title={`${item.paper_a} vs ${item.paper_b}`}>
                      {item.paper_a} <span className="text-red-500 font-normal">vs</span> {item.paper_b}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Claim Confidence */}
        <div>
          <h3 className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px] mb-3">
            Claim confidence
          </h3>
          
          {claims.length === 0 ? (
            <div className="text-zinc-500 text-center py-5 border border-zinc-850 rounded text-[11px] animate-fade-in bg-zinc-950/20">
              No claims evaluated.
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((item, index) => {
                const total = item.total || 1;
                const ratio = Math.min((item.supporting / total) * 100, 100);
                
                return (
                  <div key={index} className="space-y-2 animate-slide-left" style={{ animationDelay: `${index * 60}ms` }}>
                    <p className="text-zinc-300 font-medium leading-snug text-[11.5px] line-clamp-2">
                      {item.claim_text}
                    </p>
                    
                    {/* Progress Bar Container */}
                    <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/40">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                    
                    {/* Stats details */}
                    <div className="text-[10px] text-zinc-500 flex items-center justify-between font-medium">
                      <span>{item.supporting} support · {item.contradicting} contradict</span>
                      <span className="font-semibold text-zinc-400">{Math.round(ratio)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: Consensus Timeline (Compact) */}
        <div>
          <h3 className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px] mb-3">
            Consensus timeline
          </h3>
          
          {recentTimeline.length === 0 ? (
            <div className="text-zinc-500 text-center py-5 border border-zinc-850 rounded text-[11px] animate-fade-in bg-zinc-950/20">
              Timeline is empty.
            </div>
          ) : (
            <div className="border-l border-zinc-800 ml-1.5 pl-3.5 space-y-4 py-1">
              {recentTimeline.map((item, index) => (
                <div key={index} className="relative text-[11px] animate-slide-left" style={{ animationDelay: `${index * 60}ms` }}>
                  {/* Status Dot */}
                  <span
                    className={`absolute -left-[19.5px] top-1.5 w-2 h-2 rounded-full ring-2 ring-zinc-900 ${getTimelineDotColor(
                      item.consensus_status
                    )}`}
                  />
                  <div className="text-zinc-500 text-[10px] mb-0.5 font-medium">
                    {item.year}
                  </div>
                  <div className="font-medium text-zinc-300 line-clamp-2 leading-tight">
                    {item.title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export Button Area */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/40">
        <button
          onClick={onExport}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-medium rounded transition-all-custom cursor-pointer active:scale-98 text-[12px]"
        >
          <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Export literature review</span>
        </button>
      </div>
    </aside>
  );
}

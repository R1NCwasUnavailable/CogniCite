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
    <aside className="w-[280px] h-full flex flex-col bg-zinc-900/70 border-l border-zinc-800 backdrop-blur-md">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Section 1: Contradictions */}
        <div>
          <h3 className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px] mb-3">
            Contradictions
          </h3>
          
          {contradictions.length === 0 ? (
            <div className="text-zinc-500 text-center py-4 border border-dashed border-zinc-800/80 rounded-lg text-[11px]">
              No contradictions flagged.
            </div>
          ) : (
            <div className="space-y-2.5">
              {contradictions.map((item, index) => (
                <div
                  key={index}
                  className="bg-red-950/20 border border-red-900/30 p-3 rounded-lg text-zinc-300"
                >
                  <p className="font-semibold text-[11.5px] leading-snug mb-2 text-red-200">
                    "{item.claim}"
                  </p>
                  <div className="text-[10px] text-red-400/80 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="truncate">
                      {item.paper_a} <span className="text-red-500">vs</span> {item.paper_b}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Claim Confidence */}
        <div>
          <h3 className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px] mb-3">
            Claim confidence
          </h3>
          
          {claims.length === 0 ? (
            <div className="text-zinc-500 text-center py-4 border border-dashed border-zinc-800/80 rounded-lg text-[11px]">
              No claims evaluated.
            </div>
          ) : (
            <div className="space-y-3.5">
              {claims.map((item, index) => {
                const total = item.total || 1;
                const ratio = Math.min((item.supporting / total) * 100, 100);
                
                return (
                  <div key={index} className="space-y-1.5">
                    <p className="text-zinc-200 font-medium leading-snug text-[11.5px] line-clamp-2">
                      {item.claim_text}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-zinc-850 rounded-full overflow-hidden border border-zinc-800/40">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                    
                    {/* Stats */}
                    <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                      <span>{item.supporting} support · {item.contradicting} contradict</span>
                      <span className="font-semibold text-zinc-300">{Math.round(ratio)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: Consensus Timeline (Compact) */}
        <div>
          <h3 className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px] mb-3">
            Consensus timeline
          </h3>
          
          {recentTimeline.length === 0 ? (
            <div className="text-zinc-500 text-center py-4 border border-dashed border-zinc-800/80 rounded-lg text-[11px]">
              Timeline is empty.
            </div>
          ) : (
            <div className="border-l border-zinc-800 ml-1.5 pl-3.5 space-y-3.5 py-1">
              {recentTimeline.map((item, index) => (
                <div key={index} className="relative text-[11px]">
                  {/* Status Dot */}
                  <span
                    className={`absolute -left-[19.5px] top-1 w-2.5 h-2.5 rounded-full ring-2 ring-zinc-950 ${getTimelineDotColor(
                      item.consensus_status
                    )}`}
                  />
                  <div className="text-zinc-400 text-[10px] mb-0.5">
                    {item.year}
                  </div>
                  <div className="font-medium text-zinc-200 line-clamp-2 leading-tight">
                    {item.title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export Button Area */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/20">
        <button
          onClick={onExport}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-200 hover:text-white font-medium rounded-lg transition-all-custom cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" stroke="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="text-[12px]">Export literature review</span>
        </button>
      </div>
    </aside>
  );
}

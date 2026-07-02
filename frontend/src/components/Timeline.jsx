import React from "react";

export default function Timeline({ timeline }) {
  // Helper to resolve status colors
  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "strong_support":
        return {
          dot: "bg-blue-500 border-blue-400 ring-blue-500/20 shadow-blue-500/20",
          text: "text-blue-400 bg-blue-950/20 border-blue-900/40",
          label: "Strong Support",
        };
      case "reinforced":
        return {
          dot: "bg-emerald-500 border-emerald-400 ring-emerald-500/20 shadow-emerald-500/20",
          text: "text-emerald-400 bg-emerald-950/20 border-emerald-900/40",
          label: "Reinforced",
        };
      case "fragmented":
        return {
          dot: "bg-red-500 border-red-400 ring-red-500/20 shadow-red-500/20",
          text: "text-red-400 bg-red-950/20 border-red-900/40",
          label: "Fragmented",
        };
      default: // evolving
        return {
          dot: "bg-amber-500 border-amber-400 ring-amber-500/20 shadow-amber-500/20",
          text: "text-amber-400 bg-amber-950/20 border-amber-900/40",
          label: "Evolving",
        };
    }
  };

  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <svg className="w-10 h-10 mb-3 opacity-40 text-zinc-400 animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs">No timeline data available. Ingest research papers to build the timeline.</p>
      </div>
    );
  }

  return (
    <div className="relative border-l border-zinc-800 ml-4 pl-8 py-2 space-y-8 max-w-2xl mx-auto">
      {timeline.map((item, index) => {
        const status = getStatusColor(item.consensus_status);
        
        return (
          <div key={index} className="relative group animate-slide-left" style={{ animationDelay: `${index * 60}ms` }}>
            {/* Timeline Dot */}
            <span
              className={`absolute -left-[38px] top-1.5 w-4 h-4 rounded-full border-2 ring-4 ring-zinc-950 shadow-md ${status.dot} transition-all-custom`}
            />

            {/* Event Block */}
            <div className="bg-zinc-900 border border-zinc-800/80 p-4.5 rounded transition-all-custom group-hover:border-zinc-700 shadow-lg shadow-black/10">
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-[13px] font-bold text-zinc-200 bg-zinc-950 px-2.5 py-0.5 rounded border border-zinc-800/80 shadow-inner">
                  {item.year}
                </span>
                
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${status.text}`}>
                  {status.label}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-zinc-200 text-[13.5px] mb-2 group-hover:text-blue-400 transition-colors duration-150">
                {item.title}
              </h3>

              {/* Summary */}
              <p className="text-zinc-400 leading-relaxed text-[12px] font-medium">
                {item.summary}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

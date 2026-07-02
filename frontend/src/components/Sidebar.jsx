import React, { useRef } from "react";

export default function Sidebar({ papers, activePaperId, setActivePaperId, onUpload, isUploading }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
      e.target.value = "";  // Reset so the same file can be re-uploaded
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Get status badge styling
  const getBadgeStyle = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("contradiction")) {
      return "text-red-400 bg-red-950/40 border-red-900/60";
    }
    if (s.includes("claim") || s.includes("verified")) {
      return "text-emerald-400 bg-emerald-950/40 border-emerald-900/60";
    }
    return "text-amber-400 bg-amber-950/40 border-amber-900/60";
  };

  return (
    <aside className="w-[260px] h-full flex flex-col bg-zinc-900 border-r border-zinc-800/80 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/80">
        <h2 className="font-semibold text-[13px] text-zinc-300">
          Papers ({papers.length})
        </h2>
        
        <button
          onClick={triggerFileInput}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded transition-all-custom cursor-pointer text-[11.5px] border border-blue-500/10 active:scale-95"
        >
          {isUploading ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="M12 5v14"/>
            </svg>
          )}
          <span>Add PDF</span>
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
        />
      </div>

      {/* Paper List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
        {papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-600 text-center px-4 animate-fade-in">
            <svg className="w-7 h-7 mb-2 opacity-50 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <p className="text-[11px] font-medium">No papers uploaded yet.</p>
          </div>
        ) : (
          papers.map((paper, index) => {
            const isActive = activePaperId === paper.id;
            return (
              <div
                key={paper.id}
                onClick={() => setActivePaperId(isActive ? null : paper.id)}
                className={`p-3 rounded border transition-all-custom cursor-pointer animate-slide-left ${
                  isActive
                    ? "bg-zinc-800/80 border-blue-500/60 shadow shadow-blue-500/5 relative after:content-[''] after:absolute after:left-0 after:top-2 after:bottom-2 after:w-[3px] after:bg-blue-500 after:rounded-r"
                    : "bg-zinc-900 border-zinc-850 hover:bg-zinc-800/50 hover:border-zinc-800"
                }`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {/* Title */}
                <h4 className="font-medium text-zinc-200 line-clamp-2 leading-snug mb-1 text-[12.5px]" title={paper.title}>
                  {paper.title}
                </h4>

                {/* Metadata */}
                <div className="text-[10.5px] text-zinc-500 line-clamp-1 mb-2 font-medium">
                  {paper.authors} • {paper.year}
                </div>

                {/* Badge */}
                <div className="flex">
                  <span className={`px-2 py-0.5 text-[9px] font-medium rounded border ${getBadgeStyle(paper.status)}`}>
                    {paper.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

import React, { useState } from 'react';
import { Code, Terminal } from 'lucide-react';

export default function CodeHoverPopover({ snippet, onOpenModal, children, label = "Code" }) {
  const [hovered, setHovered] = useState(false);

  if (!snippet) return children || null;

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div 
        onClick={(e) => {
          e.stopPropagation();
          if (onOpenModal) onOpenModal(snippet);
        }}
        className="cursor-pointer"
      >
        {children || (
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 text-[10px] font-mono transition-colors"
          >
            <Code className="w-2.5 h-2.5 text-zinc-500" />
            <span>{label}</span>
          </button>
        )}
      </div>

      {hovered && (
        <div 
          className="absolute z-50 bottom-full left-0 mb-2 w-80 p-3 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-xl shadow-xl backdrop-blur-md text-[11px] animate-fadeIn pointer-events-none"
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800">
            <span className="font-semibold text-zinc-200 truncate flex items-center gap-1">
              <Terminal className="w-3 h-3 text-cyan-400" />
              {snippet.title}
            </span>
            <span className="text-[9px] text-zinc-400 font-mono">click to open</span>
          </div>
          <p className="text-zinc-400 text-[10px] mb-2 leading-relaxed">
            {snippet.description}
          </p>
          <div className="bg-zinc-950 rounded p-2 font-mono text-[10px] text-zinc-300 overflow-hidden max-h-24">
            <pre className="overflow-hidden text-ellipsis">
              {snippet.code.slice(0, 180)}...
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';

export default function ResidualsChart({ 
  histogramData = [], 
  title = "Residual Error Distribution (Actual - Predicted MMT)",
  color = "#2563eb"
}) {
  const [hoveredBin, setHoveredBin] = useState(null);

  if (!histogramData || histogramData.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-zinc-400 text-xs">
        No residual data available.
      </div>
    );
  }

  const maxCount = Math.max(...histogramData.map(b => b.count), 1);
  const width = 500;
  const height = 240;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 40;

  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const barW = chartW / histogramData.length;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
          {title}
        </h4>
        <span className="text-[11px] text-zinc-500 font-mono">
          N = {histogramData.reduce((acc, b) => acc + b.count, 0)} holdout points
        </span>
      </div>

      <div className="relative mt-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          {/* Grid lines */}
          {[0, 0.5, 1].map((step, idx) => {
            const y = padT + chartH * (1 - step);
            const val = Math.round(maxCount * step);
            return (
              <g key={idx}>
                <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#f4f4f5" strokeWidth="1" />
                <text x={padL - 6} y={y + 3.5} textAnchor="end" fill="#a1a1aa" fontSize="9">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Histogram Bars */}
          {histogramData.map((b, idx) => {
            const barH = (b.count / maxCount) * chartH;
            const x = padL + idx * barW + 2;
            const y = padT + chartH - barH;
            const isZeroCrossing = b.bin_start <= 0 && b.bin_end >= 0;

            return (
              <g 
                key={idx} 
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredBin(b)}
                onMouseLeave={() => setHoveredBin(null)}
              >
                <rect
                  x={x}
                  y={y}
                  width={Math.max(2, barW - 4)}
                  height={barH}
                  fill={isZeroCrossing ? '#059669' : '#3f3f46'}
                  fillOpacity={hoveredBin === b ? 1.0 : 0.85}
                  rx="2"
                />
                {idx % 3 === 0 && (
                  <text
                    x={x + (barW - 4) / 2}
                    y={height - 18}
                    textAnchor="middle"
                    fill="#71717a"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {b.bin_mid}
                  </text>
                )}
              </g>
            );
          })}

          <text x={width / 2} y={height - 4} textAnchor="middle" fill="#71717a" fontSize="10">
            Residual Error: e = y - ŷ (Million Metric Tons)
          </text>
        </svg>

        {hoveredBin && (
          <div className="absolute top-2 right-4 bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-[11px] text-zinc-900 shadow-md">
            <span className="font-semibold text-zinc-900">[{hoveredBin.bin_start}, {hoveredBin.bin_end}] MMT:</span>{' '}
            <span className="font-medium text-zinc-600">{hoveredBin.count} predictions</span>
          </div>
        )}
      </div>
    </div>
  );
}

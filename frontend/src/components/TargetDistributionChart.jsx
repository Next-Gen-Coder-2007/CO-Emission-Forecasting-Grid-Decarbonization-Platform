import React, { useState } from 'react';
import { BarChart2 } from 'lucide-react';

export default function TargetDistributionChart({ 
  histData = [], 
  stats = null, 
  title = "Target CO₂ Emission Empirical Distribution & Normality",
  height = 240 
}) {
  const [hoveredBin, setHoveredBin] = useState(null);

  if (!histData || histData.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex items-center justify-center min-h-[260px]">
        <span className="text-xs text-zinc-400">Loading distribution data...</span>
      </div>
    );
  }

  const maxCount = Math.max(...histData.map(b => b.count), 1);
  const width = 640;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const binW = chartW / histData.length;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-zinc-600" />
              <span>{title}</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Empirical histogram (16 bins) across 510 monthly EIA points (1980 - 2022).
            </p>
          </div>
          {stats && (
            <div className="flex items-center gap-2 text-[10.5px] font-mono">
              <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700">
                &mu; = {stats.mean} MMT
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700">
                &sigma; = {stats.std}
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700">
                Skew = {stats.skew}
              </span>
            </div>
          )}
        </div>

        {/* SVG Histogram */}
        <div className="relative mt-2">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((tick, i) => {
              const y = paddingTop + chartH - tick * chartH;
              const countVal = Math.round(tick * maxCount);
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#f4f4f5"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-zinc-400 font-mono"
                  >
                    {countVal}
                  </text>
                </g>
              );
            })}

            {/* Histogram Bars */}
            {histData.map((b, i) => {
              const barH = (b.count / maxCount) * chartH;
              const x = paddingLeft + i * binW + 2;
              const y = paddingTop + chartH - barH;
              const isHovered = hoveredBin === i;

              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={Math.max(1, binW - 4)}
                    height={barH}
                    rx={3}
                    className={`transition-colors cursor-pointer ${
                      isHovered ? 'fill-zinc-900' : 'fill-zinc-700 hover:fill-zinc-900'
                    }`}
                    onMouseEnter={() => setHoveredBin(i)}
                    onMouseLeave={() => setHoveredBin(null)}
                  />
                  {/* Bin X label */}
                  {i % 3 === 0 && (
                    <text
                      x={x + binW / 2}
                      y={height - 12}
                      textAnchor="middle"
                      className="text-[9.5px] fill-zinc-500 font-mono"
                    >
                      {Math.round(b.bin_mid)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredBin !== null && histData[hoveredBin] && (
            <div 
              className="absolute pointer-events-none bg-zinc-900 text-white px-2.5 py-1.5 rounded-md text-[11px] font-mono shadow-md z-10"
              style={{
                left: `${(paddingLeft + hoveredBin * binW) / width * 100}%`,
                top: '10%'
              }}
            >
              <div>Range: {histData[hoveredBin].bin_start} - {histData[hoveredBin].bin_end} MMT</div>
              <div className="text-zinc-300 font-sans">Count: <strong>{histData[hoveredBin].count}</strong> months ({((histData[hoveredBin].count / 510) * 100).toFixed(1)}%)</div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
        <span>X-Axis: Monthly Total CO₂ (MMT)</span>
        <span>Y-Axis: Monthly Frequency Count</span>
      </div>
    </div>
  );
}

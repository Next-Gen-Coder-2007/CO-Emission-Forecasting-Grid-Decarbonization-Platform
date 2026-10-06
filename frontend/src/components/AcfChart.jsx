import React, { useState } from 'react';
import { Activity, Clock } from 'lucide-react';

export default function AcfChart({ acfData = [], title = "Autoregressive Lag Structure & Autocorrelation Function (ACF)" }) {
  const [hoveredLag, setHoveredLag] = useState(null);

  if (!acfData || acfData.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex items-center justify-center min-h-[260px]">
        <span className="text-xs text-zinc-400">Loading autocorrelation structure...</span>
      </div>
    );
  }

  const width = 640;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const barW = chartW / acfData.length;
  const getY = (val) => paddingTop + chartH - val * chartH; // val from 0 to 1

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-600" />
              <span>{title}</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Autocorrelation $r(k)$ across 12 monthly lags confirming short-term momentum and annual 12-month seasonality.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
            N = 510 Months
          </span>
        </div>

        {/* SVG Bars */}
        <div className="relative mt-2">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((val, i) => {
              const y = getY(val);
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
                    {val.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* 95% Confidence threshold (+/- 0.086) */}
            <line
              x1={paddingLeft}
              y1={getY(0.086)}
              x2={width - paddingRight}
              y2={getY(0.086)}
              stroke="#3b82f6"
              strokeDasharray="4,4"
              strokeWidth="1"
            />
            <text
              x={width - paddingRight - 4}
              y={getY(0.086) - 4}
              textAnchor="end"
              className="text-[9px] fill-blue-500 font-mono"
            >
              95% CI (0.086)
            </text>

            {/* Bars */}
            {acfData.map((d, i) => {
              const barH = d.correlation * chartH;
              const x = paddingLeft + i * barW + 4;
              const y = paddingTop + chartH - barH;
              const isPeak = d.lag === 1 || d.lag === 12;
              const isHovered = hoveredLag === i;

              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={Math.max(2, barW - 8)}
                    height={barH}
                    rx={2.5}
                    className={`cursor-pointer transition-colors ${
                      isPeak 
                        ? 'fill-blue-600 hover:fill-blue-700' 
                        : isHovered 
                        ? 'fill-zinc-900' 
                        : 'fill-zinc-400 hover:fill-zinc-600'
                    }`}
                    onMouseEnter={() => setHoveredLag(i)}
                    onMouseLeave={() => setHoveredLag(null)}
                  />
                  <text
                    x={x + (barW - 8) / 2}
                    y={height - 12}
                    textAnchor="middle"
                    className={`text-[9.5px] font-mono ${isPeak ? 'font-bold fill-blue-700' : 'fill-zinc-500'}`}
                  >
                    t-{d.lag}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover details */}
          {hoveredLag !== null && acfData[hoveredLag] && (
            <div 
              className="absolute pointer-events-none bg-zinc-900 text-white px-2.5 py-1.5 rounded-md text-[11px] font-mono shadow-md z-10"
              style={{
                left: `${(paddingLeft + hoveredLag * barW) / width * 100}%`,
                top: '5%'
              }}
            >
              <div>{acfData[hoveredLag].label} (t-{acfData[hoveredLag].lag})</div>
              <div>Correlation: <strong className="text-blue-400">{acfData[hoveredLag].correlation}</strong></div>
              <div className="text-zinc-400 text-[10px]">
                {acfData[hoveredLag].lag === 1 ? 'Immediate Inertia (88.1%)' : acfData[hoveredLag].lag === 12 ? 'Annual Year-over-Year Peak (95.7%)' : 'Intermediate Seasonal Rhythm'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
        <span>X-Axis: Autoregressive Lag Index (Months)</span>
        <span>Y-Axis: Correlation Coefficient $r(k)$</span>
      </div>
    </div>
  );
}

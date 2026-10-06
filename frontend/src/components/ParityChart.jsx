import React, { useState } from 'react';

export default function ParityChart({ 
  points = [], 
  title = "Parity Plot: Actual vs Predicted Emissions (MMT)",
  color = "#2563eb"
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!points || points.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-zinc-400 text-xs">
        No parity data available.
      </div>
    );
  }

  const allVals = points.flatMap(p => [p.actual, p.predicted]);
  const minVal = Math.floor(Math.min(...allVals) * 0.95);
  const maxVal = Math.ceil(Math.max(...allVals) * 1.05);
  const range = maxVal - minVal || 1;

  const width = 360;
  const height = 300;
  const pad = 40;
  const chartW = width - pad * 2;
  const chartH = height - pad * 2;

  const getX = (val) => pad + ((val - minVal) / range) * chartW;
  const getY = (val) => pad + chartH - ((val - minVal) / range) * chartH;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs relative">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
          {title}
        </h4>
        <span className="text-[11px] text-zinc-500 font-mono">1:1 Ideal Line</span>
      </div>

      <div className="relative mt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          {/* Grid lines */}
          {[0, 0.5, 1].map((step, idx) => {
            const val = Math.round(minVal + range * step);
            const y = pad + chartH * (1 - step);
            const x = pad + chartW * step;
            return (
              <g key={idx}>
                <line x1={pad} y1={y} x2={width - pad} y2={y} stroke="#f4f4f5" strokeWidth="1" />
                <line x1={x} y1={pad} x2={x} y2={height - pad} stroke="#f4f4f5" strokeWidth="1" />
                <text x={pad - 6} y={y + 3.5} textAnchor="end" fill="#a1a1aa" fontSize="9">{val}</text>
                <text x={x} y={height - pad + 14} textAnchor="middle" fill="#a1a1aa" fontSize="9">{val}</text>
              </g>
            );
          })}

          {/* 45 degree ideal line */}
          <line
            x1={getX(minVal)}
            y1={getY(minVal)}
            x2={getX(maxVal)}
            y2={getY(maxVal)}
            stroke="#059669"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />

          {/* Scatter points */}
          {points.map((pt, idx) => {
            const cx = getX(pt.actual);
            const cy = getY(pt.predicted);
            const isHovered = hoveredPoint === pt;

            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={isHovered ? 4.5 : 3}
                fill={color}
                fillOpacity={isHovered ? 1.0 : 0.75}
                stroke={isHovered ? '#09090b' : '#ffffff'}
                strokeWidth={isHovered ? 1.5 : 0.8}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* Axis Labels */}
          <text x={width / 2} y={height - 6} textAnchor="middle" fill="#71717a" fontSize="10">
            Actual Emissions (MMT)
          </text>
          <text
            x={-height / 2}
            y={12}
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#71717a"
            fontSize="10"
          >
            Predicted Emissions (MMT)
          </text>
        </svg>

        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-white border border-zinc-200 rounded-lg p-2.5 text-[11px] shadow-md text-zinc-800">
            <div className="text-zinc-500 border-b border-zinc-100 pb-1 mb-1 font-medium">
              {hoveredPoint.date}
            </div>
            <div>Actual: <span className="font-semibold text-zinc-900">{hoveredPoint.actual} MMT</span></div>
            <div>Pred: <span className="font-semibold text-blue-600">{hoveredPoint.predicted} MMT</span></div>
            <div>Error: <span className="font-mono text-emerald-600">{hoveredPoint.residual} MMT</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

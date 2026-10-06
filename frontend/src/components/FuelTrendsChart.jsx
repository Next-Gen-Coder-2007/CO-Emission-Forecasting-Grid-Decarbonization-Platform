import React, { useState } from 'react';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';

export default function FuelTrendsChart({ trendsData = [], title = "Long-Term Sectoral Fuel Transition Dynamics (1980 - 2022)" }) {
  const [activeSeries, setActiveSeries] = useState({
    'total': true,
    'coal': true,
    'gas': true,
    'petroleum': false
  });
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!trendsData || trendsData.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex items-center justify-center min-h-[300px]">
        <span className="text-xs text-zinc-400">Loading long-term fuel transition trends...</span>
      </div>
    );
  }

  const seriesMeta = {
    'total': { label: 'Total Electric CO₂', color: '#09090b', strokeWidth: 2.2 },
    'coal': { label: 'Coal Power Emissions', color: '#2563eb', strokeWidth: 1.8 },
    'gas': { label: 'Natural Gas Emissions', color: '#059669', strokeWidth: 1.8 },
    'petroleum': { label: 'Petroleum Emissions', color: '#d97706', strokeWidth: 1.5 }
  };

  const width = 850;
  const height = 300;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const minVal = 0;
  const maxVal = 260;
  const range = maxVal - minVal;

  const getX = (idx) => paddingLeft + (idx / (trendsData.length - 1)) * chartW;
  const getY = (val) => paddingTop + chartH - ((val - minVal) / range) * chartH;

  const buildPath = (key) => {
    const points = trendsData.map((d, i) => `${getX(i)},${getY(d[key])}`);
    return `M ${points.join(' L ')}`;
  };

  const toggle = (key) => {
    setActiveSeries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hoverItem = hoverIndex !== null ? trendsData[hoverIndex] : null;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-zinc-100 gap-3 mb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-600" />
              <span>{title}</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              510 continuous monthly observations capturing the structural shift from coal to natural gas power generation.
            </p>
          </div>

          {/* Series Toggles */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {Object.entries(seriesMeta).map(([k, meta]) => {
              const isVis = activeSeries[k];
              return (
                <button
                  key={k}
                  onClick={() => toggle(k)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    isVis 
                      ? 'bg-zinc-100 text-zinc-800 border border-zinc-300 shadow-2xs'
                      : 'bg-white text-zinc-400 border border-zinc-200 opacity-60'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  <span>{meta.label}</span>
                  {isVis ? <Eye className="w-3 h-3 text-zinc-500" /> : <EyeOff className="w-3 h-3 text-zinc-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="relative mt-2">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none"
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Grid lines */}
            {[0, 50, 100, 150, 200, 250].map((val, i) => {
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
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Year markers */}
            {[0, 120, 240, 360, 480, trendsData.length - 1].map((idx) => {
              if (!trendsData[idx]) return null;
              const x = getX(idx);
              const yearStr = trendsData[idx].date.slice(0, 4);
              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + chartH}
                    stroke="#e4e4e7"
                    strokeDasharray="2,2"
                  />
                  <text
                    x={x}
                    y={height - 12}
                    textAnchor="middle"
                    className="text-[10px] fill-zinc-500 font-mono font-medium"
                  >
                    {yearStr}
                  </text>
                </g>
              );
            })}

            {/* Render active paths */}
            {Object.entries(seriesMeta).map(([k, meta]) => {
              if (!activeSeries[k]) return null;
              return (
                <path
                  key={k}
                  d={buildPath(k)}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth={meta.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* Hover Vertical Line */}
            {hoverIndex !== null && (
              <line
                x1={getX(hoverIndex)}
                y1={paddingTop}
                x2={getX(hoverIndex)}
                y2={paddingTop + chartH}
                stroke="#09090b"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
            )}

            {/* Invisible hover trigger columns */}
            {trendsData.map((_, idx) => {
              const x = getX(idx) - (chartW / trendsData.length) / 2;
              const w = chartW / trendsData.length;
              return (
                <rect
                  key={idx}
                  x={x}
                  y={paddingTop}
                  width={Math.max(1, w)}
                  height={chartH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIndex(idx)}
                />
              );
            })}
          </svg>

          {/* Floating Tooltip */}
          {hoverItem && (
            <div
              className="absolute pointer-events-none bg-zinc-950 text-white px-3.5 py-2.5 rounded-lg text-xs font-mono shadow-xl border border-zinc-800 z-10"
              style={{
                left: `${Math.min(80, Math.max(10, (getX(hoverIndex) / width) * 100))}%`,
                top: '5%'
              }}
            >
              <div className="font-bold text-zinc-100 text-xs border-b border-zinc-800 pb-1 mb-1.5 flex items-center justify-between gap-4">
                <span>Date: {hoverItem.date}</span>
                <span className="text-[10px] text-zinc-400">Total: {hoverItem.total} MMT</span>
              </div>
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between gap-4 text-blue-400">
                  <span>Coal Power:</span>
                  <span className="font-bold">{hoverItem.coal} MMT ({hoverItem.coal_share}%)</span>
                </div>
                <div className="flex justify-between gap-4 text-emerald-400">
                  <span>Natural Gas:</span>
                  <span className="font-bold">{hoverItem.gas} MMT ({hoverItem.gas_share}%)</span>
                </div>
                <div className="flex justify-between gap-4 text-amber-400">
                  <span>Petroleum:</span>
                  <span>{hoverItem.petroleum} MMT</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
        <span>Timeline: 1980 to 2022 (Monthly Intervals)</span>
        <span>Physical Emission Scale (Million Metric Tons CO₂)</span>
      </div>
    </div>
  );
}

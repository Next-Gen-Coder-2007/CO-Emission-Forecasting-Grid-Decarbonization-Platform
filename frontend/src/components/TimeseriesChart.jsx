import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function TimeseriesChart({ 
  timeseriesData = [], 
  models = [], 
  height = 360,
  loading = false,
  title = "Holdout Period: Actual vs Model Forecasts (77 Monthly Intervals)"
}) {
  const [activeSeries, setActiveSeries] = useState({
    'Actual': true,
    'Ridge Regression': true,
    'LightGBM': false,
    'XGBoost': false,
    'SVM': false,
    'LSTM': true,
    'GRU': false,
    'CNN-LSTM': true,
    'Stacked BiGRU': false
  });
  const [hoverIndex, setHoverIndex] = useState(null);

  if (loading || !timeseriesData || timeseriesData.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-xs flex flex-col items-center justify-center min-h-[340px] text-center animate-fadeIn">
        <div className="relative w-10 h-10 mb-3 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" />
        </div>
        <p className="text-xs font-semibold text-zinc-800">
          Loading Time-Series Forecast Data...
        </p>
        <p className="text-[11px] text-zinc-400 mt-1 max-w-sm">
          Fetching multi-model physical predictions (MMT) from Flask REST API.
        </p>
      </div>
    );
  }

  // Minimalist, high-contrast, cohesive color palette
  const modelColors = {
    'Actual': '#09090b',          // Deep black / ground truth
    'Ridge Regression': '#2563eb', // Clean blue
    'LightGBM': '#059669',        // Clean green
    'XGBoost': '#d97706',         // Muted amber
    'SVM': '#7c3aed',             // Muted purple
    'LSTM': '#db2777',            // Rose
    'GRU': '#0284c7',             // Sky blue
    'CNN-LSTM': '#0ea5e9',        // Cyan/Ocean
    'Stacked BiGRU': '#9333ea'    // Violet
  };

  let allValues = [];
  timeseriesData.forEach(pt => {
    if (activeSeries['Actual'] && pt.actual_mmt !== undefined) allValues.push(pt.actual_mmt);
    Object.keys(modelColors).forEach(m => {
      if (m !== 'Actual' && activeSeries[m] && pt[m] !== undefined) {
        allValues.push(pt[m]);
      }
    });
  });

  if (allValues.length === 0) {
    allValues = timeseriesData.map(d => d.actual_mmt || 150);
  }

  const minVal = Math.floor(Math.min(...allValues) * 0.95);
  const maxVal = Math.ceil(Math.max(...allValues) * 1.05);
  const range = maxVal - minVal || 1;

  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;
  const width = 850;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getX = (index) => paddingLeft + (index / (timeseriesData.length - 1)) * chartW;
  const getY = (val) => paddingTop + chartH - ((val - minVal) / range) * chartH;

  const buildPath = (keyName) => {
    const points = timeseriesData.map((pt, idx) => {
      const val = keyName === 'Actual' ? pt.actual_mmt : pt[keyName];
      if (val === undefined || isNaN(val)) return null;
      return `${getX(idx)},${getY(val)}`;
    }).filter(Boolean);
    return points.length > 0 ? `M ${points.join(' L ')}` : '';
  };

  const toggleSeries = (name) => {
    setActiveSeries(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const hoverItem = hoverIndex !== null ? timeseriesData[hoverIndex] : null;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-zinc-100 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
            {title}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real physical scale in Million Metric Tons CO₂ (MMT). Hover over data points to inspect values.
          </p>
        </div>

        {/* Legend / Series Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {Object.entries(modelColors).map(([name, color]) => {
            const isVisible = activeSeries[name];
            return (
              <button
                key={name}
                onClick={() => toggleSeries(name)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  isVisible 
                    ? 'bg-zinc-100 text-zinc-800 border border-zinc-300/80 shadow-2xs' 
                    : 'bg-white text-zinc-400 border border-zinc-200 opacity-60 hover:opacity-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span>{name}</span>
                {isVisible ? <Eye className="w-3 h-3 text-zinc-500" /> : <EyeOff className="w-3 h-3 text-zinc-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative mt-4 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="ridgeGradientLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((step, i) => {
            const y = paddingTop + chartH * (1 - step);
            const val = Math.round(minVal + range * step);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f4f4f5"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#a1a1aa"
                  fontSize="10"
                  fontFamily="sans-serif"
                >
                  {val} MMT
                </text>
              </g>
            );
          })}

          {/* Subtle area fill for Ridge Regression */}
          {activeSeries['Ridge Regression'] && (
            <path
              d={`${buildPath('Ridge Regression')} L ${getX(timeseriesData.length - 1)},${getY(minVal)} L ${getX(0)},${getY(minVal)} Z`}
              fill="url(#ridgeGradientLight)"
            />
          )}

          {/* Lines for each active model */}
          {Object.entries(modelColors).map(([name, color]) => {
            if (!activeSeries[name]) return null;
            const pathD = buildPath(name);
            const isActual = name === 'Actual';
            return (
              <path
                key={name}
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={isActual ? 2.2 : 1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={isActual ? "none" : (name === 'LSTM' || name === 'GRU' ? "4 3" : "none")}
              />
            );
          })}

          {/* Dates on X Axis */}
          {timeseriesData.map((pt, idx) => {
            if (idx % 12 === 0 || idx === timeseriesData.length - 1) {
              const x = getX(idx);
              const label = pt.date ? pt.date.substring(0, 7) : `T+${idx}`;
              return (
                <text
                  key={idx}
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  fill="#a1a1aa"
                  fontSize="10"
                  fontFamily="sans-serif"
                >
                  {label}
                </text>
              );
            }
            return null;
          })}

          {/* Hover interactive vertical hit-areas */}
          {timeseriesData.map((_, idx) => {
            const x = getX(idx);
            const stepW = chartW / timeseriesData.length;
            return (
              <rect
                key={idx}
                x={x - stepW / 2}
                y={paddingTop}
                width={stepW}
                height={chartH}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(idx)}
              />
            );
          })}

          {/* Hover indicator line & dot */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={paddingTop}
                x2={getX(hoverIndex)}
                y2={paddingTop + chartH}
                stroke="#d4d4d8"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              {activeSeries['Actual'] && hoverItem?.actual_mmt && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(hoverItem.actual_mmt)}
                  r="4"
                  fill="#09090b"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              )}
              {activeSeries['Ridge Regression'] && hoverItem?.['Ridge Regression'] && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(hoverItem['Ridge Regression'])}
                  r="3.5"
                  fill="#2563eb"
                />
              )}
            </g>
          )}
        </svg>

        {/* Hover Tooltip (Clean Minimalist White Card) */}
        {hoverItem && hoverIndex !== null && (
          <div 
            className="absolute z-20 pointer-events-none bg-white border border-zinc-200 rounded-xl p-3 shadow-lg text-xs min-w-[200px]"
            style={{
              left: `${Math.min(75, Math.max(10, (hoverIndex / timeseriesData.length) * 100))}%`,
              top: '10px'
            }}
          >
            <div className="font-semibold text-zinc-900 border-b border-zinc-100 pb-1.5 mb-1.5 flex items-center justify-between">
              <span>{hoverItem.date || `Sample #${hoverIndex + 1}`}</span>
              <span className="text-[10px] text-zinc-500 font-medium">Physical (MMT)</span>
            </div>
            
            <div className="space-y-1">
              {activeSeries['Actual'] && (
                <div className="flex items-center justify-between font-semibold text-zinc-900">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
                    Actual:
                  </span>
                  <span>{hoverItem.actual_mmt?.toFixed(2)} MMT</span>
                </div>
              )}

              {Object.entries(modelColors).map(([name, color]) => {
                if (name === 'Actual' || !activeSeries[name]) return null;
                const val = hoverItem[name];
                if (val === undefined) return null;
                const err = hoverItem.actual_mmt ? (val - hoverItem.actual_mmt).toFixed(2) : null;
                return (
                  <div key={name} className="flex items-center justify-between text-zinc-600">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                      {name}:
                    </span>
                    <span className="font-mono text-[11px] text-zinc-800">
                      {val.toFixed(2)} {err && <span className="text-[10px] text-zinc-400">({Number(err) >= 0 ? `+${err}` : err})</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

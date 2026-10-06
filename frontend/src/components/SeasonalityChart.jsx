import React, { useState } from 'react';
import { Calendar, Sun, Snowflake } from 'lucide-react';

export default function SeasonalityChart({ seasonalityData = [], title = "Annual Monthly Seasonality Profile & Peak Dynamics" }) {
  const [hoveredMonth, setHoveredMonth] = useState(null);

  if (!seasonalityData || seasonalityData.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex items-center justify-center min-h-[260px]">
        <span className="text-xs text-zinc-400">Loading seasonality profile...</span>
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

  const minVal = 100;
  const maxVal = 200;
  const range = maxVal - minVal;

  const getX = (idx) => paddingLeft + (idx / (seasonalityData.length - 1)) * chartW;
  const getY = (val) => paddingTop + chartH - ((val - minVal) / range) * chartH;

  // Build points for average emissions line
  const avgPoints = seasonalityData.map((d, i) => `${getX(i)},${getY(d.avg)}`).join(' L ');
  const areaPoints = `${getX(0)},${paddingTop + chartH} L ${avgPoints} L ${getX(seasonalityData.length - 1)},${paddingTop + chartH} Z`;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-600" />
              <span>{title}</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Mean monthly emissions showcasing twin annual peaks (Winter heating vs Summer air conditioning).
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
              <Snowflake className="w-3 h-3 text-blue-600" /> Winter Peak (Jan: 168.4 MMT)
            </span>
            <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
              <Sun className="w-3 h-3 text-amber-600" /> Summer Peak (Jul: 184.8 MMT)
            </span>
          </div>
        </div>

        {/* SVG Curve */}
        <div className="relative mt-2">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
            {/* Grid lines */}
            {[100, 125, 150, 175, 200].map((val, i) => {
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

            {/* Shaded Area */}
            <path d={`M ${areaPoints}`} className="fill-zinc-100/70" />

            {/* Trajectory Line */}
            <path
              d={`M ${avgPoints}`}
              fill="none"
              stroke="#18181b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Month Nodes */}
            {seasonalityData.map((d, i) => {
              const cx = getX(i);
              const cy = getY(d.avg);
              const isPeak = i === 0 || i === 6 || i === 7;
              const isLow = i === 3 || i === 4 || i === 9;
              const isHovered = hoveredMonth === i;

              return (
                <g key={i}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : isPeak ? 4.5 : 3.5}
                    className={`cursor-pointer transition-all ${
                      isPeak ? 'fill-amber-500 stroke-zinc-900 stroke-2' : isLow ? 'fill-blue-400 stroke-zinc-900 stroke-2' : 'fill-zinc-900'
                    }`}
                    onMouseEnter={() => setHoveredMonth(i)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  />
                  <text
                    x={cx}
                    y={height - 12}
                    textAnchor="middle"
                    className={`text-[10px] font-sans ${isHovered ? 'font-bold fill-zinc-900' : 'fill-zinc-600'}`}
                  >
                    {d.month_name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover Details Popup */}
          {hoveredMonth !== null && seasonalityData[hoveredMonth] && (
            <div 
              className="absolute pointer-events-none bg-zinc-900 text-white px-3 py-1.5 rounded-md text-[11px] font-mono shadow-md z-10"
              style={{
                left: `${(getX(hoveredMonth)) / width * 100}%`,
                top: '5%'
              }}
            >
              <div className="font-bold text-zinc-100">{seasonalityData[hoveredMonth].month_name} (Month {seasonalityData[hoveredMonth].month_num})</div>
              <div>Average: <strong className="text-emerald-400">{seasonalityData[hoveredMonth].avg} MMT</strong></div>
              <div className="text-zinc-400 text-[10px]">Range: {seasonalityData[hoveredMonth].min} - {seasonalityData[hoveredMonth].max} MMT</div>
              <div className="text-zinc-400 text-[10px]">Cyclic: sin={seasonalityData[hoveredMonth].sin}, cos={seasonalityData[hoveredMonth].cos}</div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
        <span>X-Axis: Operating Month (1 to 12)</span>
        <span>Y-Axis: Total CO₂ Emissions (MMT)</span>
      </div>
    </div>
  );
}

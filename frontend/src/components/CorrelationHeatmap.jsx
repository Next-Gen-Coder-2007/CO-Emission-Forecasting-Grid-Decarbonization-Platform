import React, { useState } from 'react';
import { Grid, Info } from 'lucide-react';

export default function CorrelationHeatmap({ matrixData, title = "Sectoral Energy & CO₂ Cross-Correlation Heatmap" }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  if (!matrixData || !matrixData.values || matrixData.values.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex items-center justify-center min-h-[300px]">
        <span className="text-xs text-zinc-400">Loading correlation matrix...</span>
      </div>
    );
  }

  const { labels, values, variables } = matrixData;

  // Get color based on correlation [-1, 1]
  const getCellColor = (val) => {
    if (val >= 0.8) return 'bg-blue-600 text-white font-bold';
    if (val >= 0.5) return 'bg-blue-500/80 text-white font-semibold';
    if (val >= 0.2) return 'bg-blue-200 text-blue-950 font-medium';
    if (val > -0.2) return 'bg-zinc-100 text-zinc-700';
    if (val > -0.5) return 'bg-amber-200 text-amber-950 font-medium';
    return 'bg-amber-600 text-white font-bold';
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-zinc-600" />
              <span>{title}</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Pearson correlation coefficients ($r$) computed across all 510 monthly EIA observations.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">6 &times; 6 Matrix</span>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-[11px] font-semibold text-zinc-500">Variable</th>
                {labels.map((lbl, idx) => (
                  <th key={idx} className="p-2 text-[10.5px] font-semibold text-zinc-700 min-w-[70px]">
                    {lbl}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {values.map((row, rIdx) => (
                <tr key={rIdx} className="border-t border-zinc-100">
                  <td className="p-2 text-left font-medium text-zinc-800 text-[11px] whitespace-nowrap">
                    {labels[rIdx]}
                  </td>
                  {row.map((val, cIdx) => (
                    <td
                      key={cIdx}
                      onMouseEnter={() => setHoveredCell({ r: labels[rIdx], c: labels[cIdx], val })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className="p-1 cursor-pointer transition-transform hover:scale-105"
                    >
                      <div className={`py-2 px-1 rounded-md text-[11px] font-mono transition-colors ${getCellColor(val)}`}>
                        {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hover Info & Legend */}
      <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="text-[11px] text-zinc-600">
          {hoveredCell ? (
            <span className="font-mono">
              <strong>{hoveredCell.r}</strong> &harr; <strong>{hoveredCell.c}</strong>: <span className="font-bold text-zinc-900">{hoveredCell.val > 0 ? `+${hoveredCell.val}` : hoveredCell.val}</span>
            </span>
          ) : (
            <span className="text-zinc-400 italic">Hover any cell to inspect pairwise relationship</span>
          )}
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-600"></span> Positive (+1.0)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-zinc-200"></span> Neutral (0.0)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-600"></span> Negative (-0.7)
          </span>
        </div>
      </div>
    </div>
  );
}

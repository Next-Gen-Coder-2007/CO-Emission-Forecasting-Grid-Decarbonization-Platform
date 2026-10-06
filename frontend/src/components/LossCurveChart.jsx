import React from 'react';

export default function LossCurveChart({ 
  lossHistory = [], 
  title = "Training Convergence & Loss Trajectory",
  metricName = "RMSE Loss"
}) {
  if (!lossHistory || lossHistory.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-zinc-400 text-xs">
        No loss history available for this model yet. Click &quot;Train Model&quot; to compute.
      </div>
    );
  }

  const hasVal = lossHistory.some(pt => pt.val_loss !== undefined);
  const trainLosses = lossHistory.map(pt => pt.train_loss !== undefined ? pt.train_loss : (pt.loss || 0));
  const valLosses = hasVal ? lossHistory.map(pt => pt.val_loss) : [];
  const allLosses = [...trainLosses, ...valLosses].filter(v => v !== undefined && !isNaN(v));

  const minLoss = Math.min(...allLosses, 0);
  const maxLoss = Math.max(...allLosses, 0.001) * 1.1;
  const range = maxLoss - minLoss || 1;

  const width = 500;
  const height = 240;
  const padL = 45;
  const padR = 20;
  const padT = 20;
  const padB = 35;

  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const getX = (idx) => padL + (idx / Math.max(1, lossHistory.length - 1)) * chartW;
  const getY = (loss) => padT + chartH - ((loss - minLoss) / range) * chartH;

  const trainPath = lossHistory.map((pt, idx) => {
    const l = pt.train_loss !== undefined ? pt.train_loss : (pt.loss || 0);
    return `${getX(idx)},${getY(l)}`;
  }).join(' L ');

  const valPath = hasVal ? lossHistory.map((pt, idx) => {
    return `${getX(idx)},${getY(pt.val_loss)}`;
  }).join(' L ') : '';

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          {title}
        </h4>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-blue-600 font-medium">
            <span className="w-2.5 h-0.5 bg-blue-600"></span> Train Loss
          </span>
          {hasVal && (
            <span className="flex items-center gap-1.5 text-amber-600 font-medium">
              <span className="w-2.5 h-0.5 bg-amber-600 border-dashed"></span> Val Loss
            </span>
          )}
        </div>
      </div>

      <div className="mt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          {/* Grid lines */}
          {[0, 0.5, 1].map((step, idx) => {
            const y = padT + chartH * (1 - step);
            const val = (minLoss + range * step).toFixed(4);
            return (
              <g key={idx}>
                <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#f4f4f5" strokeWidth="1" />
                <text x={padL - 6} y={y + 3.5} textAnchor="end" fill="#a1a1aa" fontSize="9">{val}</text>
              </g>
            );
          })}

          {/* Train Path */}
          {trainPath && (
            <path
              d={`M ${trainPath}`}
              fill="none"
              stroke="#2563eb"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}

          {/* Val Path */}
          {valPath && (
            <path
              d={`M ${valPath}`}
              fill="none"
              stroke="#d97706"
              strokeWidth="1.6"
              strokeDasharray="3 3"
              strokeLinecap="round"
            />
          )}

          {/* Dots */}
          {lossHistory.map((pt, idx) => {
            const l = pt.train_loss !== undefined ? pt.train_loss : (pt.loss || 0);
            return (
              <circle
                key={idx}
                cx={getX(idx)}
                cy={getY(l)}
                r="2.5"
                fill="#2563eb"
              />
            );
          })}

          {/* X axis labels */}
          <text x={padL} y={height - 8} textAnchor="start" fill="#71717a" fontSize="9">
            Epoch 1
          </text>
          <text x={width - padR} y={height - 8} textAnchor="end" fill="#71717a" fontSize="9">
            Epoch {lossHistory.length}
          </text>
        </svg>
      </div>
    </div>
  );
}

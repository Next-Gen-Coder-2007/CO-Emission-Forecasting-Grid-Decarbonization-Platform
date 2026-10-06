import React from 'react';

export default function FeatureImportanceChart({ 
  features = [], 
  title = "Predictive Feature Importance & Regression Weights",
  color = "#18181b"
}) {
  if (!features || features.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-zinc-400 text-xs">
        No feature importances available.
      </div>
    );
  }

  const topFeatures = features.slice(0, 10);
  const maxImp = Math.max(...topFeatures.map(f => f.importance), 0.001);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
          {title}
        </h4>
        <span className="text-[11px] text-zinc-500">Top 10 Drivers</span>
      </div>

      <div className="mt-4 space-y-2.5">
        {topFeatures.map((feat, idx) => {
          const pct = Math.min(100, Math.max(4, (feat.importance / maxImp) * 100));
          return (
            <div key={idx} className="group">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors">
                  {feat.feature.replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-[11px] text-zinc-500">
                  {feat.importance}
                </span>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: idx === 0 ? '#18181b' : idx === 1 ? '#3f3f46' : '#71717a'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

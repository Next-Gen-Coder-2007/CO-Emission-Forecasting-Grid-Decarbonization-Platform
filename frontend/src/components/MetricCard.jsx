import React from 'react';

export default function MetricCard({ 
  title, 
  value, 
  unit = "", 
  subtitle = "", 
  badge = "", 
  badgeColor = "neutral", 
  icon: Icon
}) {
  const badgeStyles = {
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  }[badgeColor] || 'bg-zinc-100 text-zinc-700 border-zinc-200';

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs hover:border-zinc-300 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-2xl font-bold text-zinc-900 tracking-tight">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-normal text-zinc-500">
                {unit}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-zinc-100">
        <span className="text-zinc-500 text-[11px] truncate mr-2">
          {subtitle}
        </span>
        {badge && (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${badgeStyles} shrink-0`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

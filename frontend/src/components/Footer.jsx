import React from 'react';
import { Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white mt-16 py-6 text-xs text-zinc-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-zinc-900 text-white flex items-center justify-center">
            <Activity className="w-3 h-3" />
          </div>
          <span className="font-medium text-zinc-900">CO₂ Emission Forecast Engine</span>
          <span className="text-zinc-300">|</span>
          <span className="text-zinc-500">Industrial &amp; Energy Predictive Intelligence</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-zinc-500">
          <span>Flask REST API</span>
          <span>&bull;</span>
          <span>SQLite Database</span>
          <span>&bull;</span>
          <span>Scikit-Learn &amp; Deep Learning</span>
        </div>
      </div>
    </footer>
  );
}

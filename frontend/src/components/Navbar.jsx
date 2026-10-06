import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Cpu, BarChart3, UploadCloud, Sliders, Database, Check, LineChart } from 'lucide-react';

export default function Navbar({ apiStatus }) {
  const navItems = [
    { path: '/', label: 'Overview', icon: Activity },
    { path: '/eda', label: 'EDA & Diagnostics', icon: LineChart },
    { path: '/train', label: 'Train Models', icon: Cpu },
    { path: '/evaluation', label: 'Evaluation', icon: BarChart3 },
    { path: '/tester', label: 'CSV Inference', icon: UploadCloud },
    { path: '/simulator', label: 'Scenario Simulator', icon: Sliders },
    { path: '/dataset', label: 'Dataset Explorer', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-900 tracking-tight leading-tight">
              CO₂ Emission Forecast Engine
            </div>
            <div className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">
              Energy &amp; Power Analytics
            </div>
          </div>
        </NavLink>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-900 font-semibold border border-zinc-200'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5 text-zinc-500" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, Search, ChevronLeft, ChevronRight, CheckCircle2, Layers, Code, BarChart2, TrendingUp, Sparkles, Activity, ArrowRight } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import CodeModal from '../components/CodeModal';
import { preprocessingSnippets, edaAndTuningSnippets } from '../data/codeSnippets';
import { apiUrl } from '../api/client';

export default function DatasetExplorerPage() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [activeSnippet, setActiveSnippet] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenCode = (snippet) => {
    setActiveSnippet(snippet);
    setModalOpen(true);
  };

  const fetchDataset = async (p = 1, query = '') => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/dataset?page=${p}&limit=12&search=${encodeURIComponent(query)}`));
      const resJson = await res.json();
      setData(resJson.data || []);
      setPage(resJson.page || 1);
      setTotalPages(resJson.pages || 1);
      setTotalRecords(resJson.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(apiUrl('/api/dataset/stats'));
      const statsJson = await res.json();
      setStats(statsJson);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchDataset(1, '');
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDataset(1, search);
  };

  const preprocessingStages = [
    {
      key: 'domain_baseline',
      title: '1. Domain Zero Baseline & Imputation',
      desc: 'Geothermal and Non-Biomass Waste set to zero prior to commercial grid deployment, followed by linear interpolation.',
      snippet: preprocessingSnippets.domain_baseline
    },
    {
      key: 'iqr_winsorization',
      title: '2. IQR Outlier Winsorization',
      desc: '1st and 99th percentile IQR clipping eliminates extreme measurement anomalies and grid blackout spikes.',
      snippet: preprocessingSnippets.iqr_winsorization
    },
    {
      key: 'cyclical_encoding',
      title: '3. Cyclical Month Encoding',
      desc: 'Sinusoidal sin(2πm/12) and cos(2πm/12) transform calendar months into continuous periodic coordinates.',
      snippet: preprocessingSnippets.cyclical_encoding
    },
    {
      key: 'autoregressive_lags',
      title: '4. 12-Lag Autoregression',
      desc: 'Lags t-1, t-2, t-3, and t-12 capture immediate momentum and year-over-year annual seasonality.',
      snippet: preprocessingSnippets.autoregressive_lags
    },
    {
      key: 'rolling_statistics',
      title: '5. Multi-Window Rolling & EMA',
      desc: '3, 6, and 12-month rolling means, standard deviations, and exponential moving averages capture mid-term trends.',
      snippet: preprocessingSnippets.rolling_statistics
    },
    {
      key: 'fuel_shares',
      title: '6. Fuel Shares & Differencing',
      desc: 'Normalized energy share proportions (Coal, Gas, Petroleum) plus 1-month and 12-month delta differences.',
      snippet: preprocessingSnippets.fuel_shares
    },
    {
      key: 'train_test_split',
      title: '7. Temporal Train/Holdout Partition',
      desc: 'Strict chronological 85/15 time split (433 train / 77 test) preserving causal arrow of time without data leakage.',
      snippet: preprocessingSnippets.train_test_split
    },
  ];

  const edaAnalyses = [
    {
      title: 'Target Emission Distribution & Skewness',
      desc: 'Normality evaluation, skewness metrics, and empirical range analysis on historical electric sector CO2 emissions.',
      icon: Activity,
      snippet: edaAndTuningSnippets.target_distribution
    },
    {
      title: 'Sectoral Fuel Cross-Correlation Matrix',
      desc: 'Pearson correlation heatmap between Coal, Natural Gas, Petroleum, and Total CO2 showing historical fuel switching.',
      icon: BarChart2,
      snippet: edaAndTuningSnippets.correlation_analysis
    },
    {
      title: 'Augmented Dickey-Fuller (ADF) Stationarity Test',
      desc: 'Statistical hypothesis test for unit root stationarity comparing raw levels versus first differences.',
      icon: TrendingUp,
      snippet: edaAndTuningSnippets.adf_stationarity
    },
    {
      title: 'Seasonal & Trend Time-Series Decomposition',
      desc: 'Additive decomposition isolating underlying secular decarbonization trend, seasonal peaks, and residual noise.',
      icon: Sparkles,
      snippet: edaAndTuningSnippets.seasonal_decomposition
    },
  ];

  return (
    <div className="space-y-7 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium mb-2">
            <Database className="w-3.5 h-3.5 text-zinc-500" />
            <span>SQLite Database &bull; 510 Monthly Observations (1980 - 2022)</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Dataset Explorer &amp; Feature Engineering Architecture
          </h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-3xl">
            Sectoral energy consumption dataset from the U.S. Energy Information Administration (EIA). Inspect raw monthly fuel quantities, statistical exploratory data analysis (EDA), and all 7 scientific preprocessing stages. Click "Full Code" on any card to inspect its Python source.
          </p>
        </div>

        <Link
          to="/eda"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs shadow-xs transition-colors shrink-0"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Interactive EDA Hub</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Coal Electric Power"
          value={stats?.coal?.avg ? `${stats.coal.avg}` : "125.8"}
          unit="MMT Avg"
          subtitle={`Range: ${stats?.coal?.min || 32} to ${stats?.coal?.max || 205} MMT`}
          badge="Baseline Fuel"
          badgeColor="neutral"
          icon={Database}
        />
        <MetricCard
          title="Natural Gas Electric"
          value={stats?.natural_gas?.avg ? `${stats.natural_gas.avg}` : "28.4"}
          unit="MMT Avg"
          subtitle={`Range: ${stats?.natural_gas?.min || 9} to ${stats?.natural_gas?.max || 68} MMT`}
          badge="Transition Fuel"
          badgeColor="neutral"
          icon={Database}
        />
        <MetricCard
          title="Petroleum Electric"
          value={stats?.petroleum?.avg ? `${stats.petroleum.avg}` : "5.8"}
          unit="MMT Avg"
          subtitle={`Range: ${stats?.petroleum?.min || 0.8} to ${stats?.petroleum?.max || 31} MMT`}
          badge="Peaking Fuel"
          badgeColor="neutral"
          icon={Database}
        />
        <MetricCard
          title="Total Electric Sector"
          value={stats?.total_co2?.avg ? `${stats.total_co2.avg}` : "157.5"}
          unit="MMT Avg"
          subtitle={`Range: ${stats?.total_co2?.min || 91} to ${stats?.total_co2?.max || 247} MMT`}
          badge="Primary Target"
          badgeColor="emerald"
          icon={Database}
        />
      </div>

      {/* Exploratory Data Analysis (EDA) Section with Clean View Code Buttons */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              Exploratory Data Analysis (EDA) &amp; Statistical Diagnostic Methods
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Click "View Code" on any diagnostic analysis method to view the exact Python implementation.
            </p>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">4 Core EDA Techniques</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {edaAnalyses.map((eda, idx) => {
            const Icon = eda.icon;
            return (
              <div 
                key={idx}
                className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-colors flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-900 text-xs mb-1.5">
                    <Icon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    <span>{eda.title}</span>
                  </div>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    {eda.desc}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-zinc-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-[10px] text-zinc-400">Python EDA</span>
                  <button
                    type="button"
                    onClick={() => handleOpenCode(eda.snippet)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 font-medium text-xs shadow-2xs transition-colors"
                  >
                    <Code className="w-3 h-3 text-zinc-500" />
                    <span>View Code</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Engineering Pipeline Stages with Clean View Code Buttons */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              7-Stage Scientific Preprocessing &amp; Feature Synthesis Pipeline
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Production-grade data engineering pipeline. Click "View Code" on any stage card to inspect the exact Python code snippet.
            </p>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">33 Engineered Features</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 text-xs">
          {preprocessingStages.map((stage) => (
            <div
              key={stage.key}
              className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-colors flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-zinc-900 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  <span>{stage.title}</span>
                </div>
                <p className="text-zinc-500 text-[11px] leading-relaxed">
                  {stage.desc}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-zinc-200/60 flex items-center justify-between text-[11px]">
                <span className="text-[10px] text-zinc-400">Data Engineering</span>
                <button
                  type="button"
                  onClick={() => handleOpenCode(stage.snippet)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 font-medium text-xs shadow-2xs transition-colors"
                >
                  <Code className="w-3 h-3 text-zinc-500" />
                  <span>View Code</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive SQL Table */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-zinc-100 gap-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              SQLite Table: emissions_data ({totalRecords} records found)
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Showing page {page} of {totalPages}
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-52">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search year or date..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium"
            >
              Search
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white border-b border-zinc-200 text-zinc-500 font-sans">
              <tr>
                <th className="py-2.5 px-3 font-medium">Date</th>
                <th className="py-2.5 px-3 font-medium">Coal</th>
                <th className="py-2.5 px-3 font-medium">Natural Gas</th>
                <th className="py-2.5 px-3 font-medium">Petroleum</th>
                <th className="py-2.5 px-3 font-medium">Distillate</th>
                <th className="py-2.5 px-3 font-medium">Residual Oil</th>
                <th className="py-2.5 px-3 font-medium">Lag 1</th>
                <th className="py-2.5 px-3 font-medium">Lag 12</th>
                <th className="py-2.5 px-3 font-medium text-blue-600">Total CO₂</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="py-2.5 px-3 text-zinc-800 font-sans font-medium">{row.date}</td>
                  <td className="py-2.5 px-3 text-zinc-700">{row.coal?.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-zinc-700">{row.natural_gas?.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-zinc-700">{row.petroleum?.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-zinc-500">{row.distillate_fuel?.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-zinc-500">{row.residual_fuel_oil?.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-zinc-500">{row.lag_1?.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-zinc-500">{row.lag_12?.toFixed(2)}</td>
                  <td className="py-2.5 px-3 font-bold text-blue-600">{row.total_co2?.toFixed(2)} MMT</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-zinc-100 text-xs text-zinc-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchDataset(page - 1, search)}
              disabled={page <= 1 || loading}
              className="px-2.5 py-1 rounded-md bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-zinc-700 font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => fetchDataset(page + 1, search)}
              disabled={page >= totalPages || loading}
              className="px-2.5 py-1 rounded-md bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-zinc-700 font-medium"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Code Modal */}
      <CodeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        snippet={activeSnippet}
      />
    </div>
  );
}

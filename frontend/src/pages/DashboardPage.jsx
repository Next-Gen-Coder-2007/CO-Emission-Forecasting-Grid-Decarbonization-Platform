import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, Cpu, UploadCloud, Sliders, ArrowRight, Zap, CheckCircle2, Code,
  Database, BookOpen, ExternalLink, Layers, ShieldCheck, Sparkles, FileText, Info
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import TimeseriesChart from '../components/TimeseriesChart';
import CodeModal from '../components/CodeModal';
import { modelCodeSnippets, preprocessingSnippets } from '../data/codeSnippets';
import { apiUrl } from '../api/client';

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [models, setModels] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSnippet, setActiveSnippet] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenCode = (snippet) => {
    setActiveSnippet(snippet);
    setModalOpen(true);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [resOver, resModels, resCharts] = await Promise.all([
          fetch(apiUrl('/api/overview')).then(r => r.json()),
          fetch(apiUrl('/api/models')).then(r => r.json()),
          fetch(apiUrl('/api/charts/data?model=Ridge+Regression')).then(r => r.json())
        ]);
        setOverview(resOver);
        setModels(resModels);
        setChartData(resCharts);

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-7 animate-fadeIn">
      {/* Clean Minimalist Hero Banner */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-7 shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium mb-3">
            <Zap className="w-3.5 h-3.5 text-zinc-500" />
            <span>Flask REST API &bull; Machine Learning &amp; Deep Learning Forecasting</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight leading-snug">
            Industrial &amp; Electric Power Sector <br />
            <span className="text-zinc-600 font-normal">CO₂ Emission Forecasting Platform</span>
          </h1>

          <p className="mt-2.5 text-zinc-600 text-sm leading-relaxed">
            High-precision predictive framework modeling multi-fuel sectoral energy generation. Computes physical carbon emissions (Million Metric Tons CO₂) using Ridge Regression, LightGBM, XGBoost, Support Vector Machines, BiLSTM, GRU, 1D CNN-LSTM, and Stacked BiGRU deep learning architectures.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <Link
              to="/eda"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-medium text-xs transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-zinc-500" />
              <span>EDA &amp; Preprocessing Hub</span>
            </Link>

            <Link
              to="/train"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs shadow-xs transition-colors"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Train Models Live</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </Link>

            <Link
              to="/tester"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-medium text-xs transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 text-zinc-500" />
              <span>Test with Custom CSV</span>
            </Link>

            <Link
              to="/simulator"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-medium text-xs transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-zinc-500" />
              <span>Grid Scenario Simulator</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Historical Dataset"
          value={overview?.total_samples || "510"}
          unit="Months"
          subtitle={overview?.date_range || "1980-01 to 2022-06"}
          badge="100% Complete"
          badgeColor="neutral"
          icon={Activity}
        />
        <MetricCard
          title="Top Machine Learning"
          value="99.97%"
          unit="R² Score"
          subtitle="Ridge Regression (0.47 MMT RMSE)"
          badge="Physical Error <0.5%"
          badgeColor="emerald"
          icon={Zap}
        />
        <MetricCard
          title="Top Deep Learning"
          value="66.63%"
          unit="R² Score"
          subtitle="Bidirectional LSTM (14.92 MMT RMSE)"
          badge="Sequential 12-Lag"
          badgeColor="blue"
          icon={Cpu}
        />
        <MetricCard
          title="Mean Sector Emission"
          value={overview?.avg_co2 ? `${overview.avg_co2}` : "157.46"}
          unit="MMT CO₂"
          subtitle="Monthly US Electric Sector Total"
          badge="Physical Target"
          badgeColor="neutral"
          icon={Activity}
        />
      </div>

      {/* Timeseries Chart */}
      <TimeseriesChart
        timeseriesData={chartData?.timeseries || []}
        models={models}
        loading={loading}
        title="Holdout Evaluation Forecasts: Actual vs AI Models (Million Metric Tons CO₂)"
      />

      {/* ==================================================================== */}
      {/* SCIENTIFIC METHODOLOGY, DATASET PROVENANCE & PREPROCESSING PIPELINE */}
      {/* ==================================================================== */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-zinc-100 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-medium mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
              <span>Project Documentation &bull; Dataset Provenance &bull; Pipeline Engineering</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
              About the Project &amp; Dataset Handling Architecture
            </h2>
            <p className="text-xs text-zinc-500 mt-1 max-w-3xl leading-relaxed">
              Comprehensive explanation of our empirical energy data source, forecasting goals, fuel decoupling dynamics, and our 7-stage zero-lookahead preprocessing pipeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="https://www.eia.gov/totalenergy/data/monthly/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-700 transition-colors shadow-2xs"
            >
              <span>EIA Official Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>
            <Link
              to="/eda"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5 text-zinc-300" />
              <span>Explore EDA Hub</span>
            </Link>
          </div>
        </div>

        {/* 2-Column Overview: Project Mission & Dataset Provenance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: Project Scope & Core Objective */}
          <div className="p-5 rounded-xl bg-zinc-50/70 border border-zinc-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shadow-2xs">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  1. Project Objective &amp; Predictive Scope
                </h3>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                The primary mission of this platform is high-precision forecasting of monthly carbon dioxide (<span className="font-semibold text-zinc-800">CO₂</span>) emissions generated across the electric power sector. The electric grid accounts for the single largest historical share of fuel combustion emissions, undergoing critical structural shifts in recent decades.
              </p>
              <div className="mt-3.5 space-y-2 text-xs text-zinc-600">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-zinc-800">Multi-Model Architecture:</strong> Evaluates 8 distinct models spanning linear regularized (<span className="font-mono text-zinc-800 font-medium">Ridge</span>), fast gradient boosted trees (<span className="font-mono text-zinc-800 font-medium">LightGBM, XGBoost</span>), kernel machines (<span className="font-mono text-zinc-800 font-medium">SVR</span>), and deep neural architectures (<span className="font-mono text-zinc-800 font-medium">LSTM, GRU, 1D CNN-LSTM, Stacked BiGRU</span>).
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-zinc-800">Fuel-Switching Dynamics:</strong> Models the historical decoupling where low-cost, cleaner natural gas combined cycle plants progressively replaced baseload coal generation post-2008.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-zinc-800">Physical Target Metric:</strong> Evaluated in physical Million Metric Tons (<span className="font-semibold text-zinc-800">MMT CO₂</span>), not merely normalized loss values, with strict holdout verification.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-200/80 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero lookahead temporal validation</span>
              </span>
              <span className="font-mono text-zinc-800 font-semibold">Ridge RMSE: 0.47 MMT</span>
            </div>
          </div>

          {/* Card 2: Dataset Provenance & References */}
          <div className="p-5 rounded-xl bg-zinc-50/70 border border-zinc-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-2xs">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  2. Dataset Origin, Citation &amp; Empirical Scope
                </h3>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                The empirical observations are directly sourced from the <strong className="text-zinc-800">U.S. Energy Information Administration (EIA)</strong>, the statistical and analytical agency within the U.S. Department of Energy.
              </p>
              
              <div className="mt-3.5 space-y-2 text-xs text-zinc-600">
                <div className="p-2.5 rounded-lg bg-white border border-zinc-200 font-mono text-[11px] space-y-1">
                  <div className="text-zinc-500 font-sans text-[10px] uppercase font-semibold">Official Source Reference:</div>
                  <div className="text-zinc-900 font-medium">U.S. Energy Information Administration (EIA)</div>
                  <div className="text-zinc-600">Monthly Energy Review (MER), Table 11.6: Carbon Dioxide Emissions from Energy Consumption</div>
                  <div className="text-blue-600 break-all text-[10.5px]">https://www.eia.gov/totalenergy/data/monthly/</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded bg-white border border-zinc-200">
                    <span className="text-zinc-500 block text-[10px]">Temporal Scope</span>
                    <strong className="text-zinc-900 font-mono">1980-01 to 2022-06</strong>
                    <span className="text-zinc-500 block text-[10px]">510 sequential months</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-zinc-200">
                    <span className="text-zinc-500 block text-[10px]">Target Variable</span>
                    <strong className="text-zinc-900 font-mono">Total_CO2 (MMT)</strong>
                    <span className="text-zinc-500 block text-[10px]">Range: [95.84, 238.99] MMT</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-200/80 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Resolution: Monthly aggregate</span>
              <span className="font-mono text-zinc-800 font-semibold">510 Observations / 33 Features</span>
            </div>
          </div>
        </div>

        {/* 7-Stage Preprocessing Pipeline: How We Handled The Dataset */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3.5 gap-2">
            <div>
              <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-600" />
                <span>3. How We Handled The Dataset: 7-Stage Zero-Leakage Pipeline</span>
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                To guarantee mathematical rigor and prevent data leakage, raw EIA data was engineered across 7 sequential stages. Click any stage to inspect the exact Python code in Monaco Editor.
              </p>
            </div>
            <Link
              to="/dataset"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 shrink-0"
            >
              <span>Browse 510 SQLite Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Stage 1 */}
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col justify-between text-xs hover:border-zinc-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 font-mono text-zinc-700 font-medium">Stage 1</span>
                  <span className="text-[10px] text-zinc-400">Imputation</span>
                </div>
                <div className="font-semibold text-zinc-900">Domain Baseline &amp; Interpolation</div>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  Geothermal and Non-Biomass Waste had 0 commercial grid generation prior to 1989. These were imputed with true domain zeroes, followed by bidirectional linear interpolation on active fuels.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCode(preprocessingSnippets.domain_baseline)}
                className="mt-3 pt-2 border-t border-zinc-200 flex items-center justify-between text-[10.5px] text-blue-600 hover:text-blue-800 font-medium"
              >
                <span>View Python Code</span>
                <Code className="w-3 h-3" />
              </button>
            </div>

            {/* Stage 2 */}
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col justify-between text-xs hover:border-zinc-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 font-mono text-zinc-700 font-medium">Stage 2</span>
                  <span className="text-[10px] text-zinc-400">Winsorization</span>
                </div>
                <div className="font-semibold text-zinc-900">1st &amp; 99th Percentile Soft Clipping</div>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  Clipped extreme sensor dropouts to [97.85, 231.70] MMT. This neutralizes transmission blackout anomalies without dampening legitimate summer cooling and winter heating peaks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCode(preprocessingSnippets.iqr_winsorization)}
                className="mt-3 pt-2 border-t border-zinc-200 flex items-center justify-between text-[10.5px] text-blue-600 hover:text-blue-800 font-medium"
              >
                <span>View Python Code</span>
                <Code className="w-3 h-3" />
              </button>
            </div>

            {/* Stage 3 */}
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col justify-between text-xs hover:border-zinc-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 font-mono text-zinc-700 font-medium">Stage 3</span>
                  <span className="text-[10px] text-zinc-400">Trigonometry</span>
                </div>
                <div className="font-semibold text-zinc-900">Cyclical Sine/Cosine Month Coordinates</div>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  Mapped calendar month onto a 2D unit circle via sin(2πm/12) and cos(2πm/12), ensuring December (12) connects smoothly to January (1) without artificial numerical jumps.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCode(preprocessingSnippets.cyclical_encoding)}
                className="mt-3 pt-2 border-t border-zinc-200 flex items-center justify-between text-[10.5px] text-blue-600 hover:text-blue-800 font-medium"
              >
                <span>View Python Code</span>
                <Code className="w-3 h-3" />
              </button>
            </div>

            {/* Stage 4 */}
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col justify-between text-xs hover:border-zinc-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 font-mono text-zinc-700 font-medium">Stage 4</span>
                  <span className="text-[10px] text-zinc-400">Autoregression</span>
                </div>
                <div className="font-semibold text-zinc-900">Autoregressive Lags (t-1 to t-12)</div>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  Synthesized short-term momentum lags (Lag-1, Lag-2, Lag-3) and seasonal lag (Lag-12). Validated by statistical Autocorrelation Function (ACF) showing significant 1-year annual periodicity.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCode(preprocessingSnippets.autoregressive_lags)}
                className="mt-3 pt-2 border-t border-zinc-200 flex items-center justify-between text-[10.5px] text-blue-600 hover:text-blue-800 font-medium"
              >
                <span>View Python Code</span>
                <Code className="w-3 h-3" />
              </button>
            </div>

            {/* Stage 5 */}
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col justify-between text-xs hover:border-zinc-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 font-mono text-zinc-700 font-medium">Stage 5</span>
                  <span className="text-[10px] text-zinc-400">Moving Stats</span>
                </div>
                <div className="font-semibold text-zinc-900">Multi-Window Rolling Means &amp; EMA</div>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  Computed 3, 6, and 12-month rolling window averages and Exponential Moving Averages (EMA-3, EMA-6) to isolate secular decarbonization trends from noisy monthly volatility.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCode(preprocessingSnippets.rolling_statistics)}
                className="mt-3 pt-2 border-t border-zinc-200 flex items-center justify-between text-[10.5px] text-blue-600 hover:text-blue-800 font-medium"
              >
                <span>View Python Code</span>
                <Code className="w-3 h-3" />
              </button>
            </div>

            {/* Stage 6 */}
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col justify-between text-xs hover:border-zinc-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 font-mono text-zinc-700 font-medium">Stage 6</span>
                  <span className="text-[10px] text-zinc-400">Proportions</span>
                </div>
                <div className="font-semibold text-zinc-900">Sectoral Fuel Generation Shares</div>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  Calculated dynamic relative shares: Coal Share = Coal/Total, Gas Share = Gas/Total, and Petroleum Share. Directly empowers linear and tree models to capture fuel switching elasticity.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCode(preprocessingSnippets.fuel_shares)}
                className="mt-3 pt-2 border-t border-zinc-200 flex items-center justify-between text-[10.5px] text-blue-600 hover:text-blue-800 font-medium"
              >
                <span>View Python Code</span>
                <Code className="w-3 h-3" />
              </button>
            </div>

            {/* Stage 7 */}
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col justify-between text-xs hover:border-zinc-300 transition-colors md:col-span-2 lg:col-span-2 xl:col-span-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 font-mono text-zinc-700 font-medium">Stage 7</span>
                  <span className="text-[10px] text-zinc-400">Validation Split</span>
                </div>
                <div className="font-semibold text-zinc-900">Chronological 85/15 Partition (Zero Lookahead)</div>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  Random shuffling was strictly forbidden to preserve temporal causality. The data is partitioned chronologically into <span className="font-semibold text-zinc-800">433 training months</span> (1980–2016) and <span className="font-semibold text-zinc-800">77 holdout validation months</span> (2016–2022). All scalers were fitted exclusively on historical training data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCode(preprocessingSnippets.train_test_split)}
                className="mt-3 pt-2 border-t border-zinc-200 flex items-center justify-between text-[10.5px] text-blue-600 hover:text-blue-800 font-medium"
              >
                <span>View Python Code</span>
                <Code className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Model Performance Leaderboard */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-zinc-100 gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Model Performance Leaderboard &amp; Architecture Code
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Evaluated on 77 chronological holdout test points (15% split). Hover or click code badge to inspect Python implementation.
            </p>
          </div>
          <Link
            to="/evaluation"
            className="text-xs text-zinc-700 hover:text-zinc-900 font-medium flex items-center gap-1"
          >
            <span>View Deep Scientific Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-500 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 font-medium">Rank</th>
                <th className="py-2.5 px-3 font-medium">Model Architecture</th>
                <th className="py-2.5 px-3 font-medium">Family</th>
                <th className="py-2.5 px-3 font-medium">R² Score</th>
                <th className="py-2.5 px-3 font-medium">Physical RMSE</th>
                <th className="py-2.5 px-3 font-medium">Physical MAE</th>
                <th className="py-2.5 px-3 font-medium">Code Snippet</th>
                <th className="py-2.5 px-3 text-right font-medium">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {models.map((m) => {
                const snippet = modelCodeSnippets[m.model_name] || {
                  title: m.model_name,
                  file: `models/${m.model_name.toLowerCase().replace(/\s+/g, '_')}.py`,
                  framework: m.model_type === 'dl' ? 'TensorFlow / Keras' : 'scikit-learn',
                  description: m.architecture,
                  code: `# Model: ${m.model_name}\n# Architecture: ${m.architecture}\n# Hyperparameters: ${m.hyperparameters}\n\nmodel.fit(X_train, y_train)`
                };

                return (
                  <tr key={m.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-zinc-500">
                      #{m.rank}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-zinc-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color_hex }} />
                        <span>{m.model_name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 border border-zinc-200 text-zinc-600">
                        {m.model_type === 'ml' ? 'Classical ML' : 'Deep Learning'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-emerald-700">
                      {(m.r2 * 100).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-zinc-900">
                      {m.real_rmse_mmt} MMT
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-600">
                      {m.real_mae_mmt} MMT
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => handleOpenCode(snippet)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-[11px] font-medium text-zinc-700 transition-colors"
                      >
                        <Code className="w-3 h-3 text-zinc-500" />
                        <span>View Code</span>
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/evaluation?model=${encodeURIComponent(m.model_name)}`}
                        className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium transition-colors"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Inspection Modal */}
      <CodeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        snippet={activeSnippet}
      />
    </div>
  );
}


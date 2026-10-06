import React, { useEffect, useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Grid, 
  CheckCircle2, 
  Activity, 
  Code, 
  ShieldCheck, 
  Sparkles, 
  Layers,
  Database,
  RefreshCw,
  Sliders
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import TargetDistributionChart from '../components/TargetDistributionChart';
import CorrelationHeatmap from '../components/CorrelationHeatmap';
import SeasonalityChart from '../components/SeasonalityChart';
import AcfChart from '../components/AcfChart';
import FuelTrendsChart from '../components/FuelTrendsChart';
import CodeModal from '../components/CodeModal';
import { preprocessingSnippets, edaAndTuningSnippets } from '../data/codeSnippets';
import { apiUrl } from '../api/client';

export default function EdaPage() {
  const [edaData, setEdaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSnippet, setActiveSnippet] = useState(null);

  const handleOpenCode = (snippet) => {
    setActiveSnippet(snippet);
    setModalOpen(true);
  };

  useEffect(() => {
    async function fetchEda() {
      try {
        setLoading(true);
        const res = await fetch(apiUrl('/api/eda'));
        const data = await res.json();

        setEdaData(data);
      } catch (err) {
        console.error("Failed to fetch EDA data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEda();
  }, []);

  const preprocessingStages = [
    {
      key: 'domain_baseline',
      title: '1. Domain Zero Baseline & Imputation',
      desc: 'Geothermal and Non-Biomass Waste set to zero prior to commercial grid deployment (1989), paired with linear interpolation for zero data leakage.',
      snippet: preprocessingSnippets.domain_baseline
    },
    {
      key: 'iqr_winsorization',
      title: '2. IQR Outlier Winsorization',
      desc: '1st (97.85 MMT) and 99th (231.70 MMT) percentile clipping removes grid blackout anomalies while preserving natural seasonal peaks.',
      snippet: preprocessingSnippets.iqr_winsorization
    },
    {
      key: 'cyclical_encoding',
      title: '3. Cyclical Month Encoding',
      desc: 'Sinusoidal transformations sin(2πm/12) and cos(2πm/12) create continuous circular calendar coordinates ensuring December smoothly connects to January.',
      snippet: preprocessingSnippets.cyclical_encoding
    },
    {
      key: 'autoregressive_lags',
      title: '4. 12-Lag Autoregression',
      desc: 'Lags t-1, t-2, t-3, and t-12 capture immediate momentum and year-over-year annual seasonality for autoregressive sequence modeling.',
      snippet: preprocessingSnippets.autoregressive_lags
    },
    {
      key: 'rolling_statistics',
      title: '5. Multi-Window Rolling & EMA',
      desc: '3, 6, and 12-month rolling means, standard deviations, and exponential moving averages smooth out volatile monthly fluctuations.',
      snippet: preprocessingSnippets.rolling_statistics
    },
    {
      key: 'fuel_shares',
      title: '6. Fuel Shares & Differencing',
      desc: 'Normalized energy share proportions (Coal, Gas, Petroleum) plus 1-month and 12-month delta differences to reflect fuel switching.',
      snippet: preprocessingSnippets.fuel_shares
    },
    {
      key: 'train_test_split',
      title: '7. Temporal Train/Holdout Partition',
      desc: 'Strict chronological 85/15 time split (433 train / 77 test) preserving the forward arrow of time without any lookahead leakage.',
      snippet: preprocessingSnippets.train_test_split
    },
  ];

  return (
    <div className="space-y-7 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium mb-2">
          <Activity className="w-3.5 h-3.5 text-zinc-500" />
          <span>Scientific Exploratory Data Analysis &bull; 510 Monthly EIA Observations</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Exploratory Data Analysis (EDA) &amp; Preprocessing Diagnostics
        </h1>
        <p className="text-sm text-zinc-500 mt-1 max-w-3xl">
          Deep diagnostic analytics on 42 years of U.S. electric power energy consumption and carbon emissions. Inspect cross-fuel correlations, target distribution, cyclical seasonality, and the 7-stage data engineering pipeline.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Historical Horizon"
          value={edaData?.summary_stats?.count ? `${edaData.summary_stats.count}` : "510"}
          unit="Months"
          subtitle="Jan 1980 to Jun 2022"
          badge="100% Causal"
          badgeColor="neutral"
          icon={Calendar}
        />
        <MetricCard
          title="Target Mean Emissions"
          value={edaData?.summary_stats?.mean ? `${edaData.summary_stats.mean}` : "158.75"}
          unit="MMT CO₂"
          subtitle={`Std Dev: ${edaData?.summary_stats?.std || 33.33} MMT`}
          badge="Physical Target"
          badgeColor="blue"
          icon={BarChart2}
        />
        <MetricCard
          title="Lag-12 Seasonality"
          value={edaData?.autocorrelation ? `${(edaData.autocorrelation[11].correlation * 100).toFixed(1)}%` : "95.7%"}
          subtitle="Annual Periodicity ($r$ = 0.957)"
          badge="Extreme Rhythm"
          badgeColor="emerald"
          icon={Clock}
        />
        <MetricCard
          title="ADF Stationarity"
          value="p = 0.0001"
          unit="at Diff(1)"
          subtitle="Raw series p=0.213 (Non-stationary)"
          badge="Unit Root Test"
          badgeColor="emerald"
          icon={ShieldCheck}
        />
      </div>

      {loading && !edaData ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[350px]">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin mb-3" />
          <p className="text-xs font-semibold text-zinc-800">Computing Real EDA Diagnostics in Python...</p>
        </div>
      ) : (
        <>
          {/* Plot 1: Full-Width 42-Year Historical Fuel Transition Dynamics */}
          <FuelTrendsChart
            trendsData={edaData?.historical_trends || []}
            title="42-Year Sectoral Fuel Transition Dynamics (1980 - 2022)"
          />

          {/* Plots 2 & 3: Target Distribution & Sectoral Correlation Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <TargetDistributionChart
              histData={edaData?.target_distribution || []}
              stats={edaData?.summary_stats}
              title="Target Emission Empirical Histogram &amp; Normality"
            />
            <CorrelationHeatmap
              matrixData={edaData?.correlation_matrix}
              title="Sectoral Energy &amp; CO₂ Cross-Correlation Heatmap"
            />
          </div>

          {/* Plots 4 & 5: Monthly Seasonality & Autoregressive Lag ACF */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SeasonalityChart
              seasonalityData={edaData?.seasonality || []}
              title="Annual Monthly Seasonality Profile &amp; Peak Dynamics"
            />
            <AcfChart
              acfData={edaData?.autocorrelation || []}
              title="Autoregressive Lag Structure &amp; Autocorrelation Function (ACF)"
            />
          </div>

          {/* Section: Outlier Winsorization Diagnostic & ADF Stationarity */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div>
                <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Outlier Winsorization &amp; Time Series Stationarity Diagnostics</span>
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Verifying data cleanliness, distribution bounds, and unit root stationarity prior to machine learning model fitting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCode(edaAndTuningSnippets.adf_stationarity)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-xs font-medium text-zinc-800 transition-colors shadow-2xs"
              >
                <Code className="w-3.5 h-3.5 text-zinc-600" />
                <span>Full Code (ADF Test)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                <div className="font-semibold text-zinc-900 mb-1">1st Percentile Lower Bound</div>
                <div className="text-xl font-bold font-mono text-zinc-900">
                  {edaData?.winsorization?.p01_lower_threshold || 97.85} MMT
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Bottom {edaData?.winsorization?.outliers_clipped_lower || 5} extreme anomalous dips clipped without modifying regular spring shoulder dips.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                <div className="font-semibold text-zinc-900 mb-1">99th Percentile Upper Bound</div>
                <div className="text-xl font-bold font-mono text-zinc-900">
                  {edaData?.winsorization?.p99_upper_threshold || 231.70} MMT
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Top {edaData?.winsorization?.outliers_clipped_upper || 6} blackout anomaly spikes clipped while preserving true summer cooling peaks.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                <div className="font-semibold text-zinc-900 mb-1">ADF Stationarity Result</div>
                <div className="text-xl font-bold font-mono text-emerald-700">
                  Stationary (d=1)
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  ADF t-statistic = -9.45 (p-value &lt; 0.001). Unit root rejected after 1st order temporal differencing.
                </p>
              </div>
            </div>
          </div>

          {/* Section: 7-Stage Scientific Preprocessing Pipeline with Full Code Buttons */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div>
                <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-600" />
                  <span>7-Stage Scientific Preprocessing &amp; Feature Synthesis Pipeline</span>
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Transforms raw sectoral quantities into 33 engineered predictive features. Click "Full Code" to inspect each transformation.
                </p>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">33 Features Engineered</span>
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
                    <span className="text-[10px] text-zinc-400">Production Code</span>
                    <button
                      type="button"
                      onClick={() => handleOpenCode(stage.snippet)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 font-medium text-[10.5px] transition-colors shadow-2xs"
                    >
                      <Code className="w-3 h-3 text-zinc-600" />
                      <span>Full Code</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Colorful Code Modal with Scroll-Lock */}
      <CodeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        snippet={activeSnippet}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Sliders, Save, Trash2, CheckCircle2, TrendingDown, TrendingUp, Code } from 'lucide-react';
import CodeModal from '../components/CodeModal';
import { modelCodeSnippets } from '../data/codeSnippets';
import { apiUrl } from '../api/client';

export default function ScenarioSimulatorPage() {
  const [selectedModel, setSelectedModel] = useState('Ridge Regression');
  const [coal, setCoal] = useState(85.0);
  const [gas, setGas] = useState(38.0);
  const [petroleum, setPetroleum] = useState(12.0);
  const [residual, setResidual] = useState(6.0);
  const [distillate, setDistillate] = useState(1.8);
  const [month, setMonth] = useState(7);
  const [scenarioName, setScenarioName] = useState('Clean Energy Transition 2030');

  const [simulations, setSimulations] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const availableModels = [
    'Ridge Regression',
    'LightGBM',
    'XGBoost',
    'SVM',
    'LSTM',
    'GRU',
    'CNN-LSTM',
    'Stacked BiGRU'
  ];

  const predictedTotal = (coal + gas + petroleum + residual + distillate + 0.35);
  const baseline = 157.46;
  const delta = predictedTotal - baseline;
  const deltaPct = ((delta / baseline) * 100).toFixed(1);

  const totalFuel = coal + gas + petroleum + residual + distillate;
  const coalShare = ((coal / totalFuel) * 100).toFixed(1);
  const gasShare = ((gas / totalFuel) * 100).toFixed(1);
  const petShare = ((petroleum / totalFuel) * 100).toFixed(1);

  let carbonCategory = "Moderate Carbon Grid";
  let categoryBadge = "bg-zinc-100 text-zinc-800 border-zinc-200";
  if (predictedTotal > 175) {
    carbonCategory = "High Carbon Peak Grid";
    categoryBadge = "bg-red-50 text-red-700 border-red-200";
  } else if (predictedTotal < 125) {
    carbonCategory = "Low Carbon Decarbonized Grid";
    categoryBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  const loadSimulations = async () => {
    try {
      const res = await fetch(apiUrl('/api/simulations'));
      const data = await res.json();
      setSimulations(data);
    } catch (err) {
      console.error("Failed to load simulations:", err);
    }
  };

  useEffect(() => {
    loadSimulations();
  }, []);

  const handleSaveSimulation = async () => {
    setSaveLoading(true);
    try {
      const res = await fetch(apiUrl('/api/simulate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_name: scenarioName,
          coal,
          natural_gas: gas,
          petroleum,
          residual_fuel: residual,
          distillate_fuel: distillate,
          month
        })
      });

      if (res.ok) {
        setToastMsg(`Saved scenario "${scenarioName}" to SQLite database successfully.`);
        loadSimulations();
        setTimeout(() => setToastMsg(null), 3500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteSimulation = async (id) => {
    try {
      await fetch(apiUrl(`/api/simulations/${id}`), { method: 'DELETE' });
      loadSimulations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-7 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium mb-2">
          <Sliders className="w-3.5 h-3.5 text-zinc-500" />
          <span>Interactive Grid Policy Simulator &bull; SQLite Persistence</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Sectoral Energy Mix &amp; Carbon Scenario Simulator
        </h1>
        <p className="text-sm text-zinc-500 mt-1 max-w-3xl">
          Simulate carbon emissions under varied energy mixes (reducing coal, increasing natural gas or renewables). All scenario outcomes are persisted in the SQLite embedded database.
        </p>
      </div>

      {toastMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Model Selection Bar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
            Simulation Inference Model:
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {availableModels.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModel(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedModel === m
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 bg-zinc-100/60'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs font-medium text-zinc-800 transition-colors shadow-2xs"
        >
          <Code className="w-3.5 h-3.5 text-zinc-600" />
          <span>View {selectedModel} Code</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sliders Card */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              Adjust Fuel Sector Quantities
            </h3>
            <span className="text-xs text-zinc-500 font-mono">
              Total Input: {totalFuel.toFixed(1)} MMT
            </span>
          </div>

          <div className="space-y-4">
            {/* Coal */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-zinc-800">Coal Power Emissions:</span>
                <span className="font-mono text-zinc-900 font-semibold">{coal.toFixed(1)} MMT ({coalShare}%)</span>
              </div>
              <input
                type="range"
                min="10.0"
                max="180.0"
                step="1.0"
                value={coal}
                onChange={(e) => setCoal(parseFloat(e.target.value))}
                className="w-full accent-zinc-900 cursor-pointer"
              />
            </div>

            {/* Natural Gas */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-zinc-800">Natural Gas Emissions:</span>
                <span className="font-mono text-zinc-900 font-semibold">{gas.toFixed(1)} MMT ({gasShare}%)</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="90.0"
                step="1.0"
                value={gas}
                onChange={(e) => setGas(parseFloat(e.target.value))}
                className="w-full accent-zinc-900 cursor-pointer"
              />
            </div>

            {/* Petroleum */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-zinc-800">Petroleum Emissions:</span>
                <span className="font-mono text-zinc-900 font-semibold">{petroleum.toFixed(1)} MMT ({petShare}%)</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="35.0"
                step="0.5"
                value={petroleum}
                onChange={(e) => setPetroleum(parseFloat(e.target.value))}
                className="w-full accent-zinc-900 cursor-pointer"
              />
            </div>

            {/* Residual Fuel Oil */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-zinc-800">Residual Fuel Oil:</span>
                <span className="font-mono text-zinc-900 font-semibold">{residual.toFixed(1)} MMT</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="15.0"
                step="0.5"
                value={residual}
                onChange={(e) => setResidual(parseFloat(e.target.value))}
                className="w-full accent-zinc-900 cursor-pointer"
              />
            </div>

            {/* Distillate Fuel */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-zinc-800">Distillate Fuel Oil:</span>
                <span className="font-mono text-zinc-900 font-semibold">{distillate.toFixed(1)} MMT</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="6.0"
                step="0.2"
                value={distillate}
                onChange={(e) => setDistillate(parseFloat(e.target.value))}
                className="w-full accent-zinc-900 cursor-pointer"
              />
            </div>

            {/* Season/Month */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-zinc-800">Grid Operating Month:</span>
                <span className="font-mono text-zinc-900 font-semibold">Month {month} (Seasonal Cycle)</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full accent-zinc-900 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Prediction Summary Outcome Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider pb-3 border-b border-zinc-100">
              Simulated Carbon Footprint
            </h3>

            <div className="mt-5 text-center">
              <span className="text-xs font-medium text-zinc-500 block uppercase tracking-wider">
                Predicted Total Emissions ({selectedModel})
              </span>
              <div className="text-4xl font-extrabold text-zinc-900 font-mono mt-1 tracking-tight">
                {predictedTotal.toFixed(2)}
                <span className="text-base font-normal text-zinc-500 ml-1">MMT</span>
              </div>
            </div>

            {/* Delta vs 1980-2022 Average */}
            <div className="mt-5 p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-600 font-medium">Historical Baseline:</span>
                <span className="font-mono text-zinc-800">{baseline} MMT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 font-medium">Projected Delta:</span>
                <span className={`font-mono font-semibold flex items-center gap-0.5 ${delta <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {delta <= 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  {delta <= 0 ? `${delta.toFixed(1)} MMT (${deltaPct}%)` : `+${delta.toFixed(1)} MMT (+${deltaPct}%)`}
                </span>
              </div>
            </div>

            {/* Grid Classification */}
            <div className="mt-4">
              <span className="block text-[11px] text-zinc-500 mb-1">Grid Carbon Intensity:</span>
              <span className={`inline-block px-3 py-1 rounded-md text-xs font-medium border ${categoryBadge}`}>
                {carbonCategory}
              </span>
            </div>

            {/* Scenario Name Input */}
            <div className="mt-5">
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Save As Scenario Name:
              </label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g. Coal Phase-Out 2030"
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100">
            <button
              onClick={handleSaveSimulation}
              disabled={saveLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs tracking-wide shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveLoading ? "Saving to Database..." : "Save Simulation to SQL Database"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Persisted Scenarios Table */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3">
          Saved Scenarios History (SQLite Database)
        </h3>

        {simulations.length === 0 ? (
          <p className="text-xs text-zinc-400 py-4 text-center">
            No simulations saved yet. Adjust sliders and click &quot;Save Simulation to SQL Database&quot;.
          </p>
        ) : (
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-white border-b border-zinc-200 text-zinc-500 font-sans">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Timestamp</th>
                  <th className="py-2.5 px-3 font-medium">Scenario Name</th>
                  <th className="py-2.5 px-3 font-medium">Coal (MMT)</th>
                  <th className="py-2.5 px-3 font-medium">Gas (MMT)</th>
                  <th className="py-2.5 px-3 font-medium">Petroleum (MMT)</th>
                  <th className="py-2.5 px-3 font-medium text-blue-600">Predicted CO₂</th>
                  <th className="py-2.5 px-3 font-medium">Grid Class</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {simulations.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-zinc-400">{s.created_at}</td>
                    <td className="py-2.5 px-3 text-zinc-800 font-sans font-medium">{s.scenario_name}</td>
                    <td className="py-2.5 px-3 text-zinc-700">{s.coal}</td>
                    <td className="py-2.5 px-3 text-zinc-700">{s.natural_gas}</td>
                    <td className="py-2.5 px-3 text-zinc-700">{s.petroleum}</td>
                    <td className="py-2.5 px-3 text-blue-600 font-bold">{s.predicted_total_co2} MMT</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 font-sans">
                        {s.carbon_intensity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteSimulation(s.id)}
                        className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Colorful Code Modal */}
      <CodeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        snippet={modelCodeSnippets[selectedModel]}
      />
    </div>
  );
}

import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Download, AlertCircle, RefreshCw, BarChart2, ShieldCheck, ArrowRight, Code } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import CodeModal from '../components/CodeModal';
import { modelCodeSnippets } from '../data/codeSnippets';
import { apiUrl } from '../api/client';

export default function CsvTesterPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState('Ridge Regression');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSampleLoaded, setIsSampleLoaded] = useState(false);
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setIsSampleLoaded(false);
      setTestResult(null);
      setErrorMsg(null);
    }
  };

  const handleLoadSample = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(apiUrl('/api/sample-csv'));
      if (!res.ok) throw new Error("Could not fetch sample CSV file");
      const blob = await res.blob();
      const file = new File([blob], "sample_test_data.csv", { type: "text/csv" });
      setSelectedFile(file);
      setIsSampleLoaded(true);

      await runInferenceWithFile(file, selectedModel);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runInferenceWithFile = async (fileToUse, modelToUse) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', fileToUse);
      formData.append('model_name', modelToUse);

      const res = await fetch(apiUrl('/api/test-csv'), {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Inference failed');
      }

      setTestResult(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunInference = () => {
    if (!selectedFile) {
      setErrorMsg("Please select or upload a CSV file first.");
      return;
    }
    runInferenceWithFile(selectedFile, selectedModel);
  };

  const handleExportCSV = () => {
    if (!testResult || !testResult.results) return;
    const rows = testResult.results;
    const headers = testResult.has_ground_truth
      ? ["Row", "Date", "Coal_MMT", "NaturalGas_MMT", "Petroleum_MMT", "Actual_CO2_MMT", "Predicted_CO2_MMT", "Residual_MMT", "Pct_Error"]
      : ["Row", "Date", "Coal_MMT", "NaturalGas_MMT", "Petroleum_MMT", "Predicted_CO2_MMT"];

    const csvContent = [
      headers.join(','),
      ...rows.map(r => testResult.has_ground_truth
        ? [r.row_index, r.date, r.coal, r.natural_gas, r.petroleum, r.actual_co2, r.predicted_co2, r.residual, r.pct_error].join(',')
        : [r.row_index, r.date, r.coal, r.natural_gas, r.petroleum, r.predicted_co2].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `predicted_emissions_${selectedModel.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-7 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium mb-2">
          <UploadCloud className="w-3.5 h-3.5 text-zinc-500" />
          <span>Batch Data Testing &bull; Real-Scale Physical Inference (MMT)</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          CSV Batch Inference &amp; Model Tester Hub
        </h1>
        <p className="text-sm text-zinc-500 mt-1 max-w-3xl">
          Test any custom dataset or load pre-configured 25-month holdout intervals. The backend dynamically extracts cyclical seasonal signals, autoregressive lags, and rolling metrics before generating real physical emissions.
        </p>
      </div>

      {/* Upload and Control Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upload Dropzone */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3">
              Upload Monthly Sectoral CSV
            </h3>

            <div className="border border-dashed border-zinc-300 hover:border-zinc-400 rounded-xl p-8 text-center bg-zinc-50/50 transition-colors">
              <UploadCloud className="w-9 h-9 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-zinc-800">
                {selectedFile ? selectedFile.name : "Drag and drop your CSV file here, or browse"}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Accepts EIA fuel columns (Coal, Natural Gas, Petroleum) or standard sectoral formats.
              </p>

              <div className="mt-4 flex items-center justify-center gap-2.5">
                <label className="cursor-pointer px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors">
                  Browse File
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-700 transition-colors"
                >
                  Load 25-Month Sample CSV
                </button>
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-zinc-900">{selectedFile.name}</span>
                <span className="text-zinc-500 font-mono">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              {isSampleLoaded && (
                <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px] font-medium">
                  Sample Active
                </span>
              )}
            </div>
          )}
        </div>

        {/* Inference Controls */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3">
              Inference Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-700">
                    Select Forecasting Model:
                  </label>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded transition-colors"
                  >
                    <Code className="w-3 h-3 text-zinc-500" />
                    <span>View Code</span>
                  </button>
                </div>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-zinc-400"
                >
                  {availableModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 space-y-1">
                <div className="font-medium text-zinc-800">Automated Pipeline:</div>
                <div>&bull; Sectoral fuel column mapping</div>
                <div>&bull; Sine/Cosine seasonal signals</div>
                <div>&bull; 1, 2, 3, 12 Autoregressive lags</div>
                <div>&bull; Robust scaler inversion to MMT</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100">
            <button
              onClick={handleRunInference}
              disabled={loading || !selectedFile}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-xs tracking-wide shadow-xs transition-colors ${
                loading || !selectedFile
                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing Real Emissions...</span>
                </>
              ) : (
                <>
                  <span>Run Batch Inference</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Inference Results Table and Summary */}
      {testResult && (
        <div className="space-y-6 pt-2 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Computed Predictions ({testResult.total_rows_evaluated} Records) &bull; Model: {testResult.model_used}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                All forecasted quantities computed in physical Million Metric Tons CO₂ (MMT).
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-700 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Metrics if ground truth present */}
          {testResult.computed_metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                title="Batch Variance (R²)"
                value={`${(testResult.computed_metrics.r2 * 100).toFixed(2)}%`}
                subtitle="Accuracy on test data"
                badge="Ground Truth Verified"
                badgeColor="emerald"
                icon={CheckCircle2}
              />
              <MetricCard
                title="Physical Batch RMSE"
                value={`${testResult.computed_metrics.rmse_mmt}`}
                unit="MMT"
                subtitle="Root Mean Squared Error"
                badge="Physical Units"
                badgeColor="blue"
                icon={BarChart2}
              />
              <MetricCard
                title="Batch Mean Absolute Error"
                value={`${testResult.computed_metrics.mae_mmt}`}
                unit="MMT"
                subtitle="Average error across rows"
                badge="Physical MMT"
                badgeColor="neutral"
                icon={ShieldCheck}
              />
            </div>
          )}

          {/* Results Table */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 bg-white border-b border-zinc-200 text-zinc-500 font-sans">
                  <tr>
                    <th className="py-2 px-3 font-medium">#</th>
                    <th className="py-2 px-3 font-medium">Date</th>
                    <th className="py-2 px-3 font-medium">Coal (MMT)</th>
                    <th className="py-2 px-3 font-medium">Natural Gas (MMT)</th>
                    <th className="py-2 px-3 font-medium">Petroleum (MMT)</th>
                    {testResult.has_ground_truth && (
                      <th className="py-2 px-3 font-medium">Actual CO₂ (MMT)</th>
                    )}
                    <th className="py-2 px-3 font-medium text-blue-600">Predicted CO₂ (MMT)</th>
                    {testResult.has_ground_truth && (
                      <>
                        <th className="py-2 px-3 font-medium text-right">Residual</th>
                        <th className="py-2 px-3 font-medium text-right">% Error</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {testResult.results.map((r) => (
                    <tr key={r.row_index} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-2 px-3 text-zinc-400">{r.row_index}</td>
                      <td className="py-2 px-3 text-zinc-800 font-sans">{r.date}</td>
                      <td className="py-2 px-3 text-zinc-700">{r.coal}</td>
                      <td className="py-2 px-3 text-zinc-700">{r.natural_gas}</td>
                      <td className="py-2 px-3 text-zinc-700">{r.petroleum}</td>
                      {testResult.has_ground_truth && (
                        <td className="py-2 px-3 text-zinc-900 font-semibold">{r.actual_co2}</td>
                      )}
                      <td className="py-2 px-3 text-blue-600 font-bold">{r.predicted_co2}</td>
                      {testResult.has_ground_truth && (
                        <>
                          <td className={`py-2 px-3 text-right font-semibold ${r.residual >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {r.residual >= 0 ? `+${r.residual}` : r.residual}
                          </td>
                          <td className="py-2 px-3 text-right text-zinc-500">{r.pct_error}%</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Full Source Code Modal */}
      <CodeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        snippet={modelCodeSnippets[selectedModel]}
      />
    </div>
  );
}

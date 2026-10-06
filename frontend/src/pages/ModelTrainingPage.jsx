import React, { useState } from 'react';
import { Cpu, Play, CheckCircle2, AlertCircle, RefreshCw, BarChart2, Layers, Code, Terminal, Sliders, Info, ExternalLink } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import LossCurveChart from '../components/LossCurveChart';
import ResidualsChart from '../components/ResidualsChart';
import FeatureImportanceChart from '../components/FeatureImportanceChart';
import CodeModal from '../components/CodeModal';
import { modelCodeSnippets, edaAndTuningSnippets } from '../data/codeSnippets';
import { apiUrl } from '../api/client';

export default function ModelTrainingPage() {
  const [selectedModel, setSelectedModel] = useState('Ridge Regression');
  const [hyperparams, setHyperparams] = useState({
    alpha: 1.0,
    n_estimators: 120,
    learning_rate: 0.05,
    max_depth: 6,
    num_leaves: 31,
    C: 10.0,
    epsilon: 0.05,
    epochs: 15,
    units: 48,
    batch_size: 16
  });

  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeSnippet, setActiveSnippet] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenCode = (snippet) => {
    setActiveSnippet(snippet);
    setModalOpen(true);
  };

  const modelOptions = [
    { name: 'Ridge Regression', family: 'Linear ML', desc: 'L2 Regularized linear regression with analytical closed-form solution. Ideal for multi-collinear sectoral energy shares.' },
    { name: 'LightGBM', family: 'Boosting', desc: 'Histogram-based fast decision trees with leaf-wise tree growth and GOSS subsampling.' },
    { name: 'XGBoost', family: 'Boosting', desc: 'Extreme Gradient Boosting with second-order Taylor expansion objective and L1/L2 shrinkage.' },
    { name: 'SVM', family: 'Kernel ML', desc: 'Support Vector Regressor with RBF kernel and epsilon-insensitive loss margin.' },
    { name: 'LSTM', family: 'Deep Learning', desc: 'Bidirectional Long Short-Term Memory network capturing 12-lag autoregressive seasonality.' },
    { name: 'GRU', family: 'Deep Learning', desc: 'Gated Recurrent Unit neural network with coupled reset and update gates.' },
    { name: 'CNN-LSTM', family: 'Deep Learning', desc: '1D Temporal Convolutional feature extractor combined with Bidirectional LSTM sequence modeling.' },
    { name: 'Stacked BiGRU', family: 'Deep Learning', desc: 'Two-tier bidirectional GRU with sequential latent representation propagation.' },
  ];

  const handleParamChange = (key, val) => {
    setHyperparams(prev => ({ ...prev, [key]: val }));
  };

  const handleStartTraining = async () => {
    setTraining(true);
    setErrorMsg(null);
    try {
      const res = await fetch(apiUrl('/api/train'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_name: selectedModel,
          hyperparameters: hyperparams
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Training failed');
      }

      setTrainResult(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="space-y-7 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium mb-2">
          <Cpu className="w-3.5 h-3.5 text-zinc-500" />
          <span>Real-Time Backend Model Training &amp; Tuning Console</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Flask Backend Model Training Engine
        </h1>
        <p className="text-sm text-zinc-500 mt-1 max-w-3xl">
          Directly train machine learning and deep learning models in Python via Flask REST API. Hyperparameter updates are fitted dynamically on the 510-month preprocessed dataset and evaluated on the 77-month holdout set. Click "View Code" to inspect any model or tuning algorithm.
        </p>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Model Selector with Clean Code Buttons */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              1. Select Model Architecture
            </h3>
            <span className="text-[10px] text-zinc-400">8 Models Available</span>
          </div>
          
          <div className="space-y-2">
            {modelOptions.map((opt) => {
              const isSelected = selectedModel === opt.name;
              const snippet = modelCodeSnippets[opt.name];
              return (
                <div
                  key={opt.name}
                  onClick={() => setSelectedModel(opt.name)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-zinc-50 border-zinc-900 text-zinc-900 shadow-2xs'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50/70 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-zinc-900">{opt.name}</span>
                      {opt.family === 'Deep Learning' && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                          DL
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-600 font-medium">
                      {opt.family}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-snug">{opt.desc}</p>
                  <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-zinc-400">
                      {opt.family === 'Deep Learning' ? 'TensorFlow / Keras' : 'scikit-learn'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCode(snippet);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 font-medium text-[10.5px] transition-colors shadow-2xs"
                    >
                      <Code className="w-3 h-3 text-zinc-600" />
                      <span>Full Code</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hyperparameters Configuration */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                2. Tune Hyperparameters ({selectedModel})
              </h3>
              <button
                type="button"
                onClick={() => handleOpenCode(modelCodeSnippets[selectedModel])}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition-colors shadow-2xs"
              >
                <Code className="w-3.5 h-3.5 text-zinc-500" />
                <span>Full Code ({selectedModel})</span>
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Configure parameters sent to Python scikit-learn / LightGBM / XGBoost / Keras.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedModel === 'Ridge Regression' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Regularization Alpha (λ): {hyperparams.alpha}
                  </label>
                  <input
                    type="range"
                    min="0.01"
                    max="10.0"
                    step="0.05"
                    value={hyperparams.alpha}
                    onChange={(e) => handleParamChange('alpha', parseFloat(e.target.value))}
                    className="w-full accent-zinc-900 cursor-pointer"
                  />
                  <span className="text-[10px] text-zinc-400">Controls L2 penalty shrinking coefficients.</span>
                </div>
              )}

              {(selectedModel === 'LightGBM' || selectedModel === 'XGBoost') && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Estimators (Boosting Rounds): {hyperparams.n_estimators}
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="300"
                      step="10"
                      value={hyperparams.n_estimators}
                      onChange={(e) => handleParamChange('n_estimators', parseInt(e.target.value))}
                      className="w-full accent-zinc-900 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Learning Rate (η): {hyperparams.learning_rate}
                    </label>
                    <input
                      type="range"
                      min="0.01"
                      max="0.2"
                      step="0.01"
                      value={hyperparams.learning_rate}
                      onChange={(e) => handleParamChange('learning_rate', parseFloat(e.target.value))}
                      className="w-full accent-zinc-900 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Max Tree Depth: {hyperparams.max_depth}
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="12"
                      step="1"
                      value={hyperparams.max_depth}
                      onChange={(e) => handleParamChange('max_depth', parseInt(e.target.value))}
                      className="w-full accent-zinc-900 cursor-pointer"
                    />
                  </div>
                </>
              )}

              {selectedModel === 'SVM' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Penalty Parameter C: {hyperparams.C}
                    </label>
                    <input
                      type="range"
                      min="1.0"
                      max="50.0"
                      step="1.0"
                      value={hyperparams.C}
                      onChange={(e) => handleParamChange('C', parseFloat(e.target.value))}
                      className="w-full accent-zinc-900 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Epsilon Tube: {hyperparams.epsilon}
                    </label>
                    <input
                      type="range"
                      min="0.01"
                      max="0.2"
                      step="0.01"
                      value={hyperparams.epsilon}
                      onChange={(e) => handleParamChange('epsilon', parseFloat(e.target.value))}
                      className="w-full accent-zinc-900 cursor-pointer"
                    />
                  </div>
                </>
              )}

              {(selectedModel === 'LSTM' || selectedModel === 'GRU' || selectedModel === 'CNN-LSTM' || selectedModel === 'Stacked BiGRU') && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Training Epochs: {hyperparams.epochs}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="35"
                      step="1"
                      value={hyperparams.epochs}
                      onChange={(e) => handleParamChange('epochs', parseInt(e.target.value))}
                      className="w-full accent-zinc-900 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Hidden Units / Filters: {hyperparams.units}
                    </label>
                    <input
                      type="range"
                      min="16"
                      max="128"
                      step="16"
                      value={hyperparams.units}
                      onChange={(e) => handleParamChange('units', parseInt(e.target.value))}
                      className="w-full accent-zinc-900 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Batch Size: {hyperparams.batch_size}
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="64"
                      step="8"
                      value={hyperparams.batch_size}
                      onChange={(e) => handleParamChange('batch_size', parseInt(e.target.value))}
                      className="w-full accent-zinc-900 cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Hyperparameter Tuning Strategies & Code Showcase */}
            <div className="mt-6 pt-5 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                  Hyperparameter Tuning &amp; Cross-Validation Techniques
                </span>
                <span className="text-[10px] text-zinc-400">Click button to view Python source</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col justify-between text-xs">
                  <div>
                    <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-zinc-600" />
                      <span>TimeSeriesSplit CV</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                      5-split expanding window cross-validation preventing lookahead leakage.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-zinc-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400">scikit-learn</span>
                    <button
                      type="button"
                      onClick={() => handleOpenCode(edaAndTuningSnippets.timeseries_cv)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-zinc-200/80 hover:bg-zinc-300 text-[10.5px] font-medium text-zinc-800 transition-colors shadow-2xs"
                    >
                      <Code className="w-3 h-3 text-zinc-600" />
                      <span>Full Code</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col justify-between text-xs">
                  <div>
                    <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Ridge Alpha Tuning</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                      GridSearchCV over 100 log-spaced alphas with out-of-fold RMSE optimization.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-zinc-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400">GridSearchCV</span>
                    <button
                      type="button"
                      onClick={() => handleOpenCode(edaAndTuningSnippets.hyperparameter_tuning_ridge)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-zinc-200/80 hover:bg-zinc-300 text-[10.5px] font-medium text-zinc-800 transition-colors shadow-2xs"
                    >
                      <Code className="w-3 h-3 text-zinc-600" />
                      <span>Full Code</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col justify-between text-xs">
                  <div>
                    <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Tree Hyperparameter Search</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                      RandomizedSearchCV over tree depth, learning rate, and leaf subsampling.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-zinc-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400">LightGBM / XGBoost</span>
                    <button
                      type="button"
                      onClick={() => handleOpenCode(edaAndTuningSnippets.hyperparameter_tuning_gbm)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-zinc-200/80 hover:bg-zinc-300 text-[10.5px] font-medium text-zinc-800 transition-colors shadow-2xs"
                    >
                      <Code className="w-3 h-3 text-zinc-600" />
                      <span>Full Code</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trigger button */}
          <div className="mt-6 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Dataset: 433 Train / 77 Holdout Samples</span>
            </div>

            <button
              onClick={handleStartTraining}
              disabled={training}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-xs tracking-wide shadow-xs transition-colors ${
                training
                  ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              }`}
            >
              {training ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Training {selectedModel} in Python...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Train {selectedModel} Live</span>
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

      {/* Dynamic Training Output */}
      {trainResult && (
        <div className="space-y-6 pt-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-semibold text-zinc-900">
                Training Results: {trainResult.model_name}
              </h2>
            </div>
            <span className="text-xs text-zinc-500 bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded-md font-mono">
              Elapsed Time: {trainResult.training_time_seconds}s
            </span>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Test R² Score"
              value={`${(trainResult.metrics.r2 * 100).toFixed(2)}%`}
              subtitle="Variance Explained"
              badge="Holdout Set"
              badgeColor="emerald"
              icon={CheckCircle2}
            />
            <MetricCard
              title="Physical RMSE"
              value={`${trainResult.metrics.rmse_mmt}`}
              unit="MMT"
              subtitle="Root Mean Squared Error"
              badge="Physical Scale"
              badgeColor="blue"
              icon={BarChart2}
            />
            <MetricCard
              title="Physical MAE"
              value={`${trainResult.metrics.mae_mmt}`}
              unit="MMT"
              subtitle="Mean Absolute Error"
              badge="Real Scale"
              badgeColor="neutral"
              icon={BarChart2}
            />
            <MetricCard
              title="Normalized RMSE"
              value={`${trainResult.metrics.rmse_normalized}`}
              subtitle="Normalized [0, 1] Target"
              badge="Standard Scale"
              badgeColor="neutral"
              icon={Cpu}
            />
          </div>

          {/* Visualizations: Loss Curve & Residuals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <LossCurveChart
              lossHistory={trainResult.loss_history}
              title={`Training Loss Trajectory: ${trainResult.model_name}`}
            />
            <ResidualsChart
              histogramData={trainResult.residuals_histogram}
              title={`Residual Error Distribution (Actual - Pred MMT)`}
            />
          </div>

          {/* Feature Importances */}
          {trainResult.feature_importances && trainResult.feature_importances.length > 0 && (
            <div className="grid grid-cols-1 gap-5">
              <FeatureImportanceChart
                features={trainResult.feature_importances}
                title={`Top Predictive Drivers for ${trainResult.model_name}`}
              />
            </div>
          )}

          {/* Holdout point-by-point table */}
          {trainResult.point_records && trainResult.point_records.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3">
                First 10 Holdout Evaluation Points (Real Physical MMT)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-100 text-zinc-500 font-sans">
                      <th className="py-2 px-3 font-medium">Date</th>
                      <th className="py-2 px-3 font-medium">Actual (MMT)</th>
                      <th className="py-2 px-3 font-medium">Predicted (MMT)</th>
                      <th className="py-2 px-3 font-medium">Residual Error</th>
                      <th className="py-2 px-3 font-medium">Absolute % Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {trainResult.point_records.slice(0, 10).map((pt, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/70">
                        <td className="py-2 px-3 text-zinc-800 font-sans">{pt.date}</td>
                        <td className="py-2 px-3 text-zinc-900 font-bold">{pt.actual_mmt}</td>
                        <td className="py-2 px-3 text-blue-600">{pt.predicted_mmt}</td>
                        <td className={`py-2 px-3 ${pt.residual_mmt >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {pt.residual_mmt >= 0 ? `+${pt.residual_mmt}` : pt.residual_mmt}
                        </td>
                        <td className="py-2 px-3 text-zinc-500">{pt.pct_error}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Source Code Modal */}
      <CodeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        snippet={activeSnippet}
      />
    </div>
  );
}

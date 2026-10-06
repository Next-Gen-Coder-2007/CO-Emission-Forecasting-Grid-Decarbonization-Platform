import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import DashboardPage from './pages/DashboardPage';
import ModelTrainingPage from './pages/ModelTrainingPage';
import EvaluationPage from './pages/EvaluationPage';
import CsvTesterPage from './pages/CsvTesterPage';
import ScenarioSimulatorPage from './pages/ScenarioSimulatorPage';
import DatasetExplorerPage from './pages/DatasetExplorerPage';
import EdaPage from './pages/EdaPage';

import { apiUrl } from './api/client';

export default function App() {
  const [apiStatus, setApiStatus] = useState(false);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(apiUrl('/api/health'));
        if (res.ok) {
          setApiStatus(true);
        }

      } catch (err) {
        console.warn("Backend API connecting...", err);
        setApiStatus(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased">
        {/* Navigation Bar */}
        <Navbar apiStatus={apiStatus} />

        {/* Dynamic Route Pages */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/eda" element={<EdaPage />} />
            <Route path="/train" element={<ModelTrainingPage />} />
            <Route path="/evaluation" element={<EvaluationPage />} />
            <Route path="/tester" element={<CsvTesterPage />} />
            <Route path="/simulator" element={<ScenarioSimulatorPage />} />
            <Route path="/dataset" element={<DatasetExplorerPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

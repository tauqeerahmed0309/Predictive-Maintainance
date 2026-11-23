import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useTimestamp } from '../../context/TimestampContext';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { apiStatus, predictionError, checkHealth, refreshPredictions } = useTimestamp();

  return (
    <div className="flex h-screen bg-[#070a12] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar />

        {/* Global Offline/Degraded Banner if backend is disconnected */}
        {apiStatus === 'offline' && (
          <div className="bg-rose-500/10 border-b border-rose-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Backend Disconnected:</strong> Cannot reach the FastAPI server at 127.0.0.1:8000. Start backend with <code className="bg-rose-950/80 px-1.5 py-0.5 rounded text-rose-200">uvicorn app.main:app --port 8000</code>.
              </span>
            </div>
            <button
              onClick={() => {
                checkHealth();
                refreshPredictions();
              }}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-medium flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Global Model Error Banner */}
        {predictionError && apiStatus !== 'offline' && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Scoring Notice:</strong> {predictionError}
              </span>
            </div>
            <button
              onClick={refreshPredictions}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-medium flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Page Content Scroll Container */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0b1120]">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

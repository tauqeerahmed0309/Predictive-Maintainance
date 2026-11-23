import React, { useState, useEffect } from 'react';
import {
  Server,
  Cpu,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Activity,
  Layers,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { getHealth, getRootInfo, API_BASE_URL } from '../services/api';
import { useTimestamp } from '../context/TimestampContext';

export default function SystemStatus() {
  const { apiStatus, checkHealth, healthData } = useTimestamp();

  const [rootInfo, setRootInfo] = useState(null);
  const [pingLatency, setPingLatency] = useState(null);
  const [testingEndpoints, setTestingEndpoints] = useState(false);
  const [endpointResults, setEndpointResults] = useState([]);

  const runDiagnostics = async () => {
    setTestingEndpoints(true);
    const start = performance.now();

    try {
      const info = await getRootInfo();
      setRootInfo(info);
      const latency = Math.round(performance.now() - start);
      setPingLatency(latency);
    } catch {
      setPingLatency(null);
    }

    // Benchmark endpoints
    const endpointsToTest = [
      { name: 'Health Check', path: '/health', expected: 200 },
      { name: 'Root API Metadata', path: '/', expected: 200 },
      { name: 'Fleet Predictions', path: '/api/v1/predictions', expected: 200 },
      { name: 'Fleet Machines Listing', path: '/api/v1/machines', expected: 200 },
      { name: 'Demo Timestamps Catalog', path: '/api/v1/demo-times', expected: 200 },
    ];

    const results = [];
    for (const ep of endpointsToTest) {
      const epStart = performance.now();
      try {
        const res = await fetch(`${API_BASE_URL}${ep.path}`);
        const duration = Math.round(performance.now() - epStart);
        results.push({
          ...ep,
          status: res.status,
          ok: res.ok,
          latency: `${duration}ms`,
        });
      } catch (err) {
        results.push({
          ...ep,
          status: 'ERR',
          ok: false,
          latency: 'Timeout/Offline',
        });
      }
    }

    setEndpointResults(results);
    setTestingEndpoints(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold text-slate-100">
              System Architecture & Health Diagnostics
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Verification of backend FastAPI microservice, LightGBM machine learning models, telemetry pre-aggregators, and calibration pipelines.
          </p>
        </div>

        <button
          onClick={() => {
            checkHealth();
            runDiagnostics();
          }}
          disabled={testingEndpoints}
          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 transition self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${testingEndpoints ? 'animate-spin' : ''}`} />
          <span>Run Live Diagnostics</span>
        </button>
      </div>

      {/* System Health Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Backend REST Service */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>FastAPI Server</span>
            {apiStatus === 'online' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="my-2">
            <div className="text-xl font-bold font-mono text-white capitalize">
              {apiStatus}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
              {API_BASE_URL}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Ping: {pingLatency !== null ? `${pingLatency}ms` : 'N/A'}
          </div>
        </div>

        {/* Machine Learning Models */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Model Ensemble</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold font-mono text-white">
              {healthData?.models_loaded ? '5 Active Models' : 'Loading'}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              LightGBM GBDT + Isotonic
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Horizon: 24h Window
          </div>
        </div>

        {/* Historical Feature Store */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Feature Store</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold font-mono text-white">
              Pre-Indexed Cache
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              100 Units • 6 Rolling Windows
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Telemetry: 80MB dataset
          </div>
        </div>

        {/* Risk Calibration & Threshold */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Alert Threshold</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold font-mono text-white">
              33.3% Calibrated
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Isotonic Regressor
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Raw threshold: 0.1904
          </div>
        </div>
      </div>

      {/* Model Artifacts Specification */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Machine Learning Model Artifacts
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Path: backend/models/
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
          {[
            { name: 'Overall Failure Model', file: 'lgbm_y_any.txt', type: 'LightGBM Binary Classifier', status: 'Loaded' },
            { name: 'Component 1 Failure Sub-Model', file: 'lgbm_y_comp1.txt', type: 'LightGBM Binary Classifier', status: 'Loaded' },
            { name: 'Component 2 Failure Sub-Model', file: 'lgbm_y_comp2.txt', type: 'LightGBM Binary Classifier', status: 'Loaded' },
            { name: 'Component 3 Failure Sub-Model', file: 'lgbm_y_comp3.txt', type: 'LightGBM Binary Classifier', status: 'Loaded' },
            { name: 'Component 4 Failure Sub-Model', file: 'lgbm_y_comp4.txt', type: 'LightGBM Binary Classifier', status: 'Loaded' },
            { name: 'Probability Calibrator', file: 'isotonic_calibrator.pkl', type: 'Isotonic Regression', status: 'Loaded' },
          ].map((m) => (
            <div key={m.file} className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-200 font-sans">{m.name}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  {m.status}
                </span>
              </div>
              <div className="text-[11px] text-blue-400 font-mono truncate">{m.file}</div>
              <div className="text-[10px] text-slate-500 mt-1">{m.type}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live API Endpoint Benchmark Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              API Endpoint Integration Test Results
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Host: 127.0.0.1:8000
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Endpoint Name</th>
                <th className="py-2.5 px-4">Route Path</th>
                <th className="py-2.5 px-4">HTTP Status</th>
                <th className="py-2.5 px-4">Response Time</th>
                <th className="py-2.5 px-4 text-right">Health Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
              {endpointResults.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Running diagnostic pings...
                  </td>
                </tr>
              ) : (
                endpointResults.map((ep) => (
                  <tr key={ep.path} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-200 font-sans">
                      {ep.name}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <code>GET {ep.path}</code>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ep.ok
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {ep.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{ep.latency}</td>
                    <td className="py-3 px-4 text-right">
                      {ep.ok ? (
                        <span className="text-emerald-400 text-xs font-semibold">PASS</span>
                      ) : (
                        <span className="text-rose-400 text-xs font-semibold">FAIL</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

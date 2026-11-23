import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Cpu,
  AlertTriangle,
  Clock,
  Layers,
  TrendingUp,
  Info,
  Calendar,
  CheckCircle,
  XCircle,
  Activity,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { getMachinePrediction, getMachineTimeline } from '../services/api';
import { useTimestamp } from '../context/TimestampContext';
import {
  COMPONENT_LABELS,
  COMPONENT_COLORS,
  RISK_COLORS,
  formatRiskPercent,
  formatProbability,
  getHighestRiskComponent,
  getRiskBadgeClasses,
  formatTimestamp,
  formatShortTimestamp,
} from '../utils/riskUtils';

export default function MachineDetails() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const { selectedTime } = useTimestamp();

  const [machineData, setMachineData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [loadingMachine, setLoadingMachine] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [error, setError] = useState(null);
  const [timelineRange, setTimelineRange] = useState('all'); // 'all' | '14d' | '30d'

  const idNum = parseInt(machineId, 10);
  const isInvalidId = isNaN(idNum) || idNum < 1 || idNum > 100;

  // Fetch machine predictions for selected timestamp
  useEffect(() => {
    if (isInvalidId) {
      setError(`Machine ID #${machineId} is not registered in the 100-machine fleet registry.`);
      setLoadingMachine(false);
      return;
    }

    setLoadingMachine(true);
    setError(null);

    getMachinePrediction(idNum, selectedTime || undefined)
      .then((data) => {
        setMachineData(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || `Unable to retrieve telemetry score for Machine #${idNum}.`);
      })
      .finally(() => {
        setLoadingMachine(false);
      });
  }, [idNum, selectedTime, isInvalidId, machineId]);

  // Fetch historical timeline & failure records
  useEffect(() => {
    if (isInvalidId) return;

    setLoadingTimeline(true);
    getMachineTimeline(idNum)
      .then((data) => {
        setTimelineData(data);
      })
      .catch((err) => {
        console.warn('Timeline retrieval notice:', err);
      })
      .finally(() => {
        setLoadingTimeline(false);
      });
  }, [idNum, isInvalidId]);

  // Filtered timeline points based on time range
  const chartPoints = useMemo(() => {
    if (!timelineData?.points) return [];
    let pts = [...timelineData.points];

    if (timelineRange === '14d') {
      pts = pts.slice(-336); // 14 days * 24 hours
    } else if (timelineRange === '30d') {
      pts = pts.slice(-720); // 30 days * 24 hours
    }

    return pts.map((p) => ({
      ...p,
      risk_percent: Number(((p.risk || 0) * 100).toFixed(1)),
      raw_percent: Number(((p.raw_risk || 0) * 100).toFixed(1)),
      shortDate: formatShortTimestamp(p.datetime),
    }));
  }, [timelineData, timelineRange]);

  // Failures returned by the backend
  const actualFailures = timelineData?.failures || [];

  if (isInvalidId || (error && !machineData)) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-100">
          Machine Registry Diagnostic Error
        </h2>
        <p className="text-xs text-slate-400 font-mono">
          {error || `Invalid Machine ID: ${machineId}. Please specify an ID between 1 and 100.`}
        </p>
        <button
          onClick={() => navigate('/machines')}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
        >
          ← Return to Fleet Registry
        </button>
      </div>
    );
  }

  const highestComp = getHighestRiskComponent(machineData);
  const isHigh = machineData?.risk_level === 'High' || machineData?.alert === true;
  const badges = getRiskBadgeClasses(machineData?.risk_level, machineData?.alert);

  return (
    <div className="space-y-6">
      {/* Header with Back button and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-100">
                Machine Diagnostics #{idNum}
              </h1>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${badges.badge}`}>
                {machineData?.risk_level || 'Evaluating'}
              </span>
              {machineData?.alert && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  CRITICAL ALERT
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Hardware: <span className="text-slate-200">{machineData?.model || 'model3'}</span> • Age:{' '}
              <span className="text-slate-200">{machineData?.age || '—'} years</span> • Dataset Time:{' '}
              <span className="text-blue-400">{formatTimestamp(selectedTime)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/machines')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition"
          >
            Fleet List
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-medium transition"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Machine Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Calibrated Risk */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>24h Calibrated Risk</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="my-2">
            <div className={`text-3xl font-bold font-mono ${badges.text}`}>
              {formatRiskPercent(machineData?.risk_percent)}
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(machineData?.risk_percent || 0, 100)}%`,
                  backgroundColor:
                    isHigh ? '#ef4444' : machineData?.risk_level === 'Medium' ? '#f59e0b' : '#10b981',
                }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Raw Score: {machineData?.raw_risk ? machineData.raw_risk.toFixed(4) : '0.0000'}
          </div>
        </div>

        {/* Peak Component Risk */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Primary Vulnerability</span>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COMPONENT_COLORS[highestComp.key] }}
            />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold text-slate-100 font-sans">
              {highestComp.label}
            </div>
            <div className="text-sm font-bold font-mono text-rose-400 mt-0.5">
              {highestComp.percent} failure risk
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Highest sub-model risk estimate
          </div>
        </div>

        {/* Operational Alert State */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Alert Status</span>
            <AlertTriangle className={`w-4 h-4 ${machineData?.alert ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold font-mono">
              {machineData?.alert ? (
                <span className="text-rose-400">TRIGGERED</span>
              ) : (
                <span className="text-emerald-400">CLEAR</span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono">
              Threshold: ≥ 33.3% calibrated risk
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Status: {machineData?.alert ? 'Requires Inspection' : 'Nominal Operation'}
          </div>
        </div>

        {/* Prediction Scope Horizon */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Horizon Window</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold text-slate-100 font-mono">
              Next 24 Hours
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono">
              Valid until T + 24h
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Model: LightGBM GBDT Fleet Ensemble
          </div>
        </div>
      </div>

      {/* Component Risk Breakdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Component-Level Failure Probabilities (Machine #{idNum})
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Next 24h Window Breakdown
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: 'comp1', label: 'Component 1', prob: machineData?.p_comp1 },
            { key: 'comp2', label: 'Component 2', prob: machineData?.p_comp2 },
            { key: 'comp3', label: 'Component 3', prob: machineData?.p_comp3 },
            { key: 'comp4', label: 'Component 4', prob: machineData?.p_comp4 },
          ].map((c) => {
            const isPeak = c.key === highestComp.key;
            const probPercent = ((c.prob || 0) * 100).toFixed(2);
            const color = COMPONENT_COLORS[c.key];

            return (
              <div
                key={c.key}
                className={`bg-slate-950/70 border rounded-xl p-4 relative overflow-hidden ${
                  isPeak
                    ? 'border-blue-500/50 bg-blue-950/10 ring-1 ring-blue-500/30'
                    : 'border-slate-800'
                }`}
              >
                {isPeak && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    HIGHEST
                  </span>
                )}

                <div className="flex items-center space-x-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-semibold text-slate-200 font-sans">
                    {c.label}
                  </span>
                </div>

                <div className="my-2">
                  <div className="text-2xl font-bold font-mono text-white">
                    {probPercent}%
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((c.prob || 0) * 100, 100)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono mt-2">
                  Raw probability: {c.prob ? c.prob.toFixed(5) : '0.00000'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Risk Timeline Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-200">
                Historical Failure Risk Timeline & Event Progression
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Historical progression from telemetry feature store ({chartPoints.length} points logged)
            </p>
          </div>

          {/* Time range selector */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs font-mono">
            <button
              onClick={() => setTimelineRange('14d')}
              className={`px-2.5 py-1 rounded transition ${
                timelineRange === '14d'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setTimelineRange('30d')}
              className={`px-2.5 py-1 rounded transition ${
                timelineRange === '30d'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimelineRange('all')}
              className={`px-2.5 py-1 rounded transition ${
                timelineRange === 'all'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full History
            </button>
          </div>
        </div>

        {/* Timeline Chart Container */}
        <div className="h-64 sm:h-72 relative">
          {loadingTimeline && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60 backdrop-blur-[1px]">
              <span className="text-xs text-slate-400 font-mono animate-pulse">Loading telemetry history...</span>
            </div>
          )}

          {chartPoints.length === 0 && !loadingTimeline ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
              No historical points found in risk history dataset.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="shortDate"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-3 shadow-xl text-xs font-mono">
                          <div className="text-slate-400 mb-1">{formatTimestamp(d.datetime)}</div>
                          <div className="text-white font-bold">
                            Calibrated Risk: <span className="text-blue-400">{d.risk_percent}%</span>
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            Raw GBDT Score: {d.raw_percent}%
                          </div>
                          <div className="mt-1">
                            {d.alert ? (
                              <span className="text-[10px] text-rose-400 font-bold">
                                ● ALERT THRESHOLD EXCEEDED
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-400">
                                ● Normal Risk Range
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={33.33}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Alert Threshold (33.3%)',
                    fill: '#ef4444',
                    fontSize: 9,
                    position: 'insideTopRight',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="risk_percent"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#riskGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Failure Event Markers (Only when backend provides them!) */}
        {actualFailures.length > 0 && (
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
            <div className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Verified Historical Failure Records (from failures.csv dataset):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {actualFailures.map((f, i) => (
                <div
                  key={i}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-xs font-mono text-rose-300 flex items-center space-x-2"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>
                    Failed: <strong>{f.component}</strong> on {formatTimestamp(f.datetime)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Risk Interpretation & Objective Disclaimer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/80">
          <Info className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Model Output Interpretation & Scientific Context
          </h2>
        </div>

        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            The predictions shown above are generated by gradient-boosted decision trees (LightGBM) trained on rolling 3h, 6h, 12h, 24h, 48h, and 168h statistics of sensor telemetry (voltage, rotation, pressure, vibration), error code frequencies, and maintenance logs.
          </p>
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400 font-mono text-[11px]">
            <strong className="text-slate-200 block mb-1">
              Methodological Interpretation Note:
            </strong>
            Component probabilities ({formatProbability(machineData?.p_comp1)} for comp1, {formatProbability(machineData?.p_comp2)} for comp2, {formatProbability(machineData?.p_comp3)} for comp3, {formatProbability(machineData?.p_comp4)} for comp4) represent model-estimated likelihoods of failure occurrence within the next 24-hour horizon. They reflect statistical correlation with historical pre-failure patterns and are not proof of direct physical causation.
          </div>
        </div>
      </div>
    </div>
  );
}

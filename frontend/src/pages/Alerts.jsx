import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Wrench,
} from 'lucide-react';
import { useTimestamp } from '../context/TimestampContext';
import {
  getHighestRiskComponent,
  formatRiskPercent,
  formatProbability,
  formatTimestamp,
  COMPONENT_LABELS,
  COMPONENT_COLORS,
  getRiskBadgeClasses,
} from '../utils/riskUtils';

export default function Alerts() {
  const navigate = useNavigate();
  const { predictionsData, selectedTime, activeAlerts, loadingPredictions } = useTimestamp();

  const [search, setSearch] = useState('');
  const [componentFilter, setComponentFilter] = useState('All');

  const threshold = predictionsData?.threshold ? (predictionsData.threshold * 100).toFixed(1) : '33.3';

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    let list = [...activeAlerts];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.machineID.toString().includes(q) ||
          m.model?.toLowerCase().includes(q)
      );
    }

    if (componentFilter !== 'All') {
      list = list.filter((m) => {
        const highest = getHighestRiskComponent(m);
        return highest.key === componentFilter;
      });
    }

    return list;
  }, [activeAlerts, search, componentFilter]);

  // Action protocol advisory based on component
  const getProtocol = (compKey) => {
    switch (compKey) {
      case 'comp1':
        return 'Verify electrical voltage stability, inspect power wiring and contactors within 12h.';
      case 'comp2':
        return 'Perform rotational bearing vibration assessment, lubricate shaft bearings.';
      case 'comp3':
        return 'Inspect hydraulic pressure seals and regulator valves for pressure drift.';
      case 'comp4':
        return 'Check mechanical mount dampeners and structural bolt torque integrity.';
      default:
        return 'Conduct immediate multi-point sensory inspection.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h1 className="text-lg font-bold text-slate-100">
              Active Fleet Risk Alerts (Threshold ≥ {threshold}%)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Machines with model-predicted failure probabilities exceeding calibrated operational tolerance within the next 24 hours.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Dataset Time: {formatTimestamp(selectedTime)}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alert by Machine ID or Model..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-mono text-[11px]">Component:</span>
            <select
              value={componentFilter}
              onChange={(e) => setComponentFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="All">All Components</option>
              <option value="comp1">Component 1</option>
              <option value="comp2">Component 2</option>
              <option value="comp3">Component 3</option>
              <option value="comp4">Component 4</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-slate-400">Total Flagged:</span>
          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
            {activeAlerts.length} Units
          </span>
        </div>
      </div>

      {/* Alerts Listing */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-100">
              No Operational Alerts Detected
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto font-mono">
              All machines in the monitored fleet are operating safely below the {threshold}% failure probability threshold for this timestamp.
            </p>
          </div>
        ) : (
          filteredAlerts.map((machine) => {
            const highestComp = getHighestRiskComponent(machine);
            const badges = getRiskBadgeClasses(machine.risk_level, machine.alert);

            return (
              <div
                key={machine.machineID}
                className="bg-slate-900/90 border border-rose-500/40 rounded-xl p-5 hover:border-rose-500/70 transition shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono font-bold text-sm flex items-center justify-center">
                      #{machine.machineID}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-100">
                          Machine {machine.machineID}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ({machine.model} • {machine.age} yrs old)
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                          CRITICAL ALERT
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        Timestamp: {formatTimestamp(selectedTime)} • Horizon: Next 24 Hours
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right font-mono">
                      <div className="text-xs text-slate-400">24h Failure Risk</div>
                      <div className="text-xl font-bold text-rose-400">
                        {formatRiskPercent(machine.risk_percent)}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/machines/${machine.machineID}`)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                    >
                      <span>Diagnose</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 4 Component Probabilities breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  {[
                    { key: 'comp1', label: 'Component 1', prob: machine.p_comp1 },
                    { key: 'comp2', label: 'Component 2', prob: machine.p_comp2 },
                    { key: 'comp3', label: 'Component 3', prob: machine.p_comp3 },
                    { key: 'comp4', label: 'Component 4', prob: machine.p_comp4 },
                  ].map((c) => {
                    const isPeak = c.key === highestComp.key;
                    return (
                      <div
                        key={c.key}
                        className={`p-2 rounded-lg border ${
                          isPeak
                            ? 'bg-rose-950/30 border-rose-500/50 text-rose-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span>{c.label}</span>
                          {isPeak && <span className="text-[9px] font-bold uppercase text-rose-400">Peak</span>}
                        </div>
                        <div className="text-sm font-bold mt-0.5 text-white">
                          {formatProbability(c.prob)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Maintenance Recommendation Protocol */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-start space-x-2.5 text-xs">
                  <Wrench className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">
                      Operator Advisory ({highestComp.label}):
                    </span>{' '}
                    <span className="text-slate-400 font-mono">
                      {getProtocol(highestComp.key)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

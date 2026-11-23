import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { useTimestamp } from '../../context/TimestampContext';
import {
  getHighestRiskComponent,
  formatRiskPercent,
  formatTimestamp,
  COMPONENT_COLORS,
} from '../../utils/riskUtils';

export default function AlertsPanel() {
  const navigate = useNavigate();
  const { activeAlerts, selectedTime, predictionsData } = useTimestamp();

  const threshold = predictionsData?.threshold ? (predictionsData.threshold * 100).toFixed(1) : '33.3';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Active Failure Risk Alerts (≥{threshold}%)
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
          {activeAlerts.length} Units Flagged
        </span>
      </div>

      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {activeAlerts.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <CheckCircle className="w-10 h-10 text-emerald-400 mb-2 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-200">
              Fleet Operational Stability Normal
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1 font-mono">
              All 100 machines currently operate below the {threshold}% failure probability threshold for the next 24 hours.
            </p>
          </div>
        ) : (
          activeAlerts.map((machine) => {
            const highestComp = getHighestRiskComponent(machine);

            return (
              <div
                key={machine.machineID}
                onClick={() => navigate(`/machines/${machine.machineID}`)}
                className="p-3 rounded-lg bg-slate-950/70 border border-rose-500/30 hover:border-rose-500/60 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                    <span className="font-mono font-bold text-xs text-rose-300">
                      M{machine.machineID}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition">
                        Machine #{machine.machineID}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                        RISK: {formatRiskPercent(machine.risk_percent)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: COMPONENT_COLORS[highestComp.key] }}
                        />
                        <span>{highestComp.label}</span>
                        <span className="font-mono text-slate-500">({highestComp.percent})</span>
                      </span>
                      <span>•</span>
                      <span className="text-slate-500 text-[10px]">Model: {machine.model}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-slate-500 font-mono flex items-center justify-end space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Next 24h Window</span>
                    </div>
                    <div className="text-[11px] font-medium text-rose-400">
                      High Alert
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono mt-3">
        <span>Evaluated at: {formatTimestamp(selectedTime)}</span>
        <button
          onClick={() => navigate('/alerts')}
          className="text-blue-400 hover:text-blue-300 font-medium hover:underline flex items-center space-x-1"
        >
          <span>All Alerts View</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}

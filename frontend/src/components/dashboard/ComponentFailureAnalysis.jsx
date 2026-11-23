import React from 'react';
import { Layers, AlertCircle, TrendingUp } from 'lucide-react';
import { useTimestamp } from '../../context/TimestampContext';
import {
  COMPONENT_LABELS,
  COMPONENT_COLORS,
  formatProbability,
} from '../../utils/riskUtils';
import { useNavigate } from 'react-router-dom';

export default function ComponentFailureAnalysis() {
  const navigate = useNavigate();
  const { predictionsData } = useTimestamp();
  const predictions = predictionsData?.predictions || [];

  const comps = ['comp1', 'comp2', 'comp3', 'comp4'];

  const stats = comps.map((compKey) => {
    const key = `p_${compKey}`;
    let maxProb = 0;
    let maxMachine = null;
    let sumProb = 0;
    let elevatedCount = 0;

    for (const m of predictions) {
      const prob = m[key] || 0;
      sumProb += prob;
      if (prob > maxProb) {
        maxProb = prob;
        maxMachine = m;
      }
      if (prob >= 0.1) {
        elevatedCount++;
      }
    }

    const avgProb = predictions.length ? sumProb / predictions.length : 0;

    return {
      key: compKey,
      label: COMPONENT_LABELS[compKey],
      color: COMPONENT_COLORS[compKey],
      avgProb,
      maxProb,
      maxMachine,
      elevatedCount,
    };
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Component Failure Probability Analysis (Next 24h)
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          LightGBM Component Sub-Models
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const maxPercent = (s.maxProb * 100).toFixed(1);
          const avgPercent = (s.avgProb * 100).toFixed(2);
          const isHighAlert = s.maxProb >= 0.33;

          return (
            <div
              key={s.key}
              className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      {s.label}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isHighAlert
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.elevatedCount} elevated
                  </span>
                </div>

                {/* Maximum Risk in Fleet */}
                <div className="mt-3">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Fleet Peak Risk:</span>
                    <span className="font-bold font-mono text-white text-sm">
                      {maxPercent}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(s.maxProb * 100, 100)}%`,
                        backgroundColor: s.color,
                      }}
                    />
                  </div>
                </div>

                {/* Fleet Mean */}
                <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Fleet Mean:</span>
                  <span className="text-slate-300">{avgPercent}%</span>
                </div>
              </div>

              {/* Machine with Highest Vulnerability */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {s.maxMachine ? (
                  <>
                    <div className="text-slate-400">
                      Peak: <span className="text-white font-mono font-medium">M#{s.maxMachine.machineID}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/machines/${s.maxMachine.machineID}`)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-medium hover:underline"
                    >
                      Diagnose →
                    </button>
                  </>
                ) : (
                  <span className="text-slate-500 text-[11px]">No data</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

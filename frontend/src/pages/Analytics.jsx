import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  Layers,
  Activity,
  Cpu,
  TrendingUp,
} from 'lucide-react';
import { useTimestamp } from '../context/TimestampContext';
import {
  COMPONENT_LABELS,
  COMPONENT_COLORS,
  RISK_COLORS,
  formatRiskPercent,
  formatProbability,
  formatTimestamp,
} from '../utils/riskUtils';

export default function Analytics() {
  const { predictionsData, selectedTime, loadingPredictions } = useTimestamp();
  const [topCount, setTopCount] = useState(20);

  const predictions = predictionsData?.predictions || [];
  const totalMachines = predictions.length || 1;

  // 1. Overall Risk Distribution
  const riskDistribution = useMemo(() => {
    const low = predictions.filter((m) => m.risk_level === 'Low' && !m.alert).length;
    const med = predictions.filter((m) => m.risk_level === 'Medium' && !m.alert).length;
    const high = predictions.filter((m) => m.risk_level === 'High' || m.alert === true).length;

    return [
      { name: 'Low Risk (<2%)', value: low, color: RISK_COLORS.Low, count: low },
      { name: 'Medium Risk (2%-33%)', value: med, color: RISK_COLORS.Medium, count: med },
      { name: 'High Risk (≥33%)', value: high, color: RISK_COLORS.High, count: high },
    ];
  }, [predictions]);

  // 2. Machine-wise Risk Ranking (Top N)
  const machineRiskRanking = useMemo(() => {
    const sorted = [...predictions].sort((a, b) => b.risk_percent - a.risk_percent);
    return sorted.slice(0, topCount).map((m) => ({
      name: `M#${m.machineID}`,
      id: m.machineID,
      risk: m.risk_percent,
      model: m.model,
      risk_level: m.risk_level,
    }));
  }, [predictions, topCount]);

  // 3. Component Fleet-Wide Vulnerability Comparison
  const componentFleetComparison = useMemo(() => {
    const comps = ['comp1', 'comp2', 'comp3', 'comp4'];
    return comps.map((c) => {
      let sumProb = 0;
      let countElevated = 0;
      let maxProb = 0;

      predictions.forEach((m) => {
        const p = m[`p_${c}`] || 0;
        sumProb += p;
        if (p > maxProb) maxProb = p;
        if (p >= 0.1) countElevated++;
      });

      const avgProb = predictions.length ? (sumProb / predictions.length) * 100 : 0;

      return {
        component: COMPONENT_LABELS[c],
        key: c,
        avgRiskPercent: Number(avgProb.toFixed(2)),
        maxRiskPercent: Number((maxProb * 100).toFixed(1)),
        elevatedCount: countElevated,
        color: COMPONENT_COLORS[c],
      };
    });
  }, [predictions]);

  // 4. Model-wise Risk Profile (model1, model2, model3, model4)
  const modelRiskProfile = useMemo(() => {
    const map = {};
    predictions.forEach((m) => {
      const model = m.model || 'Unknown';
      if (!map[model]) {
        map[model] = { count: 0, sumRisk: 0, highCount: 0 };
      }
      map[model].count++;
      map[model].sumRisk += m.risk_percent || 0;
      if (m.risk_level === 'High' || m.alert) {
        map[model].highCount++;
      }
    });

    return Object.keys(map).sort().map((model) => ({
      model,
      count: map[model].count,
      avgRisk: Number((map[model].sumRisk / map[model].count).toFixed(2)),
      highCount: map[model].highCount,
    }));
  }, [predictions]);

  return (
    <div className="space-y-6">
      {/* Page Title Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold text-slate-100">
              Fleet Predictive Analytics & Risk Distributions
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical statistical evaluation across 100 industrial units derived from actual LightGBM scoring at {formatTimestamp(selectedTime)}.
          </p>
        </div>
      </div>

      {/* Top 2 Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Donut */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center space-x-2">
              <PieIcon className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-200">
                Fleet Risk Stratification
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {totalMachines} Total Machines
            </span>
          </div>

          <div className="h-60 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="#0b1120"
                  strokeWidth={2}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono">
                          <div className="text-slate-200 font-bold">{d.name}</div>
                          <div className="text-slate-300 mt-1">Count: {d.value} units</div>
                          <div className="text-slate-400">Share: {((d.value / totalMachines) * 100).toFixed(1)}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-white">{totalMachines}</span>
              <span className="text-[10px] uppercase text-slate-400">Fleet Units</span>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs font-mono">
            {riskDistribution.map((r) => (
              <div key={r.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="text-slate-300">{r.name}</span>
                </div>
                <span className="font-bold text-slate-100">{r.count} units</span>
              </div>
            ))}
          </div>
        </div>

        {/* Machine-wise Risk Ranking Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-200">
                Machine-Wise Risk Comparison (Ranked Descending)
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-xs font-mono">Units:</span>
              <select
                value={topCount}
                onChange={(e) => setTopCount(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs font-mono focus:outline-none cursor-pointer"
              >
                <option value={15}>Top 15</option>
                <option value={20}>Top 20</option>
                <option value={30}>Top 30</option>
              </select>
            </div>
          </div>

          <div className="h-60 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineRiskRanking} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
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
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono">
                          <div className="text-white font-bold">{d.name} ({d.model})</div>
                          <div className="text-blue-400 mt-1">24h Risk: {d.risk}%</div>
                          <div className="text-slate-400 text-[10px]">Category: {d.risk_level}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="risk" radius={[4, 4, 0, 0]}>
                  {machineRiskRanking.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={
                        entry.risk_level === 'High'
                          ? RISK_COLORS.High
                          : entry.risk_level === 'Medium'
                          ? RISK_COLORS.Medium
                          : RISK_COLORS.Low
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Machine identifier axis (M#1 – M#100)</span>
            <span>Threshold line: 33.3% alert cut-off</span>
          </div>
        </div>
      </div>

      {/* Component Vulnerability & Model Correlation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Component-level Risk Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-200">
                Component Vulnerability Distribution Across Fleet
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Mean vs Peak</span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={componentFleetComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="component" stroke="#64748b" fontSize={11} tickLine={false} />
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
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono">
                          <div className="text-white font-bold">{d.component}</div>
                          <div className="text-blue-400 mt-1">Fleet Mean Risk: {d.avgRiskPercent}%</div>
                          <div className="text-rose-400">Fleet Max Single-Machine Risk: {d.maxRiskPercent}%</div>
                          <div className="text-slate-400 text-[10px]">Elevated Units: {d.elevatedCount}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="maxRiskPercent" name="Peak Single Unit Risk" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgRiskPercent" name="Fleet Mean Risk" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono text-xs">
            {componentFleetComparison.map((c) => (
              <div key={c.key} className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 truncate">{c.component}</div>
                <div className="text-sm font-bold text-white mt-0.5">{c.avgRiskPercent}%</div>
                <div className="text-[10px] text-slate-500">mean</div>
              </div>
            ))}
          </div>
        </div>

        {/* Machine Hardware Model Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-200">
                Hardware Model Risk Profile (Empirical)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">4 Hardware Series</span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelRiskProfile} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="model" stroke="#64748b" fontSize={11} tickLine={false} />
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
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono">
                          <div className="text-white font-bold uppercase">{d.model}</div>
                          <div className="text-blue-400 mt-1">Mean 24h Risk: {d.avgRisk}%</div>
                          <div className="text-slate-300">Fleet Units: {d.count}</div>
                          <div className="text-rose-400 text-[10px]">High-Risk Units: {d.highCount}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="avgRisk" name="Average Risk %" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono text-xs">
            {modelRiskProfile.map((m) => (
              <div key={m.model} className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">{m.model}</div>
                <div className="text-sm font-bold text-white mt-0.5">{m.count} units</div>
                <div className="text-[10px] text-slate-500">{m.avgRisk}% avg</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

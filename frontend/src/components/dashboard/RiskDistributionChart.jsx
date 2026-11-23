import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTimestamp } from '../../context/TimestampContext';
import { RISK_COLORS } from '../../utils/riskUtils';
import { PieChart as PieIcon } from 'lucide-react';

export default function RiskDistributionChart() {
  const { predictionsData, loadingPredictions } = useTimestamp();

  const predictions = predictionsData?.predictions || [];
  const total = predictions.length || 1;

  const lowCount = predictions.filter((m) => m.risk_level === 'Low' && !m.alert).length;
  const mediumCount = predictions.filter((m) => m.risk_level === 'Medium' && !m.alert).length;
  const highCount = predictions.filter((m) => m.risk_level === 'High' || m.alert === true).length;

  const data = [
    { name: 'Low Risk', value: lowCount, color: RISK_COLORS.Low, level: 'Low' },
    { name: 'Medium Risk', value: mediumCount, color: RISK_COLORS.Medium, level: 'Medium' },
    { name: 'High Risk', value: highCount, color: RISK_COLORS.High, level: 'High' },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-3 shadow-xl text-xs">
          <div className="flex items-center space-x-2 font-semibold text-slate-200">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.name}</span>
          </div>
          <div className="mt-1 text-slate-400 font-mono">
            Count: <span className="text-white font-bold">{item.value}</span> machines
          </div>
          <div className="text-slate-400 font-mono">
            Share: <span className="text-white font-bold">{percentage}%</span> of fleet
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <PieIcon className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Fleet Risk Distribution
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
          {total} Total Units
        </span>
      </div>

      <div className="h-56 relative my-2">
        {loadingPredictions && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60 backdrop-blur-[1px]">
            <span className="text-xs text-slate-400 font-mono animate-pulse">Calculating fleet risks...</span>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              stroke="#0b1120"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label inside donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold font-mono text-slate-100">{total}</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">Units</span>
        </div>
      </div>

      {/* Legend & Breakdown stats */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">
        {data.map((d) => (
          <div key={d.name} className="px-2 py-1 rounded bg-slate-950/50 border border-slate-800">
            <div className="flex items-center justify-center space-x-1.5 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-[11px] font-medium text-slate-300">{d.level}</span>
            </div>
            <div className="text-sm font-bold font-mono text-white">
              {d.value}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {((d.value / total) * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

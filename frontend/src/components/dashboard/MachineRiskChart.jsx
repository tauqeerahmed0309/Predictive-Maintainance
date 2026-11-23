import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useTimestamp } from '../../context/TimestampContext';
import { RISK_COLORS } from '../../utils/riskUtils';
import { BarChart3 } from 'lucide-react';

export default function MachineRiskChart() {
  const navigate = useNavigate();
  const { predictionsData, loadingPredictions } = useTimestamp();
  const [viewCount, setViewCount] = useState(15);

  const predictions = predictionsData?.predictions || [];
  const threshold = (predictionsData?.threshold || 0.3333) * 100;

  // Sort machines by risk descending
  const sorted = [...predictions].sort((a, b) => b.risk_percent - a.risk_percent);
  const chartData = sorted.slice(0, viewCount).map((m) => ({
    machineID: `M${m.machineID}`,
    rawId: m.machineID,
    risk_percent: m.risk_percent,
    risk_level: m.risk_level,
    alert: m.alert,
    model: m.model,
    age: m.age,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-3 shadow-xl text-xs font-mono">
          <div className="text-sm font-bold text-slate-100 flex items-center justify-between mb-1">
            <span>Machine #{data.rawId}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded uppercase"
              style={{
                backgroundColor:
                  data.risk_level === 'High'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : data.risk_level === 'Medium'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(16, 185, 129, 0.2)',
                color: RISK_COLORS[data.risk_level],
              }}
            >
              {data.risk_level}
            </span>
          </div>
          <div className="text-slate-300">
            Predicted Risk: <span className="font-bold text-white">{data.risk_percent}%</span>
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            Model: {data.model} • Age: {data.age} yrs
          </div>
          <div className="text-[10px] text-blue-400 mt-2">
            Click bar to view telemetry details →
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
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Top Elevated Risk Machines (24h Window)
          </h2>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">Show:</span>
          <select
            value={viewCount}
            onChange={(e) => setViewCount(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs font-mono focus:outline-none cursor-pointer"
          >
            <option value={10}>Top 10</option>
            <option value={15}>Top 15</option>
            <option value={25}>Top 25</option>
          </select>
        </div>
      </div>

      <div className="h-56 relative my-2">
        {loadingPredictions && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60 backdrop-blur-[1px]">
            <span className="text-xs text-slate-400 font-mono animate-pulse">Sorting risk rankings...</span>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload[0]) {
                navigate(`/machines/${state.activePayload[0].payload.rawId}`);
              }
            }}
          >
            <XAxis
              dataKey="machineID"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              interval={0}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={threshold}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{
                value: `Alert Threshold (${threshold.toFixed(0)}%)`,
                fill: '#ef4444',
                fontSize: 9,
                position: 'insideTopRight',
              }}
            />
            <Bar dataKey="risk_percent" radius={[4, 4, 0, 0]} cursor="pointer">
              {chartData.map((entry, index) => {
                const color =
                  entry.risk_level === 'High'
                    ? RISK_COLORS.High
                    : entry.risk_level === 'Medium'
                    ? RISK_COLORS.Medium
                    : RISK_COLORS.Low;
                return <Cell key={`bar-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
        <span>Click any bar to open machine diagnosis</span>
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-400">High Risk</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-400">Medium</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Low</span>
          </span>
        </div>
      </div>
    </div>
  );
}

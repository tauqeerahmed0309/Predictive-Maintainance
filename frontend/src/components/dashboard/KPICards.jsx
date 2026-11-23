import React from 'react';
import {
  Server,
  AlertTriangle,
  Activity,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { useTimestamp } from '../../context/TimestampContext';

export default function KPICards() {
  const { predictionsData, loadingPredictions, apiStatus } = useTimestamp();

  const predictions = predictionsData?.predictions || [];
  const totalMachines = predictions.length;
  const highRisk = predictions.filter((m) => m.risk_level === 'High' || m.alert === true).length;
  const mediumRisk = predictions.filter((m) => m.risk_level === 'Medium' && !m.alert).length;
  const activeAlerts = predictionsData?.alerts ?? highRisk;
  const threshold = predictionsData?.threshold ? (predictionsData.threshold * 100).toFixed(1) : '33.3';

  const cards = [
    {
      title: 'Total Fleet Machines',
      value: totalMachines || 100,
      subtext: 'Monitored Assets',
      icon: Cpu,
      color: 'blue',
      badge: '100% Active',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    },
    {
      title: 'High-Risk Machines',
      value: highRisk,
      subtext: `${totalMachines ? ((highRisk / totalMachines) * 100).toFixed(1) : 0}% of fleet`,
      icon: AlertTriangle,
      color: 'rose',
      badge: highRisk > 0 ? 'Urgent Action' : 'Optimal',
      badgeColor: highRisk > 0
        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    {
      title: 'Medium-Risk Machines',
      value: mediumRisk,
      subtext: `${totalMachines ? ((mediumRisk / totalMachines) * 100).toFixed(1) : 0}% of fleet`,
      icon: Activity,
      color: 'amber',
      badge: 'Scheduled Review',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    {
      title: 'Active Alerts',
      value: activeAlerts,
      subtext: `Threshold ≥ ${threshold}%`,
      icon: AlertTriangle,
      color: activeAlerts > 0 ? 'rose' : 'emerald',
      badge: activeAlerts > 0 ? 'Triggered' : 'Clear',
      badgeColor: activeAlerts > 0
        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    {
      title: 'Backend Status',
      value: apiStatus === 'online' ? 'Online' : apiStatus === 'degraded' ? 'Degraded' : 'Offline',
      subtext: '24h Horizon • LightGBM',
      icon: Server,
      color: apiStatus === 'online' ? 'emerald' : 'rose',
      badge: 'Calibrated',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      isStatus: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700/80 transition flex flex-col justify-between relative overflow-hidden"
          >
            {/* Loading pulse overlay */}
            {loadingPredictions && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] animate-pulse pointer-events-none" />
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                {c.title}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-300">
                <Icon className="w-4 h-4 text-slate-300" />
              </div>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <span className={`text-2xl font-bold font-mono tracking-tight ${
                c.color === 'rose'
                  ? 'text-rose-400'
                  : c.color === 'amber'
                  ? 'text-amber-400'
                  : c.color === 'emerald'
                  ? 'text-emerald-400'
                  : 'text-slate-100'
              }`}>
                {c.value}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.badgeColor}`}>
                {c.badge}
              </span>
            </div>

            <div className="text-xs text-slate-500 font-mono truncate">
              {c.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}

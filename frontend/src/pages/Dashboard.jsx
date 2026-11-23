import React from 'react';
import KPICards from '../components/dashboard/KPICards';
import RiskDistributionChart from '../components/dashboard/RiskDistributionChart';
import MachineRiskChart from '../components/dashboard/MachineRiskChart';
import ComponentFailureAnalysis from '../components/dashboard/ComponentFailureAnalysis';
import MachineTable from '../components/dashboard/MachineTable';
import AlertsPanel from '../components/dashboard/AlertsPanel';
import { useTimestamp } from '../context/TimestampContext';
import { formatTimestamp } from '../utils/riskUtils';
import { ShieldAlert, Clock, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { selectedTime, loadingPredictions, predictionsData } = useTimestamp();

  return (
    <div className="space-y-6">
      {/* Dashboard Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold text-slate-100">
              Fleet Operational Reliability Overview
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Continuous calibrated predictive failure probability scoring across 100 industrial machines.
            Evaluated for potential mechanical breakdown within the next 24-hour horizon.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Dataset Time: {formatTimestamp(selectedTime)}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RiskDistributionChart />
        </div>
        <div className="lg:col-span-2">
          <MachineRiskChart />
        </div>
      </div>

      {/* Component Failure Analysis */}
      <ComponentFailureAnalysis />

      {/* Active Alerts Panel & Quick High-Priority Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <AlertsPanel />
        </div>
      </div>

      {/* Full 100-Machine Table */}
      <MachineTable />
    </div>
  );
}

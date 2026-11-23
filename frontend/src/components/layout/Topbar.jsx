import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Clock,
  Server,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
} from 'lucide-react';
import { useTimestamp } from '../../context/TimestampContext';
import { formatTimestamp } from '../../utils/riskUtils';

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    apiStatus,
    demoTimes,
    selectedTime,
    setSelectedTime,
    loadingPredictions,
    activeAlerts,
    refreshPredictions,
  } = useTimestamp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Derive current page title from pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Fleet Operations Dashboard';
    if (path.startsWith('/machines/')) return 'Machine Diagnostics';
    if (path === '/machines') return 'Fleet Machine Registry';
    if (path === '/alerts') return 'Active Risk Alerts';
    if (path === '/analytics') return 'Predictive Fleet Analytics';
    if (path === '/simulation') return 'Simulated Live Telemetry';
    if (path === '/system-status') return 'System Health & Pipeline';
    return 'Predictive Maintenance';
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const cleanId = searchQuery.trim().replace(/^m(achine)?[-_\s]?/i, '');
    const num = parseInt(cleanId, 10);
    if (!isNaN(num) && num >= 1 && num <= 100) {
      navigate(`/machines/${num}`);
      setSearchQuery('');
    } else {
      // Navigate to machine monitoring list with query
      navigate(`/machines?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center space-x-3">
        <h1 className="text-base font-semibold text-slate-100 tracking-tight">
          {getPageTitle()}
        </h1>
        <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700/60">
          Horizon: 24h
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Timestamp Selector */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 space-x-2">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="text-xs">
            <span className="text-slate-400 mr-1.5 hidden md:inline">Dataset As Of:</span>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-mono font-medium focus:outline-none cursor-pointer pr-1"
              title="Select Historical Telemetry Timestamp"
            >
              {demoTimes.map((t) => (
                <option key={t} value={t} className="bg-slate-900 text-slate-200">
                  {formatTimestamp(t)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={refreshPredictions}
            disabled={loadingPredictions}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition disabled:opacity-50"
            title="Refresh prediction data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPredictions ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>

        {/* Machine Quick Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden lg:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Machine (1-100)..."
            className="w-48 xl:w-56 bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 transition"
          />
        </form>

        {/* Backend Connection Status */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${
            apiStatus === 'online'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : apiStatus === 'degraded'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
          title={`Backend status: ${apiStatus}`}
        >
          {apiStatus === 'online' ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : apiStatus === 'degraded' ? (
            <AlertCircle className="w-3.5 h-3.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          <span className="capitalize">{apiStatus}</span>
        </div>

        {/* Notifications / Active Alerts Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition"
            title="Active Failure Risk Alerts"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* Active Alerts Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-xs uppercase tracking-wider text-slate-300">
                    High Risk Machine Alerts
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500/20 text-rose-400 font-mono">
                    {activeAlerts.length} Active
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="py-2 max-h-72 overflow-y-auto space-y-2">
                {activeAlerts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No active failure alerts for selected timestamp.
                  </p>
                ) : (
                  activeAlerts.slice(0, 5).map((machine) => (
                    <div
                      key={machine.machineID}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(`/machines/${machine.machineID}`);
                      }}
                      className="p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-rose-500/20 cursor-pointer transition flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          Machine #{machine.machineID}
                        </div>
                        <div className="text-[11px] text-rose-400 font-mono">
                          Risk: {machine.risk_percent}% • High Probability
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        Investigate →
                      </span>
                    </div>
                  ))
                )}
              </div>

              {activeAlerts.length > 5 && (
                <div className="pt-2 border-t border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/alerts');
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    View all {activeAlerts.length} alerts →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User / Operator Console Placeholder (no fake identity) */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="hidden xl:block text-left">
            <span className="text-xs font-medium text-slate-200 block leading-tight">
              Operator Console
            </span>
            <span className="text-[10px] font-mono text-slate-500 block leading-tight">
              Reliability Station
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

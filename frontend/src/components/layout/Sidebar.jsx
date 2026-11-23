import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  AlertTriangle,
  BarChart3,
  Radio,
  Server,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useTimestamp } from '../../context/TimestampContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Machine Monitoring', path: '/machines', icon: Cpu },
  { name: 'Alerts', path: '/alerts', icon: AlertTriangle, hasBadge: true },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Live Simulation', path: '/simulation', icon: Radio },
  { name: 'System Status', path: '/system-status', icon: Server },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { activeAlerts } = useTimestamp();

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800/80 flex flex-col transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800/80 justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-blue-400" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="text-sm font-semibold tracking-wide text-white block">
                Predictive Maintenance
              </span>
              <span className="text-xs font-mono text-blue-400 font-medium block">
                AI Platform v2.0
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              title={collapsed ? item.name : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-lg transition-colors group relative ${
                  collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5 space-x-3'
                } ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 font-medium border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />

              {!collapsed && (
                <span className="text-sm truncate flex-1">{item.name}</span>
              )}

              {/* Alert Badge */}
              {item.hasBadge && activeAlerts.length > 0 && (
                <span
                  className={`${
                    collapsed
                      ? 'absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse'
                      : 'px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {!collapsed && activeAlerts.length}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Model Horizon Indicator & Collapse Toggle */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
        {!collapsed && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Prediction Horizon
            </div>
            <div className="text-xs text-slate-200 font-mono mt-0.5 flex items-center justify-between">
              <span>Next 24 Hours</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition border border-slate-800 ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center space-x-2 text-xs">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

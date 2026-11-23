import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List,
  Cpu,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Gauge,
} from 'lucide-react';
import { useTimestamp } from '../context/TimestampContext';
import {
  getHighestRiskComponent,
  getRiskBadgeClasses,
  formatRiskPercent,
  formatProbability,
  COMPONENT_COLORS,
} from '../utils/riskUtils';

export default function MachineMonitoring() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { predictionsData, loadingPredictions } = useTimestamp();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [riskFilter, setRiskFilter] = useState('All');
  const [modelFilter, setModelFilter] = useState('All');
  const [sortField, setSortField] = useState('risk_percent');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const rawPredictions = predictionsData?.predictions || [];

  // Filter and sort
  const filteredMachines = useMemo(() => {
    let list = [...rawPredictions];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.machineID.toString().includes(q) ||
          m.model?.toLowerCase().includes(q)
      );
    }

    if (riskFilter === 'Alerts') {
      list = list.filter((m) => m.alert === true);
    } else if (riskFilter !== 'All') {
      list = list.filter((m) => m.risk_level === riskFilter);
    }

    if (modelFilter !== 'All') {
      list = list.filter((m) => m.model === modelFilter);
    }

    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [rawPredictions, search, riskFilter, modelFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredMachines.length / pageSize) || 1;
  const paginatedMachines = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMachines.slice(start, start + pageSize);
  }, [filteredMachines, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Top Banner and Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h1 className="text-lg font-bold text-slate-100">
                Machine Monitoring Registry (100 Units)
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live status, calibrated 24h failure probabilities, and individual component risk profiles.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-1 flex items-center space-x-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800 text-xs">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by Machine ID (e.g. 19) or Model..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80"
            />
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-mono text-[11px]">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Alerts">Active Alerts Only</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>

          {/* Model Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-mono text-[11px]">Model:</span>
            <select
              value={modelFilter}
              onChange={(e) => {
                setModelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="All">All Hardware Models</option>
              <option value="model1">Model 1</option>
              <option value="model2">Model 2</option>
              <option value="model3">Model 3</option>
              <option value="model4">Model 4</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-mono text-[11px]">Sort:</span>
            <select
              value={`${sortField}_${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split('_');
                setSortField(f);
                setSortOrder(o);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="risk_percent_desc">Risk (Highest First)</option>
              <option value="risk_percent_asc">Risk (Lowest First)</option>
              <option value="machineID_asc">Machine ID (1 → 100)</option>
              <option value="machineID_desc">Machine ID (100 → 1)</option>
              <option value="age_desc">Age (Oldest First)</option>
              <option value="age_asc">Age (Newest First)</option>
            </select>
          </div>

          {/* Page Size */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-mono text-[11px]">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value={12}>12 cards</option>
              <option value={24}>24 cards</option>
              <option value={48}>48 cards</option>
              <option value={100}>All 100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedMachines.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 font-mono text-sm bg-slate-900/50 rounded-xl border border-slate-800">
              No machines match the filter criteria.
            </div>
          ) : (
            paginatedMachines.map((m) => {
              const highestComp = getHighestRiskComponent(m);
              const isHigh = m.risk_level === 'High' || m.alert === true;
              const badges = getRiskBadgeClasses(m.risk_level, m.alert);

              return (
                <div
                  key={m.machineID}
                  onClick={() => navigate(`/machines/${m.machineID}`)}
                  className={`bg-slate-900/90 border rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition cursor-pointer shadow-sm relative group overflow-hidden ${
                    isHigh
                      ? 'border-rose-500/40 bg-rose-950/10'
                      : m.risk_level === 'Medium'
                      ? 'border-amber-500/30'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Top row */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 font-mono font-bold text-xs flex items-center justify-center text-slate-200">
                          #{m.machineID}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition">
                            Machine {m.machineID}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {m.model} • {m.age} yrs
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badges.badge}`}>
                        {m.risk_level}
                      </span>
                    </div>

                    {/* Overall Risk Meter */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-mono mb-1">
                        <span className="text-slate-400 text-[11px]">24h Failure Risk:</span>
                        <span className={`font-bold ${badges.text}`}>
                          {formatRiskPercent(m.risk_percent)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(m.risk_percent || 0, 100)}%`,
                            backgroundColor:
                              isHigh ? '#ef4444' : m.risk_level === 'Medium' ? '#f59e0b' : '#10b981',
                          }}
                        />
                      </div>
                    </div>

                    {/* 4 Component Probabilities Mini-Meters */}
                    <div className="mt-3.5 space-y-1.5 pt-3 border-t border-slate-800/80 font-mono text-[10px]">
                      {[
                        { label: 'Comp 1', prob: m.p_comp1, color: COMPONENT_COLORS.comp1 },
                        { label: 'Comp 2', prob: m.p_comp2, color: COMPONENT_COLORS.comp2 },
                        { label: 'Comp 3', prob: m.p_comp3, color: COMPONENT_COLORS.comp3 },
                        { label: 'Comp 4', prob: m.p_comp4, color: COMPONENT_COLORS.comp4 },
                      ].map((c) => (
                        <div key={c.label} className="flex items-center justify-between">
                          <span className="text-slate-400">{c.label}</span>
                          <div className="flex items-center space-x-1.5">
                            <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min((c.prob || 0) * 100, 100)}%`,
                                  backgroundColor: c.color,
                                }}
                              />
                            </div>
                            <span className="text-slate-300 w-8 text-right">
                              {formatProbability(c.prob)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <div className="text-slate-400 truncate max-w-[140px]">
                      Peak: <span className="text-slate-200">{highestComp.label}</span>
                    </div>
                    <span className="text-blue-400 group-hover:text-blue-300 font-medium inline-flex items-center space-x-1">
                      <span>Inspect</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Machine ID</th>
                <th className="py-3 px-4">Model & Age</th>
                <th className="py-3 px-4">Overall Risk</th>
                <th className="py-3 px-4">Component 1</th>
                <th className="py-3 px-4">Component 2</th>
                <th className="py-3 px-4">Component 3</th>
                <th className="py-3 px-4">Component 4</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Alert</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-mono">
              {paginatedMachines.map((m) => {
                const isHigh = m.risk_level === 'High' || m.alert === true;
                const badges = getRiskBadgeClasses(m.risk_level, m.alert);

                return (
                  <tr
                    key={m.machineID}
                    onClick={() => navigate(`/machines/${m.machineID}`)}
                    className="cursor-pointer transition hover:bg-slate-800/60"
                  >
                    <td className="py-3 px-4 font-bold text-slate-100">
                      Machine #{m.machineID}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {m.model} ({m.age}y)
                    </td>
                    <td className={`py-3 px-4 font-bold ${badges.text}`}>
                      {formatRiskPercent(m.risk_percent)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{formatProbability(m.p_comp1)}</td>
                    <td className="py-3 px-4 text-slate-300">{formatProbability(m.p_comp2)}</td>
                    <td className="py-3 px-4 text-slate-300">{formatProbability(m.p_comp3)}</td>
                    <td className="py-3 px-4 text-slate-300">{formatProbability(m.p_comp4)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badges.badge}`}>
                        {m.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {m.alert ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          ALERT
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Normal</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/machines/${m.machineID}`);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700 transition text-[11px]"
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div>
          Showing {paginatedMachines.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filteredMachines.length)} of {filteredMachines.length} units
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

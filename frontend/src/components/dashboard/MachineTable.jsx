import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  ExternalLink,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react';
import { useTimestamp } from '../../context/TimestampContext';
import {
  getHighestRiskComponent,
  getRiskBadgeClasses,
  formatRiskPercent,
  COMPONENT_COLORS,
} from '../../utils/riskUtils';

export default function MachineTable() {
  const navigate = useNavigate();
  const { predictionsData, loadingPredictions } = useTimestamp();

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All'); // 'All' | 'High' | 'Medium' | 'Low' | 'Alerts'
  const [modelFilter, setModelFilter] = useState('All');
  const [sortField, setSortField] = useState('risk_percent'); // 'risk_percent' | 'machineID' | 'age'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const rawPredictions = predictionsData?.predictions || [];

  // Filtering & Sorting
  const filteredMachines = useMemo(() => {
    let list = [...rawPredictions];

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.machineID.toString().includes(q) ||
          m.model?.toLowerCase().includes(q)
      );
    }

    // Risk category filter
    if (riskFilter === 'Alerts') {
      list = list.filter((m) => m.alert === true);
    } else if (riskFilter !== 'All') {
      list = list.filter((m) => m.risk_level === riskFilter);
    }

    // Model filter
    if (modelFilter !== 'All') {
      list = list.filter((m) => m.model === modelFilter);
    }

    // Sort
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

  // Pagination
  const totalPages = Math.ceil(filteredMachines.length / pageSize) || 1;
  const paginatedMachines = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMachines.slice(start, start + pageSize);
  }, [filteredMachines, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">
            Fleet Risk Registry & Predictive Scoring
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Showing {filteredMachines.length} of {rawPredictions.length} machines • Real-time LightGBM inference
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search ID/Model..."
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 w-36 sm:w-44"
            />
          </div>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 font-mono focus:outline-none cursor-pointer"
          >
            <option value="All">All Risk Levels</option>
            <option value="Alerts">Alerts Only (≥33%)</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>

          {/* Model Filter */}
          <select
            value={modelFilter}
            onChange={(e) => {
              setModelFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 font-mono focus:outline-none cursor-pointer"
          >
            <option value="All">All Models</option>
            <option value="model1">Model 1</option>
            <option value="model2">Model 2</option>
            <option value="model3">Model 3</option>
            <option value="model4">Model 4</option>
          </select>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-300 font-mono focus:outline-none cursor-pointer"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 (All)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th
                onClick={() => handleSort('machineID')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>Machine ID</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('model')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>Model / Age</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('risk_percent')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>24h Failure Risk</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4">Peak Vulnerability Component</th>
              <th className="py-3 px-4">Risk Category</th>
              <th className="py-3 px-4">Alert Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-mono">
            {paginatedMachines.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  {loadingPredictions ? 'Fetching model scores...' : 'No machines match the selected filter criteria.'}
                </td>
              </tr>
            ) : (
              paginatedMachines.map((m) => {
                const highestComp = getHighestRiskComponent(m);
                const isHighRisk = m.risk_level === 'High' || m.alert === true;
                const badges = getRiskBadgeClasses(m.risk_level, m.alert);

                return (
                  <tr
                    key={m.machineID}
                    onClick={() => navigate(`/machines/${m.machineID}`)}
                    className={`cursor-pointer transition hover:bg-slate-800/60 ${
                      isHighRisk
                        ? 'bg-rose-950/20 border-l-2 border-l-rose-500'
                        : m.risk_level === 'Medium'
                        ? 'border-l-2 border-l-amber-500/60'
                        : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    {/* Machine ID */}
                    <td className="py-3 px-4 font-bold text-slate-100">
                      <div className="flex items-center space-x-2">
                        {isHighRisk && (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        <span>Machine #{m.machineID}</span>
                      </div>
                    </td>

                    {/* Model & Age */}
                    <td className="py-3 px-4 text-slate-300">
                      <span className="font-semibold text-slate-200">{m.model || 'model3'}</span>
                      <span className="text-slate-500 text-[11px] ml-1.5">({m.age || '—'} yrs)</span>
                    </td>

                    {/* Overall Risk & Mini Bar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${badges.text} w-12`}>
                          {formatRiskPercent(m.risk_percent)}
                        </span>
                        <div className="w-20 sm:w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(m.risk_percent || 0, 100)}%`,
                              backgroundColor:
                                isHighRisk ? '#ef4444' : m.risk_level === 'Medium' ? '#f59e0b' : '#10b981',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Highest Risk Component */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: COMPONENT_COLORS[highestComp.key] || '#94a3b8' }}
                        />
                        <span className="text-slate-300 font-sans text-xs">
                          {highestComp.label}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          ({highestComp.percent})
                        </span>
                      </div>
                    </td>

                    {/* Risk Category Badge */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border ${badges.badge}`}>
                        {m.risk_level}
                      </span>
                    </td>

                    {/* Alert Status */}
                    <td className="py-3 px-4">
                      {m.alert ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                          CRITICAL ALERT
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-800 border border-slate-700/50">
                          NORMAL
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/machines/${m.machineID}`);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700 transition text-[11px] font-sans inline-flex items-center space-x-1"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2">
        <div>
          Showing {paginatedMachines.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filteredMachines.length)} of {filteredMachines.length} entries
        </div>

        <div className="flex items-center space-x-1.5">
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

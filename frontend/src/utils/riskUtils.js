/**
 * Risk Utilities and Calculation Helpers for Predictive Maintenance AI
 */

export const COMPONENT_LABELS = {
  comp1: 'Component 1',
  comp2: 'Component 2',
  comp3: 'Component 3',
  comp4: 'Component 4',
};

export const COMPONENT_COLORS = {
  comp1: '#38bdf8', // Sky
  comp2: '#818cf8', // Indigo
  comp3: '#c084fc', // Purple
  comp4: '#f43f5e', // Rose
};

export const RISK_COLORS = {
  Low: '#10b981',    // Emerald
  Medium: '#f59e0b', // Amber
  High: '#ef4444',   // Red
};

/**
 * Format risk percentage safely
 */
export function formatRiskPercent(val) {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  const num = typeof val === 'number' ? val : parseFloat(val);
  return `${num.toFixed(1)}%`;
}

/**
 * Format probability (0-1) to percentage string
 */
export function formatProbability(prob) {
  if (prob === null || prob === undefined || isNaN(prob)) return '0.0%';
  return `${(prob * 100).toFixed(1)}%`;
}

/**
 * Identify the component with the highest risk probability from a machine prediction record
 */
export function getHighestRiskComponent(machine) {
  if (!machine) {
    return { key: 'none', label: 'None', prob: 0, percent: '0.0%' };
  }

  const comps = [
    { key: 'comp1', label: 'Component 1', prob: machine.p_comp1 || 0 },
    { key: 'comp2', label: 'Component 2', prob: machine.p_comp2 || 0 },
    { key: 'comp3', label: 'Component 3', prob: machine.p_comp3 || 0 },
    { key: 'comp4', label: 'Component 4', prob: machine.p_comp4 || 0 },
  ];

  comps.sort((a, b) => b.prob - a.prob);
  const highest = comps[0];

  return {
    ...highest,
    percent: formatProbability(highest.prob),
  };
}

/**
 * Get CSS badge classes based on risk level and alert status
 */
export function getRiskBadgeClasses(riskLevel, isAlert = false) {
  if (isAlert || riskLevel === 'High') {
    return {
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
      dot: 'bg-rose-500',
    };
  }
  if (riskLevel === 'Medium') {
    return {
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
      dot: 'bg-amber-500',
    };
  }
  return {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    dot: 'bg-emerald-500',
  };
}

/**
 * Format ISO datetime string to professional timestamp display
 */
export function formatTimestamp(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    }) + ' UTC';
  } catch {
    return isoString;
  }
}

/**
 * Format relative / short timestamp for charts
 */
export function formatShortTimestamp(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString.slice(5, 16);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:00`;
  } catch {
    return isoString;
  }
}

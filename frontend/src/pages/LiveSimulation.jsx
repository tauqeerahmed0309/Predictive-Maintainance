import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Play,
  Pause,
  RotateCcw,
  Clock,
  AlertTriangle,
  Server,
  Activity,
  Layers,
  Cpu,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useTimestamp } from '../context/TimestampContext';
import {
  formatTimestamp,
  formatRiskPercent,
  formatProbability,
  getHighestRiskComponent,
  getRiskBadgeClasses,
  COMPONENT_COLORS,
} from '../utils/riskUtils';
import { useNavigate } from 'react-router-dom';

export default function LiveSimulation() {
  const navigate = useNavigate();
  const {
    demoTimes,
    selectedTime,
    setSelectedTime,
    predictionsData,
    loadingPredictions,
    activeAlerts,
    apiStatus,
  } = useTimestamp();

  // Replay states
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState(2000); // 2000ms per step
  const [wsStatus, setWsStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'
  const intervalRef = useRef(null);

  // Check if WebSocket telemetry stream exists on backend
  useEffect(() => {
    let ws = null;
    try {
      ws = new WebSocket('ws://127.0.0.1:8000/ws/telemetry');
      ws.onopen = () => setWsStatus('connected');
      ws.onerror = () => setWsStatus('disconnected');
      ws.onclose = () => setWsStatus('disconnected');
    } catch {
      setWsStatus('disconnected');
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Sequential Historical Replay loop using actual demo-times API
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSelectedTime((currentTime) => {
        const currentIndex = demoTimes.indexOf(currentTime);
        if (currentIndex === -1 || currentIndex >= demoTimes.length - 1) {
          // Reached end of historical timeline, pause
          setIsPlaying(false);
          return demoTimes[0] || currentTime;
        }
        return demoTimes[currentIndex + 1];
      });
    }, playbackSpeedMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, demoTimes, playbackSpeedMs, setSelectedTime]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => {
    setIsPlaying(false);
    if (demoTimes.length > 0) {
      setSelectedTime(demoTimes[0]);
    }
  };

  const predictions = predictionsData?.predictions || [];
  const currentStepIndex = demoTimes.indexOf(selectedTime);

  return (
    <div className="space-y-6">
      {/* Top Banner with Strict Industrial Telemetry Disclaimer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold text-slate-100">
              SIMULATED LIVE TELEMETRY & HISTORICAL REPLAY
            </h1>
          </div>
          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            [SIMULATED REPLAY ENVIRONMENT]
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          <strong>Important Architecture Notice:</strong> This feature replays historical telemetry datasets chronologically to simulate real-time fleet operations.
          It is strictly a <em>simulated historical replay</em> and never represents a live physical IoT device feed.
          The configured baseline replay rate models <strong>one historical hour per real second</strong> across all 100 monitored machines.
        </p>
      </div>

      {/* Backend WebSocket Stream Diagnostic Status */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Dedicated WebSocket Replay Stream Status
            </h2>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${
              wsStatus === 'connected'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {wsStatus === 'connected' ? 'STREAM CONNECTED' : 'STREAM OFFLINE (STANDBY)'}
          </span>
        </div>

        <div className="text-xs text-slate-300 font-mono space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div>
            Target WebSocket URL: <span className="text-slate-400">ws://127.0.0.1:8000/ws/telemetry</span>
          </div>
          <div>
            FastAPI REST Service: <span className="text-emerald-400">{apiStatus.toUpperCase()} (Port 8000)</span>
          </div>
          <div className="text-slate-400">
            {wsStatus === 'connected'
              ? 'Receiving binary sensor telemetry stream frames.'
              : 'Backend WebSocket replay daemon is not running. Sequential historical replay mode is active using verified backend snapshot endpoints.'}
          </div>
        </div>
      </div>

      {/* Playback Controls & Timeline Position */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Historical Timeline Replay Controls
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Step {currentStepIndex + 1} of {demoTimes.length} • Speed:{' '}
            <span className="text-slate-200 font-bold">1h / {playbackSpeedMs / 1000}s</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {!isPlaying ? (
              <button
                onClick={handlePlay}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-lg shadow-blue-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Simulation</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Replay</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
              title="Reset to initial timestamp"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Timestamp Display */}
          <div className="px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs flex items-center space-x-2">
            <span className="text-slate-500">Current Dataset Time:</span>
            <span className="text-blue-400 font-bold">{formatTimestamp(selectedTime)}</span>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400">Step Interval:</span>
            <select
              value={playbackSpeedMs}
              onChange={(e) => setPlaybackSpeedMs(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value={1000}>1.0 sec (Fastest)</option>
              <option value={2000}>2.0 sec (Default)</option>
              <option value={3000}>3.0 sec (Detailed)</option>
            </select>
          </div>
        </div>

        {/* Progress Bar across demo-times */}
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{
              width: `${((currentStepIndex + 1) / (demoTimes.length || 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Live Machine Risk Updates Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            Machine Fleet State at Current Replay Step
          </h2>
          <span className="text-xs font-mono text-rose-400">
            {activeAlerts.length} Units in Critical State
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {predictions.slice(0, 16).map((m) => {
            const isHigh = m.risk_level === 'High' || m.alert;
            const highestComp = getHighestRiskComponent(m);
            const badges = getRiskBadgeClasses(m.risk_level, m.alert);

            return (
              <div
                key={m.machineID}
                onClick={() => navigate(`/machines/${m.machineID}`)}
                className={`p-3 rounded-lg border transition cursor-pointer font-mono text-xs flex flex-col justify-between ${
                  isHigh
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-200">Machine #{m.machineID}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${badges.badge}`}>
                    {m.risk_level}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-400">24h Risk:</span>
                  <span className={`font-bold text-sm ${badges.text}`}>
                    {formatRiskPercent(m.risk_percent)}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between font-sans">
                  <span>Peak: {highestComp.label}</span>
                  <span className="text-blue-400">Inspect →</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center text-xs text-slate-400 font-mono">
          Showing 16 sample machines from the 100-machine fleet. Full details available in Machine Registry.
        </div>
      </div>
    </div>
  );
}

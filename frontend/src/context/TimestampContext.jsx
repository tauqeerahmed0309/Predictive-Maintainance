import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getHealth, getDemoTimes, getPredictions } from '../services/api';

const TimestampContext = createContext(null);

export const TimestampProvider = ({ children }) => {
  const [apiStatus, setApiStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [healthData, setHealthData] = useState(null);
  const [demoTimes, setDemoTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [predictionsData, setPredictionsData] = useState(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  // Ref to abort inflight requests when a newer timestamp is chosen
  const abortControllerRef = useRef(null);

  // Check backend health
  const checkHealth = useCallback(async () => {
    try {
      const health = await getHealth();
      setHealthData(health);
      setApiStatus(health.status === 'healthy' ? 'online' : 'degraded');
      return true;
    } catch (err) {
      setApiStatus('offline');
      setHealthData(null);
      return false;
    }
  }, []);

  // Initial load: health check & demo-times
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      const isOnline = await checkHealth();
      if (!isOnline || !isMounted) return;

      try {
        const timesData = await getDemoTimes();
        if (isMounted && timesData?.times?.length > 0) {
          setDemoTimes(timesData.times);
          // Default to the first demo timestamp (or a known high-signal one)
          setSelectedTime(timesData.times[0]);
        }
      } catch (err) {
        console.warn('Could not load demo-times from backend:', err);
      }
    }

    initialize();

    // Periodic health heartbeat every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [checkHealth]);

  // Fetch predictions whenever selectedTime changes
  useEffect(() => {
    // If no selectedTime yet, don't query
    if (!selectedTime) return;

    // Abort previous inflight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingPredictions(true);
    setPredictionError(null);

    getPredictions(selectedTime, controller.signal)
      .then((data) => {
        setPredictionsData(data);
        setPredictionError(null);
        setLastFetchedAt(new Date());
        setApiStatus('online');
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
          // Request was aborted by newer selection, ignore
          return;
        }
        setPredictionError(err.message || 'Failed to retrieve model predictions.');
        if (err.message?.includes('Unable to connect')) {
          setApiStatus('offline');
        }
      })
      .finally(() => {
        setLoadingPredictions(false);
      });

    return () => {
      controller.abort();
    };
  }, [selectedTime]);

  const refreshPredictions = useCallback(() => {
    if (!selectedTime) return;
    setLoadingPredictions(true);
    getPredictions(selectedTime)
      .then((data) => {
        setPredictionsData(data);
        setPredictionError(null);
        setLastFetchedAt(new Date());
      })
      .catch((err) => {
        setPredictionError(err.message || 'Failed to refresh predictions.');
      })
      .finally(() => {
        setLoadingPredictions(false);
      });
  }, [selectedTime]);

  // Derived state: Active Alerts list
  const activeAlerts = React.useMemo(() => {
    if (!predictionsData?.predictions) return [];
    return predictionsData.predictions
      .filter((m) => m.alert === true || m.risk_level === 'High')
      .sort((a, b) => b.risk - a.risk);
  }, [predictionsData]);

  const value = {
    apiStatus,
    healthData,
    demoTimes,
    selectedTime,
    setSelectedTime,
    predictionsData,
    loadingPredictions,
    predictionError,
    activeAlerts,
    lastFetchedAt,
    refreshPredictions,
    checkHealth,
  };

  return (
    <TimestampContext.Provider value={value}>
      {children}
    </TimestampContext.Provider>
  );
};

export const useTimestamp = () => {
  const context = useContext(TimestampContext);
  if (!context) {
    throw new Error('useTimestamp must be used within a TimestampProvider');
  }
  return context;
};

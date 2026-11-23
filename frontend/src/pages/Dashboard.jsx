import React, { useState, useEffect } from 'react';
import { getPredictions, getDemoTimes } from '../services/api';

const Dashboard = () => {
  const [predictions, setPredictions] = useState(null);
  const [demoTimes, setDemoTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDemoTimes().then(res => {
        setDemoTimes(res.data.times);
        if (res.data.times.length > 0) setSelectedTime(res.data.times[res.data.times.length - 1]);
    });
  }, []);

  useEffect(() => {
    if (selectedTime) {
        setLoading(true);
        getPredictions(selectedTime)
            .then(res => setPredictions(res.data))
            .finally(() => setLoading(false));
    }
  }, [selectedTime]);

  if (loading) return <div className="text-center py-10">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500">As of:</span>
            <select 
                value={selectedTime} 
                onChange={(e) => setSelectedTime(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
                {demoTimes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
      </div>
      
      {predictions && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Total Machines</h3>
                <p className="text-4xl font-bold text-gray-900 mt-2">{predictions.predictions.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-red-600 uppercase">Active Alerts</h3>
                <p className="text-4xl font-bold text-red-600 mt-2">{predictions.alerts}</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

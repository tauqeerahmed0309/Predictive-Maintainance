import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TimestampProvider } from './context/TimestampContext';
import MainLayout from './components/layout/MainLayout';

import Dashboard from './pages/Dashboard';
import MachineMonitoring from './pages/MachineMonitoring';
import MachineDetails from './pages/MachineDetails';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import LiveSimulation from './pages/LiveSimulation';
import SystemStatus from './pages/SystemStatus';

function App() {
  return (
    <BrowserRouter>
      <TimestampProvider>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/machines" element={<MachineMonitoring />} />
            <Route path="/machines/:machineId" element={<MachineDetails />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/simulation" element={<LiveSimulation />} />
            <Route path="/system-status" element={<SystemStatus />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </TimestampProvider>
    </BrowserRouter>
  );
}

export default App;

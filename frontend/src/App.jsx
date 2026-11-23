import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import MachineDetails from './pages/MachineDetails';
import { getHealth } from './services/api';

function App() {
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    getHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex">
        <aside className="w-64 bg-slate-900 text-white min-h-screen p-6 flex flex-col">
            <h1 className="text-xl font-bold mb-10">Predictive Maintenance</h1>
            <nav className="space-y-4">
                <Link to="/" className="block py-2 px-4 rounded hover:bg-slate-800 transition">Dashboard</Link>
            </nav>
        </aside>
        <div className="flex-1">
            <Navbar apiStatus={apiStatus} />
            <main className="p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/machines/:machineId" element={<MachineDetails />} />
              </Routes>
            </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;

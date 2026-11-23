import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Server, Activity } from 'lucide-react';

const Navbar = ({ apiStatus }) => {
  const location = useLocation();

  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Activity className="h-8 w-8 text-indigo-400" />
            <span className="text-xl font-bold">Predictive Maintenance</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link 
              to="/" 
              className={`flex items-center space-x-2 px-3 py-2 rounded ${location.pathname === '/' ? 'bg-slate-800' : ''}`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <div className={`flex items-center space-x-2 ${apiStatus === 'online' ? 'text-green-400' : 'text-red-400'}`}>
              <Server className="h-5 w-5" />
              <span className="text-sm uppercase font-semibold">{apiStatus}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

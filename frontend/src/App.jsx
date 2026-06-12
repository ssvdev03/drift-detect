import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, FileSearch, FileText, Settings, Activity } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import DriftAnalysis from './pages/DriftAnalysis';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src="/logo.png" className="sidebar-logo-img" alt="Drift Detect Logo" />
            <span>Drift Detect</span>
          </div>
          
          <nav className="nav-links">
            <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/analyze" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileSearch size={20} />
              <span>Drift Analysis</span>
            </NavLink>
            <NavLink to="/reports" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileText size={20} />
              <span>Reports</span>
            </NavLink>
            <NavLink to="/settings" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Settings size={20} />
              <span>Settings</span>
            </NavLink>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<DriftAnalysis />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

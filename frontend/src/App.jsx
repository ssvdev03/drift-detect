import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileSearch, FileText, Settings, Menu, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import DriftAnalysis from './pages/DriftAnalysis';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import './index.css';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // On mobile default closed, on desktop default open
    return window.innerWidth > 768;
  });
  const location = useLocation();

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Handle resize: if user widens to desktop, open sidebar; if narrows to mobile, close it
  useEffect(() => {
    let previousWidth = window.innerWidth;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (previousWidth <= 768 && currentWidth > 768) {
        setSidebarOpen(true);
      } else if (previousWidth > 768 && currentWidth <= 768) {
        setSidebarOpen(false);
      }
      previousWidth = currentWidth;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="app-container">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <img src="/logo.png" className="sidebar-logo-img" alt="Drift Detect Logo" />
            <span>Drift Detect</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
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
        {/* Top Bar with hamburger */}
        <div className="topbar">
          <button
            className="hamburger-btn"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            <Menu size={22} />
          </button>
        </div>

        <div className="main-inner">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<DriftAnalysis />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;

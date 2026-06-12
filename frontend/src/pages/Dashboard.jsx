import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle, FileCode2, Inbox, Clock, TrendingUp, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('driftHistory') || '[]');
    setHistory(stored);

    // Listen for storage changes from other tabs or analysis page
    const handleStorage = () => {
      const updated = JSON.parse(localStorage.getItem('driftHistory') || '[]');
      setHistory(updated);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Aggregate stats from all reports
  const stats = useMemo(() => {
    const totalReports = history.length;
    const totalDrifts = history.reduce((sum, r) => sum + (r.stats?.total_drifts || 0), 0);
    const totalBreaking = history.reduce((sum, r) => sum + (r.stats?.breaking_count || 0), 0);
    const totalFunctional = history.reduce((sum, r) => sum + (r.stats?.functional_count || 0), 0);
    const totalCosmetic = history.reduce((sum, r) => sum + (r.stats?.cosmetic_count || 0), 0);
    return { totalReports, totalDrifts, totalBreaking, totalFunctional, totalCosmetic };
  }, [history]);

  // Pie chart data from aggregated severity counts
  const pieData = useMemo(() => {
    const data = [];
    if (stats.totalBreaking > 0) data.push({ name: 'Breaking', value: stats.totalBreaking, color: '#ef4444' });
    if (stats.totalFunctional > 0) data.push({ name: 'Functional', value: stats.totalFunctional, color: '#f59e0b' });
    if (stats.totalCosmetic > 0) data.push({ name: 'Cosmetic', value: stats.totalCosmetic, color: '#10b981' });
    return data;
  }, [stats]);

  // Bar chart: drifts per report (most recent 7 reports)
  const barData = useMemo(() => {
    const recent = [...history].reverse().slice(-7);
    return recent.map((r, i) => {
      const date = new Date(r.date);
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        name: label,
        breaking: r.stats?.breaking_count || 0,
        functional: r.stats?.functional_count || 0,
        cosmetic: r.stats?.cosmetic_count || 0,
        total: r.stats?.total_drifts || 0,
      };
    });
  }, [history]);

  // Area chart: cumulative drift trend over time
  const trendData = useMemo(() => {
    const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
    let cumBreaking = 0, cumFunctional = 0, cumCosmetic = 0;
    return sorted.map(r => {
      cumBreaking += r.stats?.breaking_count || 0;
      cumFunctional += r.stats?.functional_count || 0;
      cumCosmetic += r.stats?.cosmetic_count || 0;
      const date = new Date(r.date);
      return {
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        Breaking: cumBreaking,
        Functional: cumFunctional,
        Cosmetic: cumCosmetic,
      };
    });
  }, [history]);

  // Recent activity list
  const recentReports = useMemo(() => history.slice(0, 5), [history]);

  const formatTimeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const hasData = history.length > 0;

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: '8px', padding: '0.75rem 1rem', boxShadow: 'var(--shadow-lg)',
        }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color || p.fill, fontSize: '0.8rem', margin: '0.15rem 0' }}>
              {p.name}: <strong>{p.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {hasData
              ? `Overview from ${stats.totalReports} analysis report${stats.totalReports !== 1 ? 's' : ''}.`
              : 'Overview of configuration drifts and system health.'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
          <Activity size={18} />
          <span>Generate Report</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <div className="flex-between">
            <span className="stat-title">Total Reports</span>
            <div className="stat-icon" style={{ color: 'var(--accent-primary)' }}>
              <FileCode2 size={24} />
            </div>
          </div>
          <span className="stat-value">{stats.totalReports}</span>
        </div>
        
        <div className="card stat-card">
          <div className="flex-between">
            <span className="stat-title">Breaking Issues</span>
            <div className="stat-icon" style={{ color: 'var(--danger)' }}>
              <AlertTriangle size={24} />
            </div>
          </div>
          <span className="stat-value" style={{ color: stats.totalBreaking > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{stats.totalBreaking}</span>
        </div>

        <div className="card stat-card">
          <div className="flex-between">
            <span className="stat-title">Functional Issues</span>
            <div className="stat-icon" style={{ color: 'var(--warning)' }}>
              <Activity size={24} />
            </div>
          </div>
          <span className="stat-value" style={{ color: stats.totalFunctional > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>{stats.totalFunctional}</span>
        </div>

        <div className="card stat-card">
          <div className="flex-between">
            <span className="stat-title">Cosmetic Issues</span>
            <div className="stat-icon" style={{ color: 'var(--success)' }}>
              <CheckCircle size={24} />
            </div>
          </div>
          <span className="stat-value" style={{ color: stats.totalCosmetic > 0 ? 'var(--success)' : 'var(--text-primary)' }}>{stats.totalCosmetic}</span>
        </div>
      </div>

      {!hasData ? (
        /* Empty State */
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Inbox size={64} color="var(--text-muted)" style={{ margin: '0 auto 1.5rem' }} />
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '1.25rem' }}>No Analysis Data Yet</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            Run your first drift analysis to see real-time charts and statistics here. All data is pulled directly from your report history.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/analyze')} style={{ padding: '0.75rem 1.5rem' }}>
            <Activity size={18} /> Start First Analysis
          </button>
        </div>
      ) : (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-2" style={{ marginBottom: '1.5rem' }}>
            {/* Severity Distribution Pie */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} /> Severity Distribution
              </h3>
              <div style={{ height: '300px' }}>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
                      />
                      {/* Center text */}
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    No drift data available
                  </div>
                )}
              </div>
              {/* Total drifts label under pie */}
              {pieData.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Drifts: </span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalDrifts}</span>
                </div>
              )}
            </div>

            {/* Drifts Per Report Bar Chart */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} /> Drifts Per Report {barData.length > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(last {barData.length})</span>}
              </h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
                    />
                    <Bar dataKey="breaking" name="Breaking" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} animationDuration={600} />
                    <Bar dataKey="functional" name="Functional" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} animationDuration={600} />
                    <Bar dataKey="cosmetic" name="Cosmetic" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={600} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Cumulative Trend + Recent Activity */}
          <div className="grid grid-cols-2">
            {/* Cumulative Trend Area Chart */}
            {trendData.length > 1 && (
              <div className="card">
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} /> Cumulative Drift Trend
                </h3>
                <div style={{ height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="gradBreaking" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradFunctional" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradCosmetic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
                      />
                      <Area type="monotone" dataKey="Breaking" stroke="#ef4444" fill="url(#gradBreaking)" strokeWidth={2} animationDuration={800} />
                      <Area type="monotone" dataKey="Functional" stroke="#f59e0b" fill="url(#gradFunctional)" strokeWidth={2} animationDuration={800} />
                      <Area type="monotone" dataKey="Cosmetic" stroke="#10b981" fill="url(#gradCosmetic)" strokeWidth={2} animationDuration={800} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="card" style={trendData.length <= 1 ? { gridColumn: '1 / -1' } : {}}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} /> Recent Activity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {recentReports.map((report, idx) => {
                  const hasBreaking = (report.stats?.breaking_count || 0) > 0;
                  const statusColor = hasBreaking ? 'var(--danger)' : (report.stats?.functional_count || 0) > 0 ? 'var(--warning)' : 'var(--success)';
                  const statusLabel = hasBreaking ? 'Critical' : (report.stats?.functional_count || 0) > 0 ? 'Warning' : 'Clean';

                  return (
                    <div
                      key={report.id || idx}
                      onClick={() => navigate('/reports')}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.85rem 0.75rem', cursor: 'pointer',
                        borderBottom: idx < recentReports.length - 1 ? '1px solid var(--border-color)' : 'none',
                        borderRadius: 'var(--radius-md)', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}`,
                          flexShrink: 0,
                        }} />
                        <div>
                          <span style={{ fontWeight: 500, fontSize: '0.875rem', display: 'block' }}>
                            {report.intendedFileName} ↔ {report.actualFileName}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {report.stats?.total_drifts || 0} drifts · {formatTimeAgo(report.date)}
                          </span>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                        padding: '0.2rem 0.5rem', borderRadius: '4px',
                        color: statusColor,
                        backgroundColor: statusColor === 'var(--danger)' ? 'rgba(239,68,68,0.1)' : statusColor === 'var(--warning)' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                      }}>
                        {statusLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
              {history.length > 5 && (
                <button
                  onClick={() => navigate('/reports')}
                  style={{
                    marginTop: '1rem', width: '100%', padding: '0.6rem',
                    background: 'transparent', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)', color: 'var(--accent-primary)',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  View all {history.length} reports →
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

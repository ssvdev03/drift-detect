import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Calendar, FileJson, AlertTriangle, Activity, CheckCircle, Clock, BarChart3, ChevronRight, Inbox, Download } from 'lucide-react';
import { useSettings } from '../SettingsContext';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const { settings } = useSettings();

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('driftHistory') || '[]');
    setReports(history);
  }, []);

  const downloadReport = async (format) => {
    if (!selectedReport) return;
    const apiUrl = settings.apiEndpoint || 'https://drift-detect.onrender.com';
    window.open(`${apiUrl}/api/reports/${format}/${selectedReport.id}`, '_blank');
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all report history?')) {
      localStorage.removeItem('driftHistory');
      setReports([]);
      setSelectedReport(null);
    }
  };

  const deleteReport = (id, e) => {
    e.stopPropagation();
    const updated = reports.filter(r => r.id !== id);
    localStorage.setItem('driftHistory', JSON.stringify(updated));
    setReports(updated);
    if (selectedReport?.id === id) setSelectedReport(null);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getTimeSince = (dateStr) => {
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

  const getSeverityColor = (report) => {
    if (report.stats.breaking_count > 0) return 'var(--danger)';
    if (report.stats.functional_count > 0) return 'var(--warning)';
    return 'var(--success)';
  };

  const getOverallStatus = (report) => {
    if (report.stats.breaking_count > 0) return { label: 'Critical', color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.15)' };
    if (report.stats.functional_count > 0) return { label: 'Warning', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.15)' };
    if (report.stats.cosmetic_count > 0) return { label: 'Minor', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.15)' };
    return { label: 'Clean', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.15)' };
  };

  if (reports.length === 0) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Reports</h1>
            <p className="page-subtitle">View past analysis reports and track configuration drift history.</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Inbox size={64} color="var(--text-muted)" style={{ margin: '0 auto 1.5rem' }} />
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '1.25rem' }}>No Reports Yet</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Run your first drift analysis to see reports here. Each analysis is automatically saved for future reference.
          </p>
          <a href="DriftAnalysis.jsx" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <FileJson size={18} /> Start Analysis
          </a>
        </div>
      </div>
    );
  }

  if (selectedReport) {
    const status = getOverallStatus(selectedReport);
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <button
                onClick={() => setSelectedReport(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
              >
                ← Back to Reports
              </button>
            </div>
            <h1 className="page-title">Report Details</h1>
            <p className="page-subtitle">Analysis from {formatDate(selectedReport.date)}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge" style={{ backgroundColor: status.bg, color: status.color, border: `1px solid ${status.color}30`, fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
              {status.label}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" onClick={() => downloadReport('markdown')}>
                <Download size={18} /> MD
              </button>
              <button className="btn btn-primary" onClick={() => downloadReport('pdf')}>
                <Download size={18} /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* File Info */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Files Compared</h4>
          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <FileJson size={20} color="var(--accent-primary)" />
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Intended</span>
                <span style={{ fontWeight: 500, wordBreak: 'break-all' }}>{selectedReport.intendedFileName}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
              <FileJson size={20} color="var(--accent-secondary)" />
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Actual</span>
                <span style={{ fontWeight: 500, wordBreak: 'break-all' }}>{selectedReport.actualFileName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4" style={{ marginBottom: '1.5rem' }}>
          <div className="card stat-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
            <span className="stat-title">Total Drifts</span>
            <span className="stat-value">{selectedReport.stats.total_drifts}</span>
          </div>
          <div className="card stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
            <span className="stat-title">Breaking</span>
            <span className="stat-value" style={{ color: 'var(--danger)' }}>{selectedReport.stats.breaking_count}</span>
          </div>
          <div className="card stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <span className="stat-title">Functional</span>
            <span className="stat-value" style={{ color: 'var(--warning)' }}>{selectedReport.stats.functional_count}</span>
          </div>
          <div className="card stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
            <span className="stat-title">Cosmetic</span>
            <span className="stat-value" style={{ color: 'var(--success)' }}>{selectedReport.stats.cosmetic_count}</span>
          </div>
        </div>

        {/* Severity Breakdown Bar */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Severity Breakdown</h4>
          <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
            {selectedReport.stats.breaking_count > 0 && (
              <div style={{ width: `${(selectedReport.stats.breaking_count / selectedReport.stats.total_drifts) * 100}%`, background: 'var(--danger)', transition: 'width 0.5s ease' }} />
            )}
            {selectedReport.stats.functional_count > 0 && (
              <div style={{ width: `${(selectedReport.stats.functional_count / selectedReport.stats.total_drifts) * 100}%`, background: 'var(--warning)', transition: 'width 0.5s ease' }} />
            )}
            {selectedReport.stats.cosmetic_count > 0 && (
              <div style={{ width: `${(selectedReport.stats.cosmetic_count / selectedReport.stats.total_drifts) * 100}%`, background: 'var(--success)', transition: 'width 0.5s ease' }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--danger)' }} /> Breaking
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--warning)' }} /> Functional
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--success)' }} /> Cosmetic
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="card">
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Metadata</h4>
          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Report ID</span>
              <code style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', wordBreak: 'break-all' }}>{selectedReport.id}</code>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Analyzed At</span>
              <span style={{ fontSize: '0.875rem' }}>{formatDate(selectedReport.date)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">View past analysis reports and track configuration drift history.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={16} /> {reports.length} report{reports.length !== 1 ? 's' : ''}
          </span>
          <button className="btn btn-outline" onClick={clearHistory} style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <Trash2 size={16} /> Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1">
        {reports.map((report, idx) => {
          const status = getOverallStatus(report);
          return (
            <div
              key={report.id || idx}
              className="card"
              onClick={() => setSelectedReport(report)}
              style={{ cursor: 'pointer', borderLeft: `4px solid ${getSeverityColor(report)}`, position: 'relative' }}
            >
              <div className="report-card-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0
                  }}>
                    <FileText size={22} color="white" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, wordBreak: 'break-all' }}>
                        {report.intendedFileName} vs {report.actualFileName}
                      </h3>
                      <span className="badge" style={{ backgroundColor: status.bg, color: status.color, border: `1px solid ${status.color}30` }}>
                        {status.label}
                      </span>
                    </div>
                    <div className="report-card-meta" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={13} /> {formatDate(report.date)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={13} /> {getTimeSince(report.date)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats mini badges */}
                <div className="report-card-stats" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {report.stats.breaking_count > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>
                        <AlertTriangle size={13} color="var(--danger)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--danger)' }}>{report.stats.breaking_count}</span>
                      </div>
                    )}
                    {report.stats.functional_count > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.5rem', background: 'rgba(245,158,11,0.1)', borderRadius: '6px' }}>
                        <Activity size={13} color="var(--warning)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning)' }}>{report.stats.functional_count}</span>
                      </div>
                    )}
                    {report.stats.cosmetic_count > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '6px' }}>
                        <CheckCircle size={13} color="var(--success)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)' }}>{report.stats.cosmetic_count}</span>
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-outline"
                    onClick={(e) => deleteReport(report.id, e)}
                    style={{ padding: '0.35rem', borderColor: 'transparent', color: 'var(--text-muted)' }}
                    title="Delete report"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={20} color="var(--text-muted)" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

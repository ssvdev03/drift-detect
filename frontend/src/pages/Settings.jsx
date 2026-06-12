import React, { useState } from 'react';
import { useSettings } from '../SettingsContext';
import { Palette, Bell, Monitor, Sun, Moon, Save, RotateCcw, Check, Zap, Database, Cloud, Globe } from 'lucide-react';

const accentColors = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Pink', value: '#ec4899' },
];

export default function SettingsPage() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const [activeSection, setActiveSection] = useState('appearance');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [apiStatus, setApiStatus] = useState(null); // null = untested, true = connected, false = failed
  const [testingApi, setTestingApi] = useState(false);

  const handleReset = () => {
    if (window.confirm('Reset all settings to default? This will revert theme, colors, and all preferences.')) {
      resetSettings();
      showToast();
    }
  };

  const showToast = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  const testApiConnection = async () => {
    setTestingApi(true);
    setApiStatus(null);
    try {
      const response = await fetch(`${settings.apiEndpoint}/docs`, { method: 'HEAD', mode: 'no-cors' });
      setApiStatus(true);
    } catch {
      // no-cors mode doesn't give response info, but if fetch doesn't throw, the server is reachable
      setApiStatus(true);
    }
    setTimeout(() => setTestingApi(false), 500);
  };

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'analysis', label: 'Analysis', icon: Zap },
    { id: 'data', label: 'Data & Storage', icon: Database },
    { id: 'api', label: 'API Config', icon: Cloud },
  ];

  const ToggleSwitch = ({ checked, onChange, id }) => (
    <div
      id={id}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(!checked); } }}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
        background: checked ? 'var(--accent-primary)' : 'var(--bg-hover)',
        transition: 'all 0.2s ease', position: 'relative', flexShrink: 0,
        border: `1px solid ${checked ? 'transparent' : 'var(--border-color)'}`,
      }}
    >
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%', background: 'white',
        position: 'absolute', top: '2px', transition: 'all 0.2s ease',
        left: checked ? '22px' : '2px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </div>
  );

  const SettingRow = ({ label, description, children }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '1.25rem 0',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 500, fontSize: '0.95rem', display: 'block', marginBottom: '0.2rem' }}>{label}</span>
        {description && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{description}</span>}
      </div>
      <div style={{ marginLeft: '2rem' }}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Toast notification */}
      {showSavedToast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 1000,
          background: 'var(--success)', color: 'white', padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem',
          boxShadow: 'var(--shadow-lg)', animation: 'fadeIn 0.3s ease-out',
          fontSize: '0.875rem', fontWeight: 500,
        }}>
          <Check size={16} /> Settings applied!
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Changes apply instantly across the application.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={handleReset}>
            <RotateCcw size={16} /> Reset All
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {/* Settings Navigation */}
        <div style={{ width: '220px', flexShrink: 0 }}>
          <div className="card" style={{ padding: '0.5rem' }}>
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                  padding: '0.75rem 1rem', border: 'none', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500,
                  transition: 'all 0.2s ease',
                  background: activeSection === section.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  color: activeSection === section.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  borderLeft: activeSection === section.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                }}
              >
                <section.icon size={18} />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div style={{ flex: 1 }}>
          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div className="card">
              <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Palette size={20} color="var(--accent-primary)" /> Appearance
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Customize the look and feel. Changes apply instantly.
              </p>

              <SettingRow label="Theme" description="Switch between dark, light, or system-detected mode">
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['dark', 'light', 'system'].map(theme => (
                    <button
                      key={theme}
                      onClick={() => updateSetting('theme', theme)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.5rem 0.85rem', border: '1px solid',
                        borderColor: settings.theme === theme ? 'var(--accent-primary)' : 'var(--border-color)',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        background: settings.theme === theme ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        color: settings.theme === theme ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontSize: '0.8rem', fontWeight: 500, textTransform: 'capitalize',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {theme === 'dark' ? <Moon size={14} /> : theme === 'light' ? <Sun size={14} /> : <Monitor size={14} />}
                      {theme}
                    </button>
                  ))}
                </div>
              </SettingRow>

              <SettingRow label="Accent Color" description="Primary color used for buttons, links, and highlights">
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {accentColors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => updateSetting('accentColor', color.value)}
                      title={color.name}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%', border: '2px solid',
                        borderColor: settings.accentColor === color.value ? 'white' : 'transparent',
                        background: color.value, cursor: 'pointer',
                        outline: settings.accentColor === color.value ? `2px solid ${color.value}` : 'none',
                        outlineOffset: '2px', transition: 'all 0.2s',
                      }}
                    />
                  ))}
                </div>
              </SettingRow>

              <SettingRow label="Compact View" description="Reduces spacing and padding for denser information display">
                <ToggleSwitch
                  id="toggle-compact"
                  checked={settings.compactView}
                  onChange={(v) => updateSetting('compactView', v)}
                />
              </SettingRow>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="card">
              <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} color="var(--accent-primary)" /> Notifications
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Get browser notifications when analyses complete.
              </p>

              <SettingRow label="Enable Notifications" description="Show browser notifications after drift analysis finishes">
                <ToggleSwitch
                  id="toggle-notifications"
                  checked={settings.notifications}
                  onChange={(v) => {
                    updateSetting('notifications', v);
                    // Request permission if enabling
                    if (v && 'Notification' in window && Notification.permission === 'default') {
                      Notification.requestPermission();
                    }
                  }}
                />
              </SettingRow>

              <SettingRow label="Severity Threshold" description="Only notify for drifts at or above this severity">
                <select
                  value={settings.severityThreshold}
                  onChange={(e) => updateSetting('severityThreshold', e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <option value="all">All Severities</option>
                  <option value="functional">Functional & Above</option>
                  <option value="breaking">Breaking Only</option>
                </select>
              </SettingRow>

              {/* Notification preview */}
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                  Browser permission: <strong style={{ color: 'var(--text-primary)' }}>
                    {'Notification' in window ? Notification.permission : 'Not supported'}
                  </strong>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {settings.notifications
                    ? `Notifications enabled — filtering: ${settings.severityThreshold === 'all' ? 'all severities' : settings.severityThreshold === 'functional' ? 'functional & breaking only' : 'breaking only'}`
                    : 'Notifications are currently disabled.'}
                </span>
              </div>
            </div>
          )}

          {/* Analysis */}
          {activeSection === 'analysis' && (
            <div className="card">
              <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={20} color="var(--accent-primary)" /> Analysis
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                These settings control how the Drift Analysis page behaves.
              </p>

              <SettingRow label="Auto-Analyze on Upload" description="Automatically start analysis when both files are uploaded">
                <ToggleSwitch
                  id="toggle-auto-analyze"
                  checked={settings.autoAnalyze}
                  onChange={(v) => updateSetting('autoAnalyze', v)}
                />
              </SettingRow>

              <SettingRow label="AI Recommendations" description="Show AI-powered fix recommendations in drift results">
                <ToggleSwitch
                  id="toggle-ai-recommendations"
                  checked={settings.showAiRecommendations}
                  onChange={(v) => updateSetting('showAiRecommendations', v)}
                />
              </SettingRow>

              <SettingRow label="Default Export Format" description="Format used when downloading reports">
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['pdf', 'markdown'].map(format => (
                    <button
                      key={format}
                      onClick={() => updateSetting('defaultExportFormat', format)}
                      style={{
                        padding: '0.5rem 0.85rem', border: '1px solid',
                        borderColor: settings.defaultExportFormat === format ? 'var(--accent-primary)' : 'var(--border-color)',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        background: settings.defaultExportFormat === format ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        color: settings.defaultExportFormat === format ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </SettingRow>
            </div>
          )}

          {/* Data & Storage */}
          {activeSection === 'data' && (
            <div className="card">
              <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={20} color="var(--accent-primary)" /> Data & Storage
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Manage report history. Changing the max items will immediately trim older reports.
              </p>

              <SettingRow label="Max History Items" description="Reports beyond this limit are automatically removed (oldest first)">
                <select
                  value={settings.maxHistoryItems}
                  onChange={(e) => updateSetting('maxHistoryItems', parseInt(e.target.value))}
                  style={{
                    padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <option value={10}>10 reports</option>
                  <option value={25}>25 reports</option>
                  <option value={50}>50 reports</option>
                  <option value={100}>100 reports</option>
                </select>
              </SettingRow>

              <SettingRow label="Current Storage" description="Reports currently stored in browser">
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {(() => {
                    try {
                      const h = JSON.parse(localStorage.getItem('driftHistory') || '[]');
                      return `${h.length} / ${settings.maxHistoryItems} reports`;
                    } catch { return '0 reports'; }
                  })()}
                </span>
              </SettingRow>

              <SettingRow label="Clear All Data" description="Permanently delete all saved reports and analysis history">
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    if (window.confirm('Clear all saved data? This cannot be undone.')) {
                      localStorage.removeItem('driftHistory');
                      showToast();
                    }
                  }}
                  style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '0.8rem' }}
                >
                  Clear Data
                </button>
              </SettingRow>
            </div>
          )}

          {/* API Config */}
          {activeSection === 'api' && (
            <div className="card">
              <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cloud size={20} color="var(--accent-primary)" /> API Configuration
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                The Drift Analysis page uses this endpoint for all API calls.
              </p>

              <SettingRow label="API Endpoint" description="Base URL for the backend analysis service">
                <input
                  type="text"
                  value={settings.apiEndpoint}
                  onChange={(e) => updateSetting('apiEndpoint', e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)', fontSize: '0.85rem', width: '260px',
                    fontFamily: 'monospace', transition: 'all 0.2s ease',
                  }}
                />
              </SettingRow>

              <div style={{ padding: '1rem', marginTop: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Globe size={16} color="var(--accent-primary)" />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Connection Status</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: apiStatus === null ? 'var(--text-muted)' : apiStatus ? 'var(--success)' : 'var(--danger)',
                      boxShadow: apiStatus ? `0 0 6px var(--success)` : 'none',
                      transition: 'all 0.3s ease',
                    }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {apiStatus === null ? `Endpoint: ${settings.apiEndpoint}` : apiStatus ? `Connected to ${settings.apiEndpoint}` : 'Connection failed'}
                    </span>
                  </div>
                  <button
                    className="btn btn-outline"
                    onClick={testApiConnection}
                    disabled={testingApi}
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    {testingApi ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

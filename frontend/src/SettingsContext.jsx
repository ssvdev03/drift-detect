import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const defaultSettings = {
  theme: 'dark',
  accentColor: '#3b82f6',
  notifications: true,
  autoAnalyze: false,
  maxHistoryItems: 50,
  defaultExportFormat: 'pdf',
  showAiRecommendations: true,
  severityThreshold: 'all',
  apiEndpoint: 'http://127.0.0.1:8000',
  compactView: false,
};

// Generate a secondary/lighter shade from a hex color
function hexToHSL(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function generateAccentSecondary(hex) {
  const hsl = hexToHSL(hex);
  // Shift hue by +30 for a complementary accent
  const newH = (hsl.h + 30) % 360;
  return `hsl(${newH}, ${hsl.s}%, ${hsl.l}%)`;
}

function generateAccentGlow(hex) {
  // 50% opacity version for glow effect
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `0 0 15px rgba(${r}, ${g}, ${b}, 0.5)`;
}

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('appSettings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Apply all visual settings to the DOM
  const applySettings = useCallback((s) => {
    const root = document.documentElement;

    // ── Theme ──
    const effectiveTheme = s.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : s.theme;

    root.setAttribute('data-theme', effectiveTheme);

    if (effectiveTheme === 'light') {
      root.style.setProperty('--bg-primary', '#f8fafc');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--bg-card', '#ffffff');
      root.style.setProperty('--bg-hover', '#f1f5f9');
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-secondary', '#475569');
      root.style.setProperty('--text-muted', '#94a3b8');
      root.style.setProperty('--border-color', '#e2e8f0');
    } else {
      root.style.setProperty('--bg-primary', '#0f172a');
      root.style.setProperty('--bg-secondary', '#1e293b');
      root.style.setProperty('--bg-card', '#1e293b');
      root.style.setProperty('--bg-hover', '#334155');
      root.style.setProperty('--text-primary', '#f8fafc');
      root.style.setProperty('--text-secondary', '#94a3b8');
      root.style.setProperty('--text-muted', '#64748b');
      root.style.setProperty('--border-color', '#334155');
    }

    // ── Accent Color ──
    const accent = s.accentColor || '#3b82f6';
    const secondary = generateAccentSecondary(accent);
    root.style.setProperty('--accent-primary', accent);
    root.style.setProperty('--accent-secondary', secondary);
    root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${accent}, ${secondary})`);
    root.style.setProperty('--shadow-glow', generateAccentGlow(accent));

    // ── Compact View ──
    if (s.compactView) {
      root.style.setProperty('--spacing-base', '0.75rem');
      root.style.setProperty('--card-padding', '1rem');
      root.style.setProperty('--grid-gap', '1rem');
      root.style.setProperty('--stat-value-size', '1.5rem');
    } else {
      root.style.setProperty('--spacing-base', '1.5rem');
      root.style.setProperty('--card-padding', '1.5rem');
      root.style.setProperty('--grid-gap', '1.5rem');
      root.style.setProperty('--stat-value-size', '2rem');
    }
  }, []);

  // Apply on mount and whenever settings change
  useEffect(() => {
    applySettings(settings);
  }, [settings, applySettings]);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (settings.theme === 'system') applySettings(settings);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings, applySettings]);

  // Enforce max history items whenever the setting changes
  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('driftHistory') || '[]');
      if (history.length > settings.maxHistoryItems) {
        localStorage.setItem('driftHistory', JSON.stringify(history.slice(0, settings.maxHistoryItems)));
      }
    } catch { /* ignore */ }
  }, [settings.maxHistoryItems]);

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('appSettings', JSON.stringify(next));
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem('appSettings', JSON.stringify(defaultSettings));
  };

  // Send browser notification if enabled
  const sendNotification = useCallback((title, body, severity) => {
    if (!settings.notifications) return;

    // Check severity threshold
    const severityLevels = { cosmetic: 0, functional: 1, breaking: 2 };
    const thresholdMap = { all: 0, functional: 1, breaking: 2 };
    const minLevel = thresholdMap[settings.severityThreshold] || 0;
    const driftLevel = severityLevels[severity?.toLowerCase()] ?? 0;

    if (driftLevel < minLevel) return;

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/vite.svg' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            new Notification(title, { body, icon: '/vite.svg' });
          }
        });
      }
    }
  }, [settings.notifications, settings.severityThreshold]);

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSetting,
      resetSettings,
      sendNotification,
      defaultSettings,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export { defaultSettings };

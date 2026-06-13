import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, FileJson, AlertCircle, ArrowRight, Download, PlayCircle, Loader2 } from 'lucide-react';
import { useSettings } from '../SettingsContext';

const SeverityBadge = ({ type }) => {
  const className = `badge badge-${type.toLowerCase()}`;
  return <span className={className}>{type}</span>;
};

export default function DriftAnalysis() {
  const { settings, sendNotification } = useSettings();

  const [intendedFile, setIntendedFile] = useState(null);
  const [actualFile, setActualFile] = useState(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileDrop = (e, type) => {
    e.preventDefault();
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (file && (file.name.endsWith('.json') || file.name.endsWith('.yaml') || file.name.endsWith('.yml'))) {
      if (type === 'intended') setIntendedFile(file);
      else setActualFile(file);
    } else {
      alert("Please upload a JSON or YAML file.");
    }
  };

  // Auto-analyze: trigger when both files are uploaded
  useEffect(() => {
    if (settings.autoAnalyze && intendedFile && actualFile && !isAnalyzing && !results) {
      handleAnalyze();
    }
  }, [intendedFile, actualFile, settings.autoAnalyze]);

  const handleAnalyze = async () => {
    if (!intendedFile || !actualFile) {
      setError("Please upload both configuration files.");
      return;
    }
    
    setError(null);
    setIsAnalyzing(true);
    setLoadingStep(1); // Reading files
    
    const formData = new FormData();
    formData.append("intended_file", intendedFile);
    formData.append("actual_file", actualFile);

    try {
      // Simulate steps for UI smoothness
      setTimeout(() => setLoadingStep(2), 1500); // Comparing
      setTimeout(() => setLoadingStep(3), 3000); // AI Analysis

      // Use API endpoint from settings
      const apiUrl = settings.apiEndpoint || 'http://127.0.0.1:8000';

      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
      
      // Save to localStorage (respecting max history setting)
      const maxItems = settings.maxHistoryItems || 50;
      const history = JSON.parse(localStorage.getItem('driftHistory') || '[]');
      history.unshift({
        id: data.result_id,
        date: new Date().toISOString(),
        stats: data.stats,
        intendedFileName: intendedFile.name,
        actualFileName: actualFile.name
      });
      localStorage.setItem('driftHistory', JSON.stringify(history.slice(0, maxItems)));

      // Send browser notification if enabled
      const highestSeverity = data.stats.breaking_count > 0 ? 'breaking'
        : data.stats.functional_count > 0 ? 'functional' : 'cosmetic';
      
      sendNotification(
        'Drift Analysis Complete',
        `Found ${data.stats.total_drifts} drifts: ${data.stats.breaking_count} breaking, ${data.stats.functional_count} functional, ${data.stats.cosmetic_count} cosmetic`,
        highestSeverity
      );
    } catch (err) {
      setError(err.message);
      // Notify on error too
      sendNotification('Analysis Failed', err.message, 'breaking');
    } finally {
      setIsAnalyzing(false);
      setLoadingStep(0);
    }
  };

  const downloadReport = async (format) => {
    if (!results) return;
    const apiUrl = settings.apiEndpoint || 'http://127.0.0.1:8000';
    window.open(`${apiUrl}/api/reports/${format}/${results.result_id}`, '_blank');
  };

  // Use default export format from settings
  const downloadDefaultReport = () => {
    const format = settings.defaultExportFormat === 'markdown' ? 'markdown' : 'pdf';
    downloadReport(format);
  };

  if (results) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <button 
                onClick={() => setResults(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} /> Back
              </button>
              <h1 className="page-title" style={{ marginBottom: 0 }}>Analysis Results</h1>
            </div>
            <p className="page-subtitle">Found {results.stats.total_drifts} drifts between intended and actual configs.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={() => downloadReport('markdown')}>
              <Download size={18} /> MD Report
            </button>
            <button className="btn btn-primary" onClick={() => downloadReport('pdf')}>
              <Download size={18} /> PDF Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
          <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Breaking</h4>
            <span className="stat-value">{results.stats.breaking_count}</span>
          </div>
          <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Functional</h4>
            <span className="stat-value">{results.stats.functional_count}</span>
          </div>
          <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Cosmetic</h4>
            <span className="stat-value">{results.stats.cosmetic_count}</span>
          </div>
        </div>

        <div className="grid grid-cols-1">
          {results.drifts.map((drift, idx) => (
            <div key={idx} className={`card drift-card ${drift.severity.toLowerCase()}`}>
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileJson className="text-blue-500" size={20} />
                  <h3 style={{ fontSize: '1.125rem' }}>{drift.key}</h3>
                </div>
                <SeverityBadge type={drift.severity} />
              </div>
              
              <div className="grid grid-cols-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <span className="stat-title">Old Value</span>
                  <div className="code-block">{drift.old_value}</div>
                </div>
                <div>
                  <span className="stat-title">New Value</span>
                  <div className="code-block">{drift.new_value}</div>
                </div>
              </div>

              {/* AI section — only show if setting is enabled */}
              {settings.showAiRecommendations && (
                <div className="ai-box">
                  <div className="ai-header">
                    <PlayCircle size={16} />
                    <span>AI Analysis</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                    {drift.ai_explanation}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <CheckCircle2 size={16} className="text-green-500" style={{ marginTop: '0.1rem' }} />
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>Recommendation</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{drift.recommendation}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Config Drift Detector</h1>
          <p className="page-subtitle">
            Upload your configuration files to detect and analyze drifts.
            {settings.autoAnalyze && (
              <span style={{ color: 'var(--accent-primary)', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                (Auto-analyze is ON)
              </span>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--danger)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <AlertCircle color="var(--danger)" />
          <span style={{ color: 'var(--danger)' }}>{error}</span>
        </div>
      )}

      {isAnalyzing ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={48} color="var(--accent-primary)" style={{ margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ marginBottom: '1rem' }}>Analyzing Configuration</h2>
          
          <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', opacity: loadingStep >= 1 ? 1 : 0.3 }}>
              {loadingStep > 1 ? <CheckCircle2 color="var(--success)" /> : <div className="animate-pulse" style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />}
              <span>Reading configuration files...</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', opacity: loadingStep >= 2 ? 1 : 0.3 }}>
              {loadingStep > 2 ? <CheckCircle2 color="var(--success)" /> : (loadingStep === 2 ? <div className="animate-pulse" style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} /> : <div style={{ width: '24px', height: '24px' }} />)}
              <span>Comparing deep object structures...</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', opacity: loadingStep >= 3 ? 1 : 0.3 }}>
              {loadingStep > 3 ? <CheckCircle2 color="var(--success)" /> : (loadingStep === 3 ? <div className="animate-pulse" style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} /> : <div style={{ width: '24px', height: '24px' }} />)}
              <span>Running AI analysis with Gemini...</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
          <div 
            className={`upload-area ${intendedFile ? 'active' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleFileDrop(e, 'intended')}
          >
            <input type="file" className="upload-input" onChange={(e) => handleFileDrop(e, 'intended')} accept=".json,.yaml,.yml" />
            <UploadCloud className="upload-icon" style={{ margin: '0 auto 1rem auto' }} />
            <h3 className="upload-text">{intendedFile ? intendedFile.name : 'Intended Configuration'}</h3>
            <p className="upload-subtext">Drag & drop or click to upload JSON/YAML</p>
          </div>

          <div 
            className={`upload-area ${actualFile ? 'active' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleFileDrop(e, 'actual')}
          >
            <input type="file" className="upload-input" onChange={(e) => handleFileDrop(e, 'actual')} accept=".json,.yaml,.yml" />
            <UploadCloud className="upload-icon" style={{ margin: '0 auto 1rem auto' }} />
            <h3 className="upload-text">{actualFile ? actualFile.name : 'Actual Configuration'}</h3>
            <p className="upload-subtext">Drag & drop or click to upload JSON/YAML</p>
          </div>
        </div>
      )}

      {!isAnalyzing && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.75rem 2rem', fontSize: '1.125rem' }}
            onClick={handleAnalyze}
            disabled={!intendedFile || !actualFile}
          >
            Analyze Drift <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

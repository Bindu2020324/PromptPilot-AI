/**
 * BackupControls.jsx
 *
 * Drop-in UI component for Export / Import prompt backup.
 * Designed to work inside both the Settings popup and any in-page modal.
 *
 * Usage:
 *   import BackupControls from './BackupControls';
 *   <BackupControls />
 */

import { useState, useRef } from 'react';
import { exportPrompts, importPrompts } from './promptBackup';

export default function BackupControls() {
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message: string }
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importMode, setImportMode] = useState('merge'); // 'merge' | 'overwrite'
  const fileInputRef = useRef(null);

  // ── Export ────────────────────────────────────────────────────────────────

  async function handleExport() {
    setExporting(true);
    setStatus(null);
    const result = await exportPrompts();
    setStatus({ type: result.success ? 'success' : 'error', message: result.message });
    setExporting(false);
  }

  // ── Import ────────────────────────────────────────────────────────────────

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setStatus(null);

    const result = await importPrompts(file, importMode);
    setStatus({ type: result.success ? 'success' : 'error', message: result.message });

    // Reset file input so the same file can be re-imported if needed
    e.target.value = '';
    setImporting(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>🗂️ Prompt Backup</h3>
      <p style={styles.subtext}>
        Export your saved prompts to a JSON file, or restore them from a previous backup.
      </p>

      {/* Export */}
      <button
        style={{ ...styles.btn, ...styles.btnExport }}
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? '⏳ Exporting…' : '⬇️ Export Prompts'}
      </button>

      {/* Import mode selector */}
      <div style={styles.modeRow}>
        <span style={styles.modeLabel}>Import mode:</span>
        <label style={styles.radioLabel}>
          <input
            type="radio"
            name="importMode"
            value="merge"
            checked={importMode === 'merge'}
            onChange={() => setImportMode('merge')}
          />
          &nbsp;Merge <span style={styles.modeHint}>(keep existing, skip duplicates)</span>
        </label>
        <label style={styles.radioLabel}>
          <input
            type="radio"
            name="importMode"
            value="overwrite"
            checked={importMode === 'overwrite'}
            onChange={() => setImportMode('overwrite')}
          />
          &nbsp;Overwrite <span style={styles.modeHint}>(replace duplicates)</span>
        </label>
      </div>

      {/* Import */}
      <button
        style={{ ...styles.btn, ...styles.btnImport }}
        onClick={handleImportClick}
        disabled={importing}
      >
        {importing ? '⏳ Importing…' : '⬆️ Import Prompts'}
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Status notification */}
      {status && (
        <div
          style={{
            ...styles.notification,
            ...(status.type === 'success' ? styles.notifSuccess : styles.notifError),
          }}
        >
          {status.type === 'success' ? '✅' : '❌'} {status.message}
        </div>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
// Inline styles so the component works without any extra CSS file.
// Override via className props or a parent stylesheet as needed.

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '14px 16px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    marginTop: '12px',
  },
  heading: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: 'inherit',
  },
  subtext: {
    margin: 0,
    fontSize: '12px',
    opacity: 0.65,
    lineHeight: 1.4,
  },
  btn: {
    padding: '9px 14px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'opacity 0.15s',
  },
  btnExport: {
    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
    color: '#fff',
  },
  btnImport: {
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
  },
  modeRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
  },
  modeLabel: {
    fontWeight: 600,
    opacity: 0.8,
    marginBottom: '2px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    gap: '2px',
  },
  modeHint: {
    opacity: 0.55,
    fontSize: '11px',
  },
  notification: {
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  notifSuccess: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: '#10b981',
  },
  notifError: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    color: '#ef4444',
  },
};

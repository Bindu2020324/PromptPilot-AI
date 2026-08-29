// ═══════════════════════════════════════════════════════════════════════
// Version History UI Components
// Enhanced with Git-like Diffs, A/B Testing Interfaces, and JSON Exports
// ═══════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { versioningService } from './versioningService';

/**
 * TextDiffHighlighter - Renders basic character or word diff markers inline
 */
function TextDiffHighlighter({ oldText = '', newText = '' }) {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);
  let oldIdx = 0, newIdx = 0;
  const elements = [];
  let keyCounter = 0;

  while (oldIdx < oldWords.length || newIdx < newWords.length) {
    if (oldIdx < oldWords.length && newIdx < newWords.length && oldWords[oldIdx] === newWords[newIdx]) {
      elements.push(<span key={keyCounter++}>{oldWords[oldIdx]}</span>);
      oldIdx++;
      newIdx++;
    } else if (newIdx < newWords.length) {
      elements.push(
        <span key={keyCounter++} style={{ backgroundColor: 'rgba(52,211,153,0.25)', color: '#34d399', padding: '0 2px', borderRadius: 2 }}>
          {newWords[newIdx]}
        </span>
      );
      newIdx++;
    } else {
      elements.push(
        <span key={keyCounter++} style={{ backgroundColor: 'rgba(239,68,68,0.25)', color: '#f87171', textDecoration: 'line-through', padding: '0 2px', borderRadius: 2 }}>
          {oldWords[oldIdx]}
        </span>
      );
      oldIdx++;
    }
  }

  return <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 11, lineHeight: 1.6 }}>{elements}</div>;
}

/**
 * VersionCard - Displays a single version with actions and performance tracking metrics
 */
export function VersionCard({
  version,
  promptId,
  onRestore,
  onCompare,
  isLatest,
  onSelectForAB,
  abSelectedSide
}) {
  const createdDate = new Date(version.created_at);
  const dateStr = createdDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: createdDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
  const timeStr = createdDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div
      style={{
        background: isLatest ? 'rgba(124,58,237,0.06)' : 'var(--bg-tertiary)',
        border: isLatest ? '1.5px solid rgba(124,58,237,0.4)' : '1px solid var(--border-color)',
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              background: isLatest ? 'rgba(124,58,237,0.3)' : 'rgba(107,114,128,0.3)',
              color: isLatest ? '#a78bfa' : '#9ca3af',
              padding: '3px 8px',
              borderRadius: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            v{version.version_number} {isLatest && ' · LATEST'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
            {dateStr} at {timeStr}
          </span>
        </div>
        <span style={{ fontSize: 9, color: 'var(--text-very-faint)', fontStyle: 'italic' }}>
          {version.provider}
        </span>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
        {version.change_note}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 9, color: 'var(--text-faint)' }}>Clarity {version.clarity_score}</span>
          <span style={{ fontSize: 9, color: 'var(--text-faint)' }}>Quality {version.quality_score}</span>
          <span style={{ fontSize: 9, color: '#3b82f6', fontWeight: 600 }}>Choice Wins: {version.performance_score || 0}</span>
        </div>
        
        {/* A/B Target Selection Badges */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button 
            onClick={() => onSelectForAB(version.version_number, 'A')}
            style={{
              fontSize: 8, padding: '2px 6px', borderRadius: 4, cursor: 'pointer',
              border: abSelectedSide === 'A' ? '1px solid #a855f7' : '1px solid var(--border-color)',
              background: abSelectedSide === 'A' ? 'rgba(168,85,247,0.2)' : 'transparent',
              color: abSelectedSide === 'A' ? '#c084fc' : 'var(--text-faint)'
            }}
          >
            Set A
          </button>
          <button 
            onClick={() => onSelectForAB(version.version_number, 'B')}
            style={{
              fontSize: 8, padding: '2px 6px', borderRadius: 4, cursor: 'pointer',
              border: abSelectedSide === 'B' ? '1px solid #2563eb' : '1px solid var(--border-color)',
              background: abSelectedSide === 'B' ? 'rgba(37,99,235,0.2)' : 'transparent',
              color: abSelectedSide === 'B' ? '#60a5fa' : 'var(--text-faint)'
            }}
          >
            Set B
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {!isLatest && (
          <button
            onClick={() => onRestore(version.version_number)}
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 7, border: '1px solid rgba(34,197,94,0.3)',
              background: 'rgba(34,197,94,0.08)', color: '#22c55e', fontSize: 10, fontWeight: 600, cursor: 'pointer'
            }}
          >
            ↻ Restore
          </button>
        )}
        <button
          onClick={() => onCompare(version.version_number)}
          style={{
            flex: 1, padding: '6px 10px', borderRadius: 7, border: '1px solid rgba(168,85,247,0.3)',
            background: 'rgba(168,85,247,0.08)', color: '#a855f7', fontSize: 10, fontWeight: 600, cursor: 'pointer'
          }}
        >
          ⊙ Diff View
        </button>
      </div>
    </div>
  );
}

/**
 * VersionHistoryPanel - Shows all versions of a prompt with integrated action toolsets
 */
export function VersionHistoryPanel({ prompt, onRestore, onCompare, onBack }) {
  const [localPrompt, setLocalPrompt] = useState(prompt);
  const [abA, setAbA] = useState(null);
  const [abB, setAbB] = useState(null);
  const [isTestingMode, setIsTestingMode] = useState(false);

  const versions = localPrompt.versions || [];
  const latestVersion = versions[0];

  const handleSelectForAB = (versionNum, side) => {
    if (side === 'A') setAbA(versionNum);
    if (side === 'B') setAbB(versionNum);
  };

  const triggerExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(versions, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `prompt-${localPrompt.id}-history.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Header Panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}>←</button>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Timeline Timeline</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={triggerExport} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: 10, cursor: 'pointer' }}>
            📥 Export JSON
          </button>
          <span style={{ fontSize: 10, color: '#a78bfa', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
            {versions.length} versions
          </span>
        </div>
      </div>

      {/* A/B Action Launchpad Controller */}
      {abA && abB && (
        <div style={{ padding: '10px 16px', background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Ready to test: <strong>v{abA}</strong> vs <strong>v{abB}</strong>
          </span>
          <button 
            onClick={() => setIsTestingMode(true)}
            style={{ padding: '5px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            Launch A/B Test Sandbox
          </button>
        </div>
      )}

      {isTestingMode ? (
        <DiffView 
          version1={versions.find(v => v.version_number === abA)} 
          version2={versions.find(v => v.version_number === abB)} 
          promptId={localPrompt.id}
          onClose={() => setIsTestingMode(false)}
          isABMode={true}
          onVote={async (vNum) => {
            const updated = await versioningService.recordABChoice(localPrompt.id, vNum);
            setLocalPrompt(updated);
            setIsTestingMode(false);
          }}
        />
      ) : (
        <>
          {/* Original Preview */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 8, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Original Prompt</span>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5, wordBreak: 'break-word' }}>
              {localPrompt.original_text}
            </div>
          </div>

          {/* Versions List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {versions.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 12, marginTop: 48 }}>No versions yet</div>
            ) : (
              versions.map((version) => (
                <VersionCard
                  key={version.version_number}
                  version={version}
                  promptId={localPrompt.id}
                  onRestore={onRestore}
                  onCompare={onCompare}
                  isLatest={version === latestVersion}
                  onSelectForAB={handleSelectForAB}
                  abSelectedSide={abA === version.version_number ? 'A' : abB === version.version_number ? 'B' : null}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * DiffView - Side-by-side comparison with inline split and choice collection matrices
 */
export function DiffView({ version1, version2, promptId, onClose, isABMode = false, onVote }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Dynamic Title Headers */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}>←</button>
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {isABMode ? `🚀 Live A/B Experimentation Suite` : `Visual Diff Explorer`}
          </span>
        </div>
      </div>

      {/* Main Container Workspace splits */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Card Area */}
        <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 700 }}>VARIANT A (v{version1.version_number})</span>
            {isABMode && (
              <button onClick={() => onVote(version1.version_number)} style={{ padding: '4px 10px', background: 'rgba(168,85,247,0.15)', border: '1px solid #a855f7', color: '#c084fc', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                👍 Choose Variant A
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
            <TextDiffHighlighter oldText={version2.enhanced_prompt} newText={version1.enhanced_prompt} />
          </div>
        </div>

        {/* Right Card Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700 }}>VARIANT B (v{version2.version_number})</span>
            {isABMode && (
              <button onClick={() => onVote(version2.version_number)} style={{ padding: '4px 10px', background: 'rgba(59,130,246,0.15)', border: '1px solid #3b82f6', color: '#60a5fa', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                👍 Choose Variant B
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
            <TextDiffHighlighter oldText={version1.enhanced_prompt} newText={version2.enhanced_prompt} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PromptsList - Lists all base entities tracking current iteration versions
 */
export function PromptsList({ prompts, onSelectPrompt, onClearAll, onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}>←</button>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Saved Playgrounds</span>
          <span style={{ fontSize: 10, color: '#a78bfa', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{prompts.length}</span>
        </div>
        {prompts.length > 0 && (
          <button onClick={onClearAll} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7, padding: '3px 10px', fontSize: 11, color: 'var(--accent-red)', cursor: 'pointer' }}>
            Clear all
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {prompts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 12, marginTop: 48, lineHeight: 1.8 }}>
            No prompts found yet.<br />Enhance prompt strings to compile dynamic timelines.
          </div>
        ) : (
          prompts.map((prompt) => {
            const latestVersion = prompt.versions?.[0];
            if (!latestVersion) return null;

            return (
              <button
                key={prompt.id}
                onClick={() => onSelectPrompt(prompt)}
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 12px', textAlign: 'left', width: '100%', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 9, color: 'var(--text-faint)', marginBottom: 4 }}>
                  {prompt.domain || '—'} · {prompt.mode} · {new Date(prompt.updated_at).toLocaleDateString()} · <span style={{ color: '#a78bfa' }}>{prompt.versions.length} versions</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>
                  {prompt.original_text}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 10, color: '#a78bfa' }}>Clarity {latestVersion.clarity_score}</span>
                  <span style={{ fontSize: 10, color: '#34d399' }}>Quality {latestVersion.quality_score}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

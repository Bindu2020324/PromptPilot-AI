// ═══════════════════════════════════════════════════════════════════════
// Version History UI Components
// ═══════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';

/**
 * VersionCard - Displays a single version with actions
 */
export function VersionCard({ version, promptId, onRestore, onCompare, isLatest }) {
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
        background: isLatest ? 'rgba(124,58,237,0.1)' : 'var(--bg-tertiary)',
        border: isLatest ? '1.5px solid rgba(124,58,237,0.4)' : '1px solid var(--border-color)',
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Header with version badge and date */}
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
            v{version.version_number}
            {isLatest && ' · LATEST'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
            {dateStr} at {timeStr}
          </span>
        </div>
        <span style={{ fontSize: 9, color: 'var(--text-very-faint)', fontStyle: 'italic' }}>
          {version.provider}
        </span>
      </div>

      {/* Change note */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
        {version.change_note}
      </div>

      {/* Scores */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 3,
                height: 12,
                background: '#a78bfa',
                borderRadius: 1,
              }}
            />
            <span style={{ fontSize: 9, color: 'var(--text-faint)' }}>
              Clarity {version.clarity_score}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 3,
                height: 12,
                background: '#34d399',
                borderRadius: 1,
              }}
            />
            <span style={{ fontSize: 9, color: 'var(--text-faint)' }}>
              Quality {version.quality_score}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6 }}>
        {!isLatest && (
          <button
            onClick={() => onRestore(version.version_number)}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 7,
              border: '1px solid rgba(34,197,94,0.3)',
              background: 'rgba(34,197,94,0.08)',
              color: '#22c55e',
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(34,197,94,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(34,197,94,0.08)';
            }}
          >
            ↻ Restore
          </button>
        )}
        <button
          onClick={() => onCompare(version.version_number)}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: 7,
            border: '1px solid rgba(168,85,247,0.3)',
            background: 'rgba(168,85,247,0.08)',
            color: '#a855f7',
            fontSize: 10,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(168,85,247,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(168,85,247,0.08)';
          }}
        >
          ⊙ Compare
        </button>
      </div>
    </div>
  );
}

/**
 * VersionHistoryPanel - Shows all versions of a prompt
 */
export function VersionHistoryPanel({
  prompt,
  onRestore,
  onCompare,
  onBack,
}) {
  const versions = prompt.versions || [];
  const latestVersion = versions[0];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 16px',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 18,
              padding: 0,
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            ←
          </button>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Version History</span>
        </div>
        <span
          style={{
            fontSize: 10,
            color: '#a78bfa',
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
            padding: '2px 8px',
            borderRadius: 12,
            fontWeight: 600,
          }}
        >
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Original text preview */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: 8, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
          Original Prompt
        </span>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            marginTop: 4,
            lineHeight: 1.5,
            wordBreak: 'break-word',
          }}
        >
          {prompt.original_text}
        </div>
      </div>

      {/* Versions list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {versions.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-faint)',
              fontSize: 12,
              marginTop: 48,
            }}
          >
            No versions yet
          </div>
        ) : (
          versions.map((version) => (
            <VersionCard
              key={version.version_number}
              version={version}
              promptId={prompt.id}
              onRestore={onRestore}
              onCompare={onCompare}
              isLatest={version === latestVersion}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * DiffView - Side-by-side comparison of two versions
 */
export function DiffView({ version1, version2, onClose }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 16px',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 18,
              padding: 0,
              cursor: 'pointer',
            }}
          >
            ←
          </button>
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            Compare v{version1.version_number} vs v{version2.version_number}
          </span>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Left side - Version 1 */}
        <div
          style={{
            flex: 1,
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 9, color: '#a78bfa', fontWeight: 700 }}>
              v{version1.version_number}
            </span>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 14px',
              fontSize: 10,
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
            }}
          >
            {version1.enhanced_prompt}
          </div>
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>
              Clarity: {version1.clarity_score} | Quality: {version1.quality_score}
            </div>
          </div>
        </div>

        {/* Right side - Version 2 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 9, color: '#a855f7', fontWeight: 700 }}>
              v{version2.version_number} · LATEST
            </span>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 14px',
              fontSize: 10,
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
            }}
          >
            {version2.enhanced_prompt}
          </div>
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>
              Clarity: {version2.clarity_score} | Quality: {version2.quality_score}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PromptsList - Lists all prompts with their latest versions
 */
export function PromptsList({
  prompts,
  onSelectPrompt,
  onClearAll,
  onBack,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 16px',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 18,
              padding: 0,
              cursor: 'pointer',
            }}
          >
            ←
          </button>
          <span style={{ fontSize: 14, fontWeight: 700 }}>History</span>
          <span
            style={{
              fontSize: 10,
              color: '#a78bfa',
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.3)',
              padding: '2px 8px',
              borderRadius: 12,
              fontWeight: 600,
            }}
          >
            {prompts.length}
          </span>
        </div>
        {prompts.length > 0 && (
          <button
            onClick={onClearAll}
            style={{
              background: 'none',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 7,
              padding: '3px 10px',
              fontSize: 11,
              color: 'var(--accent-red)',
              cursor: 'pointer',
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Prompts list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {prompts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-faint)',
              fontSize: 12,
              marginTop: 48,
              lineHeight: 1.8,
            }}
          >
            No prompts yet.
            <br />
            Enhance some prompts first.
          </div>
        ) : (
          prompts.map((prompt) => {
            const latestVersion = prompt.versions?.[0];
            if (!latestVersion) return null;

            return (
              <button
                key={prompt.id}
                onClick={() => onSelectPrompt(prompt)}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                }}
              >
                <div style={{ fontSize: 9, color: 'var(--text-faint)', marginBottom: 4 }}>
                  {prompt.domain || '—'} · {prompt.mode} ·{' '}
                  {new Date(prompt.updated_at).toLocaleDateString()} ·{' '}
                  <span style={{ color: '#a78bfa' }}>
                    {prompt.versions.length} version{prompt.versions.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: 5,
                  }}
                >
                  {prompt.original_text}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 10, color: '#a78bfa' }}>
                    Clarity {latestVersion.clarity_score}
                  </span>
                  <span style={{ fontSize: 10, color: '#34d399' }}>
                    Quality {latestVersion.quality_score}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

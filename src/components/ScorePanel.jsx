import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DIMENSIONS,
  GRADES,
  getGrade,
  scorePrompt,
  compareScores,
} from '../scoring/PromptScorer';

// ── Radar Chart (Canvas-based) ────────────────────────────────────────
function RadarChart({ scores, size = 200, animated = true }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [progress, setProgress] = useState(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) {
      setProgress(1);
      return;
    }
    setProgress(0);
    let start = null;
    const duration = 900;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      if (p < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [scores, animated]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2,
      cy = size / 2;
    const radius = size * 0.38;
    const dims = DIMENSIONS;
    const n = dims.length;
    const angleStep = (Math.PI * 2) / n;
    const startAngle = -Math.PI / 2;

    // Grid rings
    [0.25, 0.5, 0.75, 1].forEach((ring) => {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = startAngle + i * angleStep;
        const x = cx + Math.cos(angle) * radius * ring;
        const y = cy + Math.sin(angle) * radius * ring;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Axis lines
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Data polygon
    const values = dims.map(
      (d) => ((scores?.[d.id]?.score || 0) / 100) * progress
    );
    ctx.beginPath();
    values.forEach((v, i) => {
      const angle = startAngle + i * angleStep;
      const x = cx + Math.cos(angle) * radius * v;
      const y = cy + Math.sin(angle) * radius * v;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();

    // Gradient fill
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, 'rgba(124,58,237,0.35)');
    grad.addColorStop(1, 'rgba(99,102,241,0.12)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(124,58,237,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Data points + labels
    values.forEach((v, i) => {
      const angle = startAngle + i * angleStep;
      const x = cx + Math.cos(angle) * radius * v;
      const y = cy + Math.sin(angle) * radius * v;

      // Glow dot
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = dims[i].color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = dims[i].color + '33';
      ctx.fill();

      // Label
      const lx = cx + Math.cos(angle) * (radius + 18);
      const ly = cy + Math.sin(angle) * (radius + 18);
      ctx.font = '600 8px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dims[i].label.split(' ')[0], lx, ly);
    });
  }, [scores, size, progress]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: 'block', margin: '0 auto' }}
    />
  );
}

// ── Grade Badge ───────────────────────────────────────────────────────
function GradeBadge({ grade, overall, animated = true }) {
  const [show, setShow] = useState(!animated);
  useEffect(() => {
    if (!animated) return;
    const t = setTimeout(() => setShow(true), 400);
    return () => clearTimeout(t);
  }, [grade, animated]);

  const g = grade || GRADES[GRADES.length - 1];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        opacity: show ? 1 : 0,
        transform: show ? 'scale(1)' : 'scale(0.5)',
        transition: 'all 0.5s cubic-bezier(.4,0,.2,1)',
      }}
    >
      <div
        style={{
          fontSize: 42,
          fontWeight: 900,
          color: g.color,
          lineHeight: 1,
          textShadow: `0 0 30px ${g.glow}, 0 0 60px ${g.glow}`,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        {g.letter}
      </div>
      <div
        style={{ fontSize: 10, color: g.color, fontWeight: 600, opacity: 0.8 }}
      >
        {g.label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginTop: 2,
        }}
      >
        {overall}
        <span
          style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 400 }}
        >
          /100
        </span>
      </div>
    </div>
  );
}

// ── Dimension Bar ─────────────────────────────────────────────────────
function DimensionBar({ dim, score, expanded, onToggle, tips }) {
  const pct = Math.min(100, Math.max(0, score || 0));
  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '5px 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: dim.color,
            width: 14,
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          {dim.icon}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            width: 80,
            flexShrink: 0,
            letterSpacing: '0.02em',
          }}
        >
          {dim.label}
        </span>
        <div
          style={{
            flex: 1,
            height: 4,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 99,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: pct + '%',
              borderRadius: 99,
              background: `linear-gradient(90deg, ${dim.color}88, ${dim.color})`,
              transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
            }}
          />
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: dim.color,
            width: 24,
            textAlign: 'right',
          }}
        >
          {pct}
        </span>
        <span
          style={{
            fontSize: 8,
            color: 'var(--text-faint)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }}
        >
          ▼
        </span>
      </button>
      {expanded && tips && tips.length > 0 && (
        <div
          style={{
            padding: '6px 8px 8px 30px',
            animation: 'fadeUp 0.2s ease',
          }}
        >
          {tips.map((tip, i) => (
            <div
              key={i}
              style={{
                fontSize: 10,
                color: 'var(--text-faint)',
                lineHeight: 1.6,
                padding: '2px 0',
                display: 'flex',
                gap: 6,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ color: dim.color, flexShrink: 0 }}>→</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────
export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = '#a78bfa',
}) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length < 2) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const pad = 3;

    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * stepX;
      const y = pad + (height - 2 * pad) * (1 - (v - min) / range);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Gradient fill
    const lastX = (data.length - 1) * stepX;
    ctx.lineTo(lastX, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, color + '33');
    grad.addColorStop(1, color + '05');
    ctx.fillStyle = grad;
    ctx.fill();
  }, [data, width, height, color]);

  if (!data || data.length < 2) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 8,
          color: 'var(--text-faint)',
        }}
      >
        —
      </div>
    );
  }
  return <canvas ref={canvasRef} style={{ width, height, display: 'block' }} />;
}

// ── Before/After Comparison ───────────────────────────────────────────
function ScoreComparison({ original, enhanced }) {
  if (!original || !enhanced) return null;
  const comp = compareScores(original, enhanced);
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 11,
        padding: '12px 14px',
        animation: 'fadeUp 0.3s ease',
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: 'var(--text-faint)',
          textTransform: 'uppercase',
          marginBottom: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Score Comparison</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399' }}>
          +{Math.max(0, comp.enhanced.overall - comp.original.overall)} pts
        </span>
      </div>
      {comp.improvements.map((imp) => (
        <div
          key={imp.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '3px 0',
          }}
        >
          <span
            style={{ fontSize: 9, color: imp.color, width: 75, flexShrink: 0 }}
          >
            {imp.label}
          </span>
          <span
            style={{
              fontSize: 10,
              color: 'var(--text-faint)',
              width: 22,
              textAlign: 'right',
            }}
          >
            {imp.before}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>→</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: imp.color,
              width: 22,
            }}
          >
            {imp.after}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              padding: '1px 5px',
              borderRadius: 10,
              color:
                imp.delta > 0
                  ? '#34d399'
                  : imp.delta < 0
                    ? '#f87171'
                    : 'var(--text-faint)',
              background:
                imp.delta > 0
                  ? 'rgba(52,211,153,0.1)'
                  : imp.delta < 0
                    ? 'rgba(248,113,113,0.1)'
                    : 'transparent',
            }}
          >
            {imp.delta > 0 ? '+' : ''}
            {imp.delta}
          </span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN SCORE PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function ScorePanel({ promptText, enhancedText, onBack }) {
  const [scoreData, setScoreData] = useState(null);
  const [expandedDim, setExpandedDim] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (promptText) {
      const data = scorePrompt(promptText);
      setScoreData(data);
    }
  }, [promptText]);

  if (!scoreData) {
    return (
      <div
        style={{
          padding: 18,
          textAlign: 'center',
          color: 'var(--text-faint)',
          fontSize: 12,
        }}
      >
        Enter a prompt to see scoring analysis.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 14px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-header)',
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
              padding: '0 4px 0 0',
              cursor: 'pointer',
            }}
          >
            ←
          </button>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Prompt Score</span>
          <span
            style={{
              fontSize: 9,
              color: scoreData.grade.color,
              background: scoreData.grade.color + '18',
              border: `1px solid ${scoreData.grade.color}44`,
              padding: '2px 7px',
              borderRadius: 20,
              fontWeight: 700,
            }}
          >
            {scoreData.grade.letter}-Rank
          </span>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Radar + Grade */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '8px 0',
          }}
        >
          <RadarChart scores={scoreData.dimensions} size={160} />
          <GradeBadge grade={scoreData.grade} overall={scoreData.overall} />
        </div>

        {/* Dimension Breakdown */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 11,
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Dimension Breakdown
          </div>
          {DIMENSIONS.map((dim) => (
            <DimensionBar
              key={dim.id}
              dim={dim}
              score={scoreData.dimensions[dim.id]?.score}
              tips={scoreData.dimensions[dim.id]?.tips}
              expanded={expandedDim === dim.id}
              onToggle={() =>
                setExpandedDim(expandedDim === dim.id ? null : dim.id)
              }
            />
          ))}
        </div>

        {/* Improvement Tips */}
        {scoreData.tips.length > 0 && (
          <div
            style={{
              background: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.18)',
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'var(--text-faint)',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              💡 Top Improvements
            </div>
            {scoreData.tips.map((tip, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                  padding: '4px 0',
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    fontSize: 8,
                    color: tip.color,
                    background: tip.color + '18',
                    border: `1px solid ${tip.color}33`,
                    padding: '2px 6px',
                    borderRadius: 10,
                    flexShrink: 0,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tip.dimension}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {tip.tip}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Before/After Comparison */}
        {enhancedText && (
          <>
            <button
              onClick={() => setShowComparison(!showComparison)}
              style={{
                padding: '8px 12px',
                borderRadius: 9,
                border: '1px solid rgba(52,211,153,0.25)',
                background: 'rgba(52,211,153,0.06)',
                color: '#34d399',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {showComparison ? '▲ Hide' : '▼ Show'} Before / After Comparison
            </button>
            {showComparison && (
              <ScoreComparison original={promptText} enhanced={enhancedText} />
            )}
          </>
        )}

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}

// ── Mini Score Badge (inline, for embedding in main view) ─────────────
export function MiniScoreBadge({ text }) {
  const [score, setScore] = useState(null);
  useEffect(() => {
    if (text && text.trim().length > 3) {
      const data = scorePrompt(text);
      setScore(data);
    } else {
      setScore(null);
    }
  }, [text]);

  if (!score) return null;

  const g = score.grade;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px 2px 6px',
        borderRadius: 20,
        background: g.color + '12',
        border: `1px solid ${g.color}33`,
        animation: 'fadeUp 0.2s ease',
        cursor: 'default',
      }}
      title={`Prompt Score: ${score.overall}/100 (${g.label})`}
    >
      <span style={{ fontSize: 11, fontWeight: 800, color: g.color }}>
        {g.letter}
      </span>
      <span style={{ fontSize: 9, color: g.color, opacity: 0.7 }}>
        {score.overall}
      </span>
    </div>
  );
}

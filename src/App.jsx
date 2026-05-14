import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const DOMAINS = [
  { id: 'frontend', label: 'Frontend Dev', icon: '🎨' },
  { id: 'backend', label: 'Backend Dev', icon: '⚙' },
  { id: 'fullstack', label: 'Full Stack', icon: '🔧' },
  { id: 'uiux', label: 'UI/UX Design', icon: '✦' },
  { id: 'writing', label: 'Content Writing', icon: '✍' },
  { id: 'marketing', label: 'Marketing', icon: '📣' },
  { id: 'research', label: 'Research', icon: '🔬' },
  { id: 'resume', label: 'Resume', icon: '📄' },
  { id: 'interview', label: 'Interview Prep', icon: '🎯' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'youtube', label: 'YouTube Script', icon: '▶' },
  { id: 'social', label: 'Social Media', icon: '◈' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'dsa', label: 'DSA / CP', icon: '⌨' },
];

const MODES = [
  { id: 'technical', label: 'Technical', desc: 'Deep specs + edge cases' },
  { id: 'senior', label: 'Senior Dev', desc: 'Architecture-first' },
  { id: 'creative', label: 'Creative', desc: 'Open exploration' },
  { id: 'concise', label: 'Concise', desc: 'Tight & focused' },
  { id: 'detailed', label: 'Detailed', desc: 'Exhaustive context' },
  { id: 'startup', label: 'Startup', desc: 'Fast & opinionated' },
  { id: 'beginner', label: 'Beginner', desc: 'Step-by-step' },
];

const PROVIDERS = [
  {
    id: 'gemini',
    label: 'Gemini (Free)',
    hint: 'aistudio.google.com — Free, no card',
    placeholder: 'AIza...',
  },
  {
    id: 'groq',
    label: 'Groq (Free)',
    hint: 'console.groq.com — Free forever',
    placeholder: 'gsk_...',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    hint: 'platform.openai.com — $5 credits',
    placeholder: 'sk-...',
  },
];

const EXAMPLES = [
  'make login page',
  'write linkedin post',
  'create portfolio website',
  'help me study OS concepts',
  'build ecommerce website',
  'create REST API',
  'write YouTube script',
  'make marketing plan',
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

const storage = {
  get: (keys) => new Promise((res) => chrome.storage.local.get(keys, res)),
  set: (obj) => new Promise((res) => chrome.storage.local.set(obj, res)),
};

// ─── Score bar component ──────────────────────────────────────────────────────

function ScoreBar({ label, value, color, bg }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          fontSize: 9,
          color: 'rgba(255,255,255,0.32)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          width: 72,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 5,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: pct + '%',
            background: bg,
            borderRadius: 99,
            transition: 'width 0.9s cubic-bezier(.4,0,.2,1)',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color,
          width: 24,
          textAlign: 'right',
        }}
      >
        {pct}
      </span>
    </div>
  );
}

// ─── Pill button ─────────────────────────────────────────────────────────────

function Pill({ active, onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 11,
        border: '1px solid',
        transition: 'all 0.13s',
        whiteSpace: 'nowrap',
        outline: 'none',
        background: active ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.04)',
        borderColor: active ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.1)',
        color: active ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
      }}
    >
      {children}
    </button>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function Label({ children, sub }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase',
        }}
      >
        {children}
      </span>
      {sub && (
        <span
          style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginLeft: 5 }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

// ─── Settings screen ──────────────────────────────────────────────────────────

function SettingsScreen({ onBack }) {
  const [provider, setProvider] = useState('gemini');
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    storage.get(['pp_key', 'pp_provider']).then(({ pp_key, pp_provider }) => {
      if (pp_key) setKey(pp_key);
      if (pp_provider) setProvider(pp_provider);
    });
  }, []);

  async function handleSave() {
    await storage.set({ pp_key: key.trim(), pp_provider: provider });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onBack();
    }, 1200);
  }

  const prov = PROVIDERS.find((p) => p.id === provider);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: 18,
        gap: 16,
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 18,
            padding: '0 4px 0 0',
          }}
        >
          ←
        </button>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Settings</span>
      </div>

      {/* Provider selector */}
      <div>
        <Label>AI Provider</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid',
                textAlign: 'left',
                background:
                  provider === p.id
                    ? 'rgba(124,58,237,0.12)'
                    : 'rgba(255,255,255,0.03)',
                borderColor:
                  provider === p.id
                    ? 'rgba(124,58,237,0.6)'
                    : 'rgba(255,255,255,0.1)',
                transition: 'all 0.15s',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    provider === p.id ? '#c4b5fd' : 'rgba(255,255,255,0.7)',
                  marginBottom: 2,
                }}
              >
                {p.label}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                {p.hint}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* API key */}
      <div>
        <Label>API Key for {prov?.label}</Label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder={prov?.placeholder}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 9,
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(255,255,255,0.12)',
            color: 'white',
            fontSize: 13,
            outline: 'none',
            transition: 'border-color 0.18s',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(124,58,237,0.6)')}
          onBlur={(e) =>
            (e.target.style.borderColor = 'rgba(255,255,255,0.12)')
          }
        />
        <p
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.28)',
            marginTop: 5,
            lineHeight: 1.6,
          }}
        >
          Stored in your browser only. Never sent anywhere except the selected
          provider.
        </p>
      </div>

      <button
        onClick={handleSave}
        style={{
          padding: 11,
          borderRadius: 10,
          border: 'none',
          background: saved
            ? 'rgba(5,150,105,0.8)'
            : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
          color: 'white',
          fontSize: 13,
          fontWeight: 700,
          transition: 'all 0.2s',
        }}
      >
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>

      {/* Info */}
      <div
        style={{
          padding: '12px 14px',
          background: 'rgba(124,58,237,0.07)',
          border: '1px solid rgba(124,58,237,0.18)',
          borderRadius: 10,
        }}
      >
        <Label>How to use</Label>
        <p
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            lineHeight: 1.7,
          }}
        >
          1. Select any text on any website
          <br />
          2. Click the ✦ PromptPilot button that appears
          <br />
          3. Or right-click → "Enhance with PromptPilot"
          <br />
          4. Or press{' '}
          <kbd
            style={{
              background: 'rgba(255,255,255,0.08)',
              padding: '1px 5px',
              borderRadius: 4,
              fontSize: 10,
            }}
          >
            Ctrl+Shift+E
          </kbd>
        </p>
      </div>
    </div>
  );
}

// ─── History screen ───────────────────────────────────────────────────────────

function HistoryScreen({ history, onSelect, onClear, onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 18,
              padding: 0,
            }}
          >
            ←
          </button>
          <span style={{ fontSize: 14, fontWeight: 700 }}>History</span>
          <span
            style={{
              fontSize: 10,
              color: '#a78bfa',
              background: 'rgba(124,58,237,0.18)',
              border: '1px solid rgba(124,58,237,0.3)',
              padding: '1px 7px',
              borderRadius: 20,
            }}
          >
            {history.length}
          </span>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            style={{
              background: 'none',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 7,
              padding: '3px 10px',
              fontSize: 11,
              color: 'rgba(239,68,68,0.7)',
            }}
          >
            Clear all
          </button>
        )}
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
        }}
      >
        {history.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'rgba(255,255,255,0.22)',
              fontSize: 12,
              marginTop: 48,
              lineHeight: 1.8,
            }}
          >
            No history yet.
            <br />
            Enhance some prompts first.
          </div>
        ) : (
          history.map((item, i) => (
            <button
              key={i}
              onClick={() => onSelect(item)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '10px 12px',
                textAlign: 'left',
                width: '100%',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')
              }
            >
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: 3,
                }}
              >
                {item.domain_detected || '—'} · {item.mode} ·{' '}
                {new Date(item.ts).toLocaleDateString()}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.8)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: 5,
                }}
              >
                {item.original}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 10, color: '#a78bfa' }}>
                  Clarity {item.clarity_score}
                </span>
                <span style={{ fontSize: 10, color: '#34d399' }}>
                  Quality {item.quality_score}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('main');
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [domain, setDomain] = useState('');
  const [mode, setMode] = useState('technical');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showEx, setShowEx] = useState(false);
  const [activeTab, setActiveTab] = useState('enhanced');
  const [typed, setTyped] = useState('');
  const [typeDone, setTypeDone] = useState(true);
  const abortRef = useRef(null);

  useEffect(() => {
    storage.get(['pp_history']).then(({ pp_history }) => {
      if (pp_history) setHistory(pp_history);
    });
  }, []);

  // Typing animation
  useEffect(() => {
    if (!result?.enhanced_prompt) {
      setTyped('');
      return;
    }
    const full = result.enhanced_prompt;
    setTyped('');
    setTypeDone(false);
    let i = 0;
    const id = setInterval(() => {
      i += 18;
      if (i >= full.length) {
        setTyped(full);
        setTypeDone(true);
        clearInterval(id);
      } else setTyped(full.slice(0, i));
    }, 16);
    return () => clearInterval(id);
  }, [result]);

  const handleEnhance = useCallback(async () => {
    if (!input.trim() || loading) return;
    const { pp_key, pp_provider } = await storage.get([
      'pp_key',
      'pp_provider',
    ]);

    if (!pp_key) {
      setError('No API key — open Settings to add one.');
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError('');
    setResult(null);

    // Send through background service worker (proxy)
    chrome.runtime.sendMessage(
      {
        type: 'PP_API',
        prompt: input.trim(),
        domain,
        mode,
        provider: pp_provider || 'gemini',
        apiKey: pp_key,
      },
      (res) => {
        setLoading(false);
        if (!res?.ok) {
          setError(res?.error || 'Something went wrong.');
          return;
        }
        const r = res.data;
        setResult(r);
        setActiveTab('enhanced');
        const entry = {
          ...r,
          original: input.trim(),
          mode,
          domain,
          ts: Date.now(),
        };
        const updated = [entry, ...history.slice(0, 49)];
        setHistory(updated);
        storage.set({ pp_history: updated });
      }
    );
  }, [input, domain, mode, loading, history]);

  function handleCopy(text) {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleHistorySelect(item) {
    setInput(item.original);
    setResult(item);
    setMode(item.mode || 'technical');
    setDomain(item.domain || '');
    setScreen('main');
  }

  function handleClearHistory() {
    if (!window.confirm('Clear all history?')) return;
    setHistory([]);
    storage.set({ pp_history: [] });
  }

  // Diff builder
  function buildDiff(original, enhanced) {
    if (!original || !enhanced) return '';
    const oldW = original.split(/(\s+)/),
      newW = enhanced.split(/(\s+)/);
    const m = oldW.length,
      n = newW.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--)
      for (let j = n - 1; j >= 0; j--)
        dp[i][j] =
          oldW[i] === newW[j]
            ? dp[i + 1][j + 1] + 1
            : Math.max(dp[i + 1]?.[j] || 0, dp[i]?.[j + 1] || 0);
    const parts = [];
    let i = 0,
      j = 0;
    while (i < m || j < n) {
      if (i < m && j < n && oldW[i] === newW[j]) {
        parts.push({ t: 'same', v: oldW[i] });
        i++;
        j++;
      } else if (
        j < n &&
        (i >= m || (dp[i + 1]?.[j] || 0) <= (dp[i]?.[j + 1] || 0))
      ) {
        parts.push({ t: 'add', v: newW[j] });
        j++;
      } else {
        parts.push({ t: 'rem', v: oldW[i] });
        i++;
      }
    }
    return parts;
  }

  if (screen === 'settings')
    return <SettingsScreen onBack={() => setScreen('main')} />;
  if (screen === 'history')
    return (
      <HistoryScreen
        history={history}
        onSelect={handleHistorySelect}
        onClear={handleClearHistory}
        onBack={() => setScreen('main')}
      />
    );

  const diffParts = result ? buildDiff(input, result.enhanced_prompt) : [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* ── Topbar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(12,12,24,0.98)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 800,
              flexShrink: 0,
              boxShadow: '0 2px 10px rgba(124,58,237,0.5)',
            }}
          >
            P
          </div>
          <span
            style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}
          >
            PromptPilot AI
          </span>
          <span
            style={{
              fontSize: 9,
              color: '#a78bfa',
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.3)',
              padding: '2px 7px',
              borderRadius: 20,
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          >
            COPILOT
          </span>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {[
            { icon: '⟳', s: 'history', title: 'History' },
            { icon: '⚙', s: 'settings', title: 'Settings' },
          ].map(({ icon, s, title }) => (
            <button
              key={s}
              onClick={() => setScreen(s)}
              title={title}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.38)',
                fontSize: 15,
                padding: '4px 6px',
                borderRadius: 7,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')
              }
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '13px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* API key warning */}
        <ApiKeyWarning onSettings={() => setScreen('settings')} />

        {/* Input */}
        <div>
          <Label>Your Prompt</Label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleEnhance();
              }
            }}
            placeholder={'Type a weak or vague prompt…\n\ne.g. make login page'}
            rows={3}
            style={{
              width: '100%',
              padding: '10px 11px',
              borderRadius: 9,
              resize: 'vertical',
              minHeight: 72,
              background: 'rgba(255,255,255,0.05)',
              border: '1.5px solid rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: 12.5,
              lineHeight: 1.7,
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.18s',
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = 'rgba(124,58,237,0.6)')
            }
            onBlur={(e) =>
              (e.target.style.borderColor = 'rgba(255,255,255,0.1)')
            }
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            <button
              onClick={() => setShowEx((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.28)',
                fontSize: 10,
                padding: 0,
              }}
            >
              {showEx ? '▲ hide examples' : '▼ quick examples'}
            </button>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)' }}>
              Ctrl + Enter
            </span>
          </div>
        </div>

        {/* Examples */}
        {showEx && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 5,
              animation: 'fadeUp 0.2s ease',
            }}
          >
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setInput(ex);
                  setShowEx(false);
                }}
                style={{
                  padding: '4px 9px',
                  borderRadius: 20,
                  fontSize: 10.5,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.55)',
                  transition: 'all 0.13s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {/* Domain */}
        <div>
          <Label sub="(optional — auto-detected if skipped)">Domain</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {DOMAINS.map((d) => (
              <Pill
                key={d.id}
                active={domain === d.id}
                onClick={() => setDomain(domain === d.id ? '' : d.id)}
              >
                {d.icon} {d.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div>
          <Label>Prompt Mode</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {MODES.map((m) => (
              <Pill
                key={m.id}
                active={mode === m.id}
                onClick={() => setMode(m.id)}
                title={m.desc}
              >
                {m.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.28)',
              borderRadius: 9,
              padding: '9px 12px',
              color: '#fca5a5',
              fontSize: 11.5,
              lineHeight: 1.55,
              animation: 'fadeUp 0.2s ease',
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Forge button */}
        <button
          onClick={handleEnhance}
          disabled={loading || !input.trim()}
          style={{
            padding: 12,
            borderRadius: 10,
            border: 'none',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            background:
              loading || !input.trim()
                ? 'rgba(124,58,237,0.22)'
                : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            color: loading || !input.trim() ? 'rgba(255,255,255,0.3)' : 'white',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
            boxShadow:
              !loading && input.trim()
                ? '0 4px 20px rgba(124,58,237,0.4)'
                : 'none',
          }}
        >
          {loading ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  animation: 'spin 0.75s linear infinite',
                }}
              >
                ⟳
              </span>{' '}
              Enhancing…
            </>
          ) : (
            '✦ Forge Prompt'
          )}
        </button>

        {loading && (
          <div
            style={{
              textAlign: 'center',
              fontSize: 10.5,
              color: 'rgba(255,255,255,0.28)',
              lineHeight: 1.8,
              animation: 'pulse 1.5s ease infinite',
            }}
          >
            Detecting intent · Injecting expertise · Structuring output
          </div>
        )}

        {/* ── Result ── */}
        {result && !loading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              animation: 'fadeUp 0.3s ease',
            }}
          >
            {/* Scores */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 11,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
              }}
            >
              <ScoreBar
                label="Clarity"
                value={result.clarity_score}
                color="#a78bfa"
                bg="linear-gradient(90deg,#7c3aed,#a78bfa)"
              />
              <ScoreBar
                label="Specificity"
                value={result.specificity_score}
                color="#34d399"
                bg="linear-gradient(90deg,#059669,#34d399)"
              />
              <ScoreBar
                label="Quality"
                value={result.quality_score}
                color="#60a5fa"
                bg="linear-gradient(90deg,#1d4ed8,#60a5fa)"
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  paddingTop: 4,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  marginTop: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Domain
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    color: '#6ee7b7',
                    background: 'rgba(52,211,153,0.1)',
                    border: '1px solid rgba(52,211,153,0.25)',
                    padding: '2px 9px',
                    borderRadius: 20,
                  }}
                >
                  {result.domain_detected || 'General'}
                </span>
                {result.transformation_insight && (
                  <span
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.35)',
                      lineHeight: 1.4,
                      flex: 1,
                    }}
                  >
                    {result.transformation_insight}
                  </span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                gap: 3,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
                padding: 3,
              }}
            >
              {[
                { id: 'enhanced', label: 'Enhanced' },
                { id: 'diff', label: 'Compare' },
                { id: 'added', label: 'Added' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: 'none',
                    fontFamily: 'inherit',
                    background:
                      activeTab === t.id ? 'rgba(124,58,237,0.25)' : 'none',
                    color:
                      activeTab === t.id ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab: Enhanced */}
            {activeTab === 'enhanced' && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 11,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '9px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: '#34d399',
                        display: 'inline-block',
                        boxShadow: '0 0 5px #34d399',
                      }}
                    />
                    Enhanced Prompt
                  </span>
                  <button
                    onClick={() => handleCopy(result.enhanced_prompt)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 6,
                      fontSize: 10.5,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: copied
                        ? 'rgba(52,211,153,0.15)'
                        : 'rgba(255,255,255,0.06)',
                      color: copied ? '#34d399' : 'rgba(255,255,255,0.6)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <div
                  style={{
                    padding: 12,
                    fontSize: 11.5,
                    lineHeight: 1.85,
                    color: 'rgba(255,255,255,0.8)',
                    whiteSpace: 'pre-wrap',
                    fontFamily: "'Courier New',Courier,monospace",
                    maxHeight: 220,
                    overflowY: 'auto',
                  }}
                >
                  {typed}
                  {!typeDone && (
                    <span
                      style={{
                        opacity: 0.4,
                        animation: 'blink 1s step-end infinite',
                      }}
                    >
                      ▌
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Diff */}
            {activeTab === 'diff' && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 11,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '9px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Compare Changes
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: '#f87171',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      padding: '1px 7px',
                      borderRadius: 20,
                    }}
                  >
                    Removed
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: '#34d399',
                      background: 'rgba(52,211,153,0.1)',
                      border: '1px solid rgba(52,211,153,0.25)',
                      padding: '1px 7px',
                      borderRadius: 20,
                    }}
                  >
                    Added
                  </span>
                </div>
                <div
                  style={{
                    padding: 12,
                    fontSize: 11.5,
                    lineHeight: 1.85,
                    fontFamily: "'Courier New',Courier,monospace",
                    maxHeight: 220,
                    overflowY: 'auto',
                    wordBreak: 'break-word',
                  }}
                >
                  {diffParts.map((part, i) => (
                    <span
                      key={i}
                      style={{
                        color:
                          part.t === 'same'
                            ? 'rgba(255,255,255,0.55)'
                            : part.t === 'add'
                              ? '#34d399'
                              : '#f87171',
                        background:
                          part.t === 'add'
                            ? 'rgba(52,211,153,0.12)'
                            : part.t === 'rem'
                              ? 'rgba(239,68,68,0.12)'
                              : 'transparent',
                        borderRadius: part.t !== 'same' ? 3 : 0,
                        padding: part.t !== 'same' ? '0 2px' : 0,
                        textDecoration:
                          part.t === 'rem' ? 'line-through' : 'none',
                      }}
                    >
                      {part.v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Added */}
            {activeTab === 'added' && (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {(result.missing_requirements || []).length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        color: 'rgba(255,255,255,0.28)',
                        textTransform: 'uppercase',
                        marginBottom: 7,
                      }}
                    >
                      Requirements Added
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {result.missing_requirements.map((r, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 11,
                            color: '#fcd34d',
                            background: 'rgba(251,191,36,0.08)',
                            border: '1px solid rgba(251,191,36,0.22)',
                            padding: '3px 9px',
                            borderRadius: 20,
                          }}
                        >
                          + {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(result.ambiguities_resolved || []).length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        color: 'rgba(255,255,255,0.28)',
                        textTransform: 'uppercase',
                        marginBottom: 7,
                      }}
                    >
                      Ambiguities Resolved
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {result.ambiguities_resolved.map((r, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 11,
                            color: '#93c5fd',
                            background: 'rgba(96,165,250,0.08)',
                            border: '1px solid rgba(96,165,250,0.22)',
                            padding: '3px 9px',
                            borderRadius: 20,
                          }}
                        >
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.transformation_insight && (
                  <div
                    style={{
                      background: 'rgba(99,102,241,0.07)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 9,
                      padding: '10px 12px',
                      fontSize: 11.5,
                      color: 'rgba(255,255,255,0.6)',
                      lineHeight: 1.65,
                    }}
                  >
                    💡 {result.transformation_insight}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!result && !loading && !error && (
          <div
            style={{
              textAlign: 'center',
              padding: '10px 0 18px',
              color: 'rgba(255,255,255,0.15)',
              fontSize: 11,
              lineHeight: 1.8,
            }}
          >
            Type a prompt above and click ✦ Forge Prompt
            <br />
            <span style={{ color: 'rgba(167,139,250,0.4)' }}>
              or select text on any website to enhance it inline
            </span>
          </div>
        )}

        <div style={{ height: 6, flexShrink: 0 }} />
      </div>
    </div>
  );
}

// ─── API key warning (reads from chrome.storage) ──────────────────────────────

function ApiKeyWarning({ onSettings }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    chrome.storage.local.get(['pp_key'], ({ pp_key }) => {
      if (!pp_key) setShow(true);
    });
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={onSettings}
      style={{
        background: 'rgba(251,191,36,0.07)',
        border: '1px solid rgba(251,191,36,0.3)',
        borderRadius: 9,
        padding: '9px 12px',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        animation: 'fadeUp 0.25s ease',
        width: '100%',
      }}
    >
      <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
      <span style={{ fontSize: 11, color: '#fcd34d', lineHeight: 1.5 }}>
        No API key set. Click here to add one in Settings.
      </span>
    </button>
  );
}

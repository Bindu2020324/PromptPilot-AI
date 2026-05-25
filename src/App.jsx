import { useState, useRef, useEffect, useCallback } from 'react';
import { versioningService } from './versioningService';
import {
  PromptsList,
  VersionHistoryPanel,
  DiffView,
} from './historyComponents';
import ScorePanel, { MiniScoreBadge } from './components/ScorePanel';
import ScoreTrends from './components/ScoreTrends';
import { scorePrompt } from './scoring/PromptScorer';
import { saveScore } from './scoring/ScoreHistory';

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
          color: 'var(--text-faint)',
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
          background: 'var(--bg-secondary)',
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
        background: active ? 'var(--bg-active)' : 'var(--bg-tertiary)',
        borderColor: active ? 'var(--border-focus)' : 'var(--border-color)',
        color: active ? 'var(--accent-light)' : 'var(--text-tertiary)',
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
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
        }}
      >
        {children}
      </span>
      {sub && (
        <span
          style={{
            fontSize: 9,
            color: 'var(--text-very-faint)',
            marginLeft: 5,
          }}
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
            color: 'var(--text-muted)',
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
                border: '1.5px solid var(--border-color)',
                textAlign: 'left',
                background:
                  provider === p.id ? 'var(--bg-active)' : 'var(--bg-tertiary)',
                color:
                  provider === p.id
                    ? 'var(--text-secondary)'
                    : 'var(--text-tertiary)',
                borderColor:
                  provider === p.id
                    ? 'var(--border-focus)'
                    : 'var(--border-color)',
                transition: 'all 0.15s',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    provider === p.id
                      ? 'var(--accent-light)'
                      : 'var(--text-secondary)',
                  marginBottom: 2,
                }}
              >
                {p.label}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>
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
            background: 'var(--input-bg)',
            border: '1.5px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
            transition: 'border-color 0.18s',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
        />
        <p
          style={{
            fontSize: 10,
            color: 'var(--text-faint)',
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
          color: 'var(--text-primary)',
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
            color: 'var(--text-muted)',
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
              background: 'var(--bg-hover)',
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

function AnalyticsScreen({ analytics, onBack }) {
  return (
    <div style={{ padding: 20, color: 'white' }}>
      <button onClick={onBack}>← Back</button>

      <h1>Prompt Analytics</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
          gap: 16,
          marginTop: 20,
        }}
      >
        <div
          style={{
            background: '#1e1e2f',
            padding: 20,
            borderRadius: 12,
          }}
        >
          <h2>Total Prompts</h2>
          <p>{analytics.totalPrompts}</p>
        </div>

        <div
          style={{
            background: '#1e1e2f',
            padding: 20,
            borderRadius: 12,
          }}
        >
          <h2>Favorites</h2>
          <p>{analytics.favorites}</p>
        </div>
      </div>
    </div>
  );
}

// ─── History screen ───────────────────────────────────────────────────────────

function HistoryScreen({
  prompts,
  onSelect,
  onSelectPrompt,
  onClear,
  onBack,
  searchQuery,
  setSearchQuery,
  showFavoritesOnly,
  setShowFavoritesOnly,
  toggleFavorite,
  onExportJSON,
  onExportMD,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
              background: 'rgba(124,58,237,0.18)',
              border: '1px solid rgba(124,58,237,0.3)',
              padding: '1px 7px',
              borderRadius: 20,
            }}
          >
            {prompts.length}
          </span>
        </div>
        {prompts.length > 0 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={onExportJSON}
              title="Export history as JSON"
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: 7,
                padding: '3px 8px',
                fontSize: 11,
                color: 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Export JSON
            </button>
            <button
              onClick={onExportMD}
              title="Export history as Markdown"
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: 7,
                padding: '3px 8px',
                fontSize: 11,
                color: 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Export MD
            </button>
            <button
              onClick={onClear}
              style={{
                background: 'none',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 7,
                padding: '3px 8px',
                fontSize: 11,
                color: 'var(--accent-red)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ padding: '10px 12px', display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Search prompts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: 12,
            outline: 'none',
          }}
        />

        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            background: showFavoritesOnly
              ? 'rgba(251,191,36,0.2)'
              : 'var(--bg-tertiary)',
            color: '#facc15',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          ⭐
        </button>
      </div>

      {/* List */}
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
            No history yet.
            <br />
            Enhance some prompts first.
          </div>
        ) : (
          (() => {
            const filtered = prompts.filter((prompt) => {
              const latestVersion = prompt.versions?.[0] || {};
              const matchesSearch =
                prompt.original_text
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                latestVersion.enhanced_prompt
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase());

              const matchesFavorite = !showFavoritesOnly || prompt.favorite;

              return matchesSearch && matchesFavorite;
            });

            if (filtered.length === 0) {
              return (
                <div
                  style={{
                    textAlign: 'center',
                    color: 'var(--text-faint)',
                    fontSize: 12,
                    marginTop: 48,
                  }}
                >
                  No matching prompts found.
                </div>
              );
            }

            return filtered.map((prompt) => {
              const latestVersion = prompt.versions?.[0] || {};
              return (
                <button
                  key={prompt.id}
                  onClick={() => onSelect(prompt)}
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
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPrompt(prompt);
                      }}
                      title="Click to view version history"
                      style={{
                        fontSize: 9,
                        color: '#a78bfa',
                        background: 'rgba(124,58,237,0.12)',
                        border: '1px solid rgba(124,58,237,0.3)',
                        padding: '2px 6px',
                        borderRadius: 6,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          'rgba(124,58,237,0.22)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          'rgba(124,58,237,0.12)';
                      }}
                    >
                      {prompt.versions.length} version
                      {prompt.versions.length !== 1 ? 's' : ''} ↗
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(prompt.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: prompt.favorite ? '#facc15' : '#666',
                        padding: 0,
                      }}
                    >
                      {prompt.favorite ? '★' : '☆'}
                    </button>
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--text-faint)',
                      marginBottom: 3,
                    }}
                  >
                    {latestVersion.domain_detected || prompt.domain || '—'} ·{' '}
                    {prompt.mode} ·{' '}
                    {new Date(prompt.updated_at).toLocaleDateString()}
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
            });
          })()
        )}
      </div>
    </div>
  );
}

// ─── Prompt counter ─────────────────────────────────────────────────────────

function getCounterState(len) {
  if (len === 0) return { color: 'var(--text-ultra-faint)', label: '' };
  if (len < 20) return { color: '#f87171', label: 'Too Short' };
  if (len < 300) return { color: '#fbbf24', label: 'Okay' };
  if (len < 1500) return { color: '#34d399', label: 'Good' };
  return { color: '#fb923c', label: 'Long' };
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('main');
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalPrompts: 0,
    favorites: 0,
    categories: {},
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [compareVersion, setCompareVersion] = useState(null);
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
  const [theme, setTheme] = useState('dark');
  const abortRef = useRef(null);

  // Theme initialization
  useEffect(() => {
    // Load saved theme or detect system preference
    storage.get(['pp_theme']).then(({ pp_theme }) => {
      if (pp_theme) {
        setTheme(pp_theme);
      } else {
        // Detect system preference
        const systemPrefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        setTheme(systemPrefersDark ? 'dark' : 'light');
      }
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      storage.get(['pp_theme']).then(({ pp_theme }) => {
        // Only update if user hasn't manually set a preference
        if (!pp_theme) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      });
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle global Escape key to reset the workspace
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && screen === 'main' && !loading) {
        setInput('');
        setResult(null);
        setError('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, loading]);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    storage.set({ pp_theme: newTheme });
  };

  // Version system initialization - migrate legacy history on first load
  useEffect(() => {
    (async () => {
      await versioningService.migrateFromLegacy();
      const allPrompts = await versioningService.getAllPrompts();
      setPrompts(allPrompts);

      // Fallback: also load legacy history for backward compatibility
      storage.get(['pp_history']).then(({ pp_history }) => {
        if (pp_history) setHistory(pp_history);
      });
    })();
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
      async (res) => {
        setLoading(false);
        if (!res?.ok) {
          setError(
            res?.error ||
              'Unexpected Error: Something went wrong. Please try again.'
          );
          return;
        }
        const r = res.data;
        setResult(r);
        setActiveTab('enhanced');

        // Create version entry using versioning service
        try {
          let updatedPrompt;
          // Check if we have an existing prompt to version or create new
          const existingPrompts = await versioningService.getAllPrompts();
          const matchingPrompt = existingPrompts.find(
            (p) => p.original_text === input.trim()
          );

          if (matchingPrompt) {
            // Add new version to existing prompt
            updatedPrompt = await versioningService.addVersion(
              matchingPrompt.id,
              r,
              {
                domain,
                mode,
                provider: pp_provider || 'gemini',
                change_note: 'Re-enhanced with same prompt',
              }
            );
          } else {
            // Create new prompt with first version
            updatedPrompt = await versioningService.createPrompt(
              input.trim(),
              r,
              {
                domain,
                mode,
                provider: pp_provider || 'gemini',
              }
            );
          }

          // Refresh prompts list
          const allPrompts = await versioningService.getAllPrompts();
          setPrompts(allPrompts);

          // Save score to history for trend tracking
          try {
            const enhancedScoreData = scorePrompt(r.enhanced_prompt || '');
            await saveScore({
              promptText: input.trim(),
              scores: enhancedScoreData.dimensions,
              overall: enhancedScoreData.overall,
              grade: enhancedScoreData.grade,
              type: 'enhanced',
            });
          } catch (scoreErr) {
            console.error('Error saving score:', scoreErr);
          }

          // Also maintain legacy history for backward compatibility
          const entry = {
            ...r,
            original: input.trim(),
            mode,
            domain,
            ts: Date.now(),
            favorite: false,
          };
          const updated = [entry, ...history.slice(0, 49)];
          setHistory(updated);
          setAnalytics((prev) => ({
            ...prev,

            totalPrompts: prev.totalPrompts + 1,
          }));
          storage.set({ pp_history: updated });
        } catch (err) {
          console.error('Error saving version:', err);
        }
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

  async function toggleFavorite(promptId) {
    const updated = prompts.map((p) =>
      p.id === promptId ? { ...p, favorite: !p.favorite } : p
    );
    setPrompts(updated);
    await storage.set({ pp_prompts: updated });
  }

  function handleHistorySelect(prompt) {
    const latestVersion = prompt.versions?.[0];
    if (!latestVersion) return;
    setInput(prompt.original_text);
    setResult(latestVersion);
    setMode(prompt.mode || 'technical');
    setDomain(prompt.domain || '');
    setScreen('main');
  }

  function handleClearHistory() {
    if (!window.confirm('Clear all history?')) return;
    (async () => {
      await versioningService.clearAll();
      setPrompts([]);
      setHistory([]);
      storage.set({ pp_history: [] });
    })();
  }

  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify(prompts, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `promptpilot-history-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export JSON:', err);
    }
  };

  const handleExportMarkdown = () => {
    try {
      let md = `# PromptPilot AI - Exported Prompt History\n`;
      md += `Exported on: ${new Date().toLocaleString()}\n`;
      md += `Total Prompts: ${prompts.length}\n\n`;
      md += `---\n\n`;

      prompts.forEach((prompt, idx) => {
        md += `## ${idx + 1}. ${prompt.original_text.slice(0, 50)}${prompt.original_text.length > 50 ? '...' : ''}\n\n`;
        md += `- **Original Prompt:** ${prompt.original_text}\n`;
        md += `- **Domain:** ${prompt.domain || 'General'}\n`;
        md += `- **Mode:** ${prompt.mode}\n`;
        md += `- **Status:** ${prompt.favorite ? '⭐ Favorite' : 'Standard'}\n`;
        md += `- **Created:** ${new Date(prompt.created_at).toLocaleString()}\n`;
        md += `- **Last Updated:** ${new Date(prompt.updated_at).toLocaleString()}\n\n`;

        md += `### Version History\n\n`;

        prompt.versions.forEach((ver) => {
          md += `#### Version ${ver.version_number}${ver.version_number === prompt.versions[0].version_number ? ' (Latest)' : ''}\n`;
          md += `- **Created At:** ${new Date(ver.created_at).toLocaleString()}\n`;
          md += `- **AI Provider:** ${ver.provider || 'Gemini'} (${ver.model || 'gemini-pro'})\n`;
          md += `- **Scores:** Clarity: ${ver.clarity_score} | Specificity: ${ver.specificity_score} | Quality: ${ver.quality_score}\n`;
          if (ver.change_note) {
            md += `- **Change Note:** *${ver.change_note}*\n`;
          }
          if (ver.transformation_insight) {
            md += `- **Insight:** ${ver.transformation_insight}\n`;
          }
          md += `\n**Enhanced Prompt:**\n\n`;
          md += `\`\`\`\n${ver.enhanced_prompt}\n\`\`\`\n\n`;
        });

        md += `---\n\n`;
      });

      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `promptpilot-history-${timestamp}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Markdown:', err);
    }
  };

  async function handleRestoreVersion(promptId, versionNumber) {
    if (!window.confirm(`Restore to version ${versionNumber}?`)) return;
    try {
      const restoredPrompt = await versioningService.restoreVersion(
        promptId,
        versionNumber
      );
      const allPrompts = await versioningService.getAllPrompts();
      setPrompts(allPrompts);
      setCompareVersion(null);
    } catch (err) {
      setError(`Error restoring version: ${err.message}`);
    }
  }

  async function handleCompareVersion(promptId, versionNumber) {
    setCompareVersion(versionNumber);
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

  if (screen === 'score')
    return (
      <ScorePanel
        promptText={input}
        enhancedText={result?.enhanced_prompt || ''}
        onBack={() => setScreen('main')}
      />
    );

  if (screen === 'score-trends')
    return <ScoreTrends onBack={() => setScreen('main')} />;

  if (screen === 'analytics')
    return (
      <AnalyticsScreen
        analytics={{
          totalPrompts: prompts.length,
          favorites: prompts.filter((p) => p.favorite).length,
          categories: {},
        }}
        onBack={() => setScreen('main')}
      />
    );

  if (screen === 'history')
    return (
      <HistoryScreen
        prompts={prompts}
        onSelect={handleHistorySelect}
        onSelectPrompt={(prompt) => {
          setSelectedPrompt(prompt);
          setScreen('version-history');
        }}
        onClear={handleClearHistory}
        onBack={() => setScreen('main')}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
        toggleFavorite={toggleFavorite}
        onExportJSON={handleExportJSON}
        onExportMD={handleExportMarkdown}
      />
    );

  if (screen === 'version-history' && selectedPrompt)
    return (
      <VersionHistoryPanel
        prompt={selectedPrompt}
        onRestore={(versionNum) => {
          handleRestoreVersion(selectedPrompt.id, versionNum);
        }}
        onCompare={(versionNum) => {
          setCompareVersion(versionNum);
          setScreen('version-compare');
        }}
        onBack={() => {
          setSelectedPrompt(null);
          setScreen('history');
        }}
      />
    );

  if (screen === 'version-compare' && selectedPrompt && compareVersion) {
    const latestVersion = selectedPrompt.versions?.[0];
    const comparedVersion = selectedPrompt.versions?.find(
      (v) => v.version_number === compareVersion
    );
    if (!latestVersion || !comparedVersion) {
      return <div>Version not found</div>;
    }
    return (
      <DiffView
        version1={comparedVersion}
        version2={latestVersion}
        onClose={() => {
          setCompareVersion(null);
          setScreen('version-history');
        }}
      />
    );
  }

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
          background: 'var(--bg-header)',
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
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 15,
              padding: '4px 6px',
              borderRadius: 7,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--text-muted)')
            }
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          {[
            { icon: '📈', s: 'score-trends', title: 'Score Trends' },
            { icon: '◷', s: 'history', title: 'History' },
            { icon: '📊', s: 'analytics', title: 'Analytics' },
            { icon: '⚙', s: 'settings', title: 'Settings' },
          ].map(({ icon, s, title }) => (
            <button
              key={s}
              onClick={() => setScreen(s)}
              title={title}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 15,
                padding: '4px 6px',
                borderRadius: 7,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'var(--text-muted)')
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
              background: 'var(--bg-tertiary)',
              border: '1.5px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: 12.5,
              lineHeight: 1.7,
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.18s',
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = 'var(--border-focus)')
            }
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
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
                color: 'var(--text-faint)',
                fontSize: 10,
                padding: 0,
              }}
            >
              {showEx ? '▲ hide examples' : '▼ quick examples'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Live counter */}
              {(() => {
                const len = input.length;
                const { color, label } = getCounterState(len);
                return (
                  <span
                    title={label || 'Prompt length'}
                    style={{
                      fontSize: 9,
                      color,
                      transition: 'color 0.25s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {len === 0
                      ? '0 chars · ~0 tokens'
                      : `${len} chars · ~${Math.ceil(len / 4)} tokens${label ? ` · ${label}` : ''}`}
                  </span>
                );
              })()}
              {input.trim().length > 3 && (
                <button
                  onClick={() => {
                    const data = scorePrompt(input);
                    saveScore({
                      promptText: input,
                      scores: data.dimensions,
                      overall: data.overall,
                      grade: data.grade,
                      type: 'manual',
                    });
                    setScreen('score');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="View detailed prompt score"
                >
                  <MiniScoreBadge text={input} />
                </button>
              )}
              <span style={{ fontSize: 9, color: 'var(--text-ultra-faint)' }}>
                Esc to clear · Ctrl + Enter to forge
              </span>
            </div>
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
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-tertiary)',
                  border: '1px solid var(--border-color)',
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
        {error &&
          (() => {
            const parts = error.split(': ');
            const title = parts.length > 1 ? parts[0] : 'Error';
            const message =
              parts.length > 1 ? parts.slice(1).join(': ') : error;
            return (
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
                <div style={{ fontWeight: 600, marginBottom: 2 }}>
                  ⚠ {title}
                </div>
                <div>{message}</div>
              </div>
            );
          })()}

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
              color: 'var(--text-faint)',
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
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
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
                color="var(--accent-light)"
                bg="linear-gradient(90deg,var(--accent-primary),var(--accent-light))"
              />
              <ScoreBar
                label="Specificity"
                value={result.specificity_score}
                color="var(--accent-green)"
                bg="linear-gradient(90deg,#059669,var(--accent-green))"
              />
              <ScoreBar
                label="Quality"
                value={result.quality_score}
                color="var(--accent-blue)"
                bg="linear-gradient(90deg,#1d4ed8,var(--accent-blue))"
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  paddingTop: 4,
                  borderTop: '1px solid var(--border-color)',
                  marginTop: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: 'var(--text-muted)',
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
                      color: 'var(--text-faint)',
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
                background: 'var(--bg-tertiary)',
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
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 11,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '9px 12px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
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
                  {copied && (
                    <div
                      style={{
                        position: 'fixed',
                        bottom: 20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(30,30,40,0.95)',
                        border: '1px solid rgba(52,211,153,0.3)',
                        color: '#34d399',
                        padding: '8px 16px',
                        borderRadius: 8,
                        fontSize: 12,
                        animation: 'fadeUp 0.2s ease',
                        zIndex: 9999,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ✅ Copied to clipboard!
                    </div>
                  )}
                </div>
                <div
                  style={{
                    padding: 12,
                    fontSize: 11.5,
                    lineHeight: 1.85,
                    color: 'var(--text-secondary)',
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
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 11,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '9px 12px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
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
                        color: 'var(--text-faint)',
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
                        color: 'var(--text-faint)',
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
                            background: 'var(--bg-tertiary)',
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
                      color: 'var(--text-secondary)',
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
              color: 'var(--text-faint)',
              fontSize: 11,
              lineHeight: 1.8,
            }}
          >
            Type a prompt above and click ✦ Forge Prompt
            <br />
            <span style={{ color: 'var(--accent-light)', opacity: 0.6 }}>
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

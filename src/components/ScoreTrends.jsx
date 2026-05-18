import { useState, useEffect, useCallback } from 'react';
import { DIMENSIONS } from '../scoring/PromptScorer';
import { getHistory, getOverallTrend, getDimensionTrend, getSessionStats, getPersonalBests, clearHistory } from '../scoring/ScoreHistory';
import { Sparkline } from './ScorePanel';

export default function ScoreTrends({ onBack }) {
  const [stats, setStats] = useState(null);
  const [bests, setBests] = useState({});
  const [overallTrend, setOverallTrend] = useState([]);
  const [dimTrends, setDimTrends] = useState({});
  const [history, setHistory] = useState([]);

  const loadData = useCallback(async () => {
    const [s, b, ot, h] = await Promise.all([
      getSessionStats(), getPersonalBests(), getOverallTrend(20), getHistory(),
    ]);
    setStats(s);
    setBests(b);
    setOverallTrend(ot);
    setHistory(h.slice(0, 30));

    const trends = {};
    for (const dim of DIMENSIONS) {
      trends[dim.id] = await getDimensionTrend(dim.id, 15);
    }
    setDimTrends(trends);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleClear() {
    if (!window.confirm('Clear all score history?')) return;
    await clearHistory();
    await loadData();
  }

  const trendIcon = stats?.trend === 'improving' ? '↗' : stats?.trend === 'declining' ? '↘' : '→';
  const trendColor = stats?.trend === 'improving' ? '#34d399' : stats?.trend === 'declining' ? '#f87171' : 'var(--text-faint)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px', borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-header)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: 18, padding: '0 4px 0 0', cursor: 'pointer',
          }}>←</button>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Score Trends</span>
          {stats && (
            <span style={{
              fontSize: 9, color: trendColor, background: trendColor + '15',
              border: `1px solid ${trendColor}33`, padding: '2px 7px',
              borderRadius: 20, fontWeight: 700,
            }}>
              {trendIcon} {stats.trend}
            </span>
          )}
        </div>
        {history.length > 0 && (
          <button onClick={handleClear} style={{
            background: 'none', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 7, padding: '3px 10px', fontSize: 11,
            color: 'var(--accent-red)', cursor: 'pointer',
          }}>Clear</button>
        )}
      </div>

      {/* Body */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {!stats || stats.total === 0 ? (
          <div style={{
            textAlign: 'center', color: 'var(--text-faint)', fontSize: 12,
            marginTop: 48, lineHeight: 1.8,
          }}>
            No score history yet.<br />Score some prompts first.
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Prompts Scored', value: stats.total, color: '#a78bfa' },
                { label: 'Average Score', value: stats.avgScore, color: '#60a5fa' },
                { label: 'Best Grade', value: stats.bestGrade, color: '#34d399' },
                { label: 'Best Score', value: bests?.overall?.score || 0, color: '#fbbf24' },
              ].map((card, i) => (
                <div key={i} style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  borderRadius: 10, padding: '10px 12px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>
                    {card.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Trend */}
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: 11, padding: '12px 14px',
            }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-faint)',
                textTransform: 'uppercase', marginBottom: 10,
              }}>Overall Score Trend</div>
              <Sparkline data={overallTrend} width={360} height={48} color="#a78bfa" />
            </div>

            {/* Dimension Trends */}
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: 11, padding: '12px 14px',
            }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-faint)',
                textTransform: 'uppercase', marginBottom: 10,
              }}>Dimension Trends</div>
              {DIMENSIONS.map(dim => (
                <div key={dim.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}>
                  <span style={{ fontSize: 10, color: dim.color, width: 14, textAlign: 'center' }}>{dim.icon}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 75, flexShrink: 0 }}>{dim.label}</span>
                  <Sparkline data={dimTrends[dim.id]} width={110} height={20} color={dim.color} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: dim.color, width: 22, textAlign: 'right' }}>
                    {bests[dim.id]?.score || '—'}
                  </span>
                </div>
              ))}
            </div>

            {/* Recent Scores */}
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: 11, padding: '12px 14px',
            }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-faint)',
                textTransform: 'uppercase', marginBottom: 10,
              }}>Recent Scores</div>
              {history.slice(0, 10).map((entry, i) => (
                <div key={entry.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                  borderBottom: i < 9 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <span style={{
                    fontSize: 14, fontWeight: 800, width: 22,
                    color: entry.grade === 'S' ? '#fbbf24' : entry.grade === 'A' ? '#34d399' :
                           entry.grade === 'B' ? '#60a5fa' : entry.grade === 'C' ? '#a78bfa' :
                           entry.grade === 'D' ? '#fb923c' : '#f87171',
                  }}>{entry.grade}</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      fontSize: 11, color: 'var(--text-secondary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{entry.promptText}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>
                      {new Date(entry.timestamp).toLocaleDateString()} · Score: {entry.overall}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}

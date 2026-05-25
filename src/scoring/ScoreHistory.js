// ═══════════════════════════════════════════════════════════════════════
// PromptPilot AI — Score History Service
// Persists scoring data to chrome.storage.local
// ═══════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'pp_score_history';
const MAX_ENTRIES = 100;

/**
 * Save a score snapshot to history.
 * @param {{ promptText: string, scores: Object, overall: number, grade: Object, timestamp?: number }} entry
 */
export async function saveScore(entry) {
  const history = await getHistory();
  const record = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    promptText: entry.promptText?.slice(0, 300) || '',
    scores: entry.scores,
    overall: entry.overall,
    grade: entry.grade?.letter || 'F',
    timestamp: entry.timestamp || Date.now(),
    type: entry.type || 'manual', // 'manual' | 'enhanced' | 'comparison'
  };
  history.unshift(record);
  if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES;
  await chrome.storage.local.set({ [STORAGE_KEY]: history });
  return record;
}

/**
 * Get full score history.
 * @returns {Promise<Object[]>}
 */
export async function getHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

/**
 * Clear all score history.
 */
export async function clearHistory() {
  await chrome.storage.local.set({ [STORAGE_KEY]: [] });
}

/**
 * Get trend data for a specific dimension.
 * Returns the last N scores for sparkline rendering.
 * @param {string} dimensionId
 * @param {number} limit
 * @returns {Promise<number[]>}
 */
export async function getDimensionTrend(dimensionId, limit = 20) {
  const history = await getHistory();
  return history
    .slice(0, limit)
    .map((h) => h.scores?.[dimensionId]?.score || 0)
    .reverse(); // oldest → newest
}

/**
 * Get overall trend data.
 * @param {number} limit
 * @returns {Promise<number[]>}
 */
export async function getOverallTrend(limit = 20) {
  const history = await getHistory();
  return history
    .slice(0, limit)
    .map((h) => h.overall || 0)
    .reverse();
}

/**
 * Get personal best scores.
 * @returns {Promise<Object>}
 */
export async function getPersonalBests() {
  const history = await getHistory();
  const bests = {};
  for (const entry of history) {
    if (!entry.scores) continue;
    for (const [dimId, dimData] of Object.entries(entry.scores)) {
      const score = dimData?.score || 0;
      if (!bests[dimId] || score > bests[dimId].score) {
        bests[dimId] = { score, timestamp: entry.timestamp };
      }
    }
    // Overall best
    if (!bests.overall || (entry.overall || 0) > bests.overall.score) {
      bests.overall = { score: entry.overall || 0, timestamp: entry.timestamp };
    }
  }
  return bests;
}

/**
 * Get session statistics.
 * @returns {Promise<Object>}
 */
export async function getSessionStats() {
  const history = await getHistory();
  if (history.length === 0) {
    return { total: 0, avgScore: 0, bestGrade: 'F', trend: 'stable' };
  }

  const total = history.length;
  const avgScore = Math.round(
    history.reduce((sum, h) => sum + (h.overall || 0), 0) / total
  );
  const gradeOrder = ['S', 'A', 'B', 'C', 'D', 'F'];
  const bestGrade = history.reduce((best, h) => {
    const idx = gradeOrder.indexOf(h.grade || 'F');
    const bestIdx = gradeOrder.indexOf(best);
    return idx < bestIdx ? h.grade || 'F' : best;
  }, 'F');

  // Trend: compare last 5 vs previous 5
  let trend = 'stable';
  if (history.length >= 6) {
    const recent =
      history.slice(0, 3).reduce((s, h) => s + (h.overall || 0), 0) / 3;
    const older =
      history.slice(3, 6).reduce((s, h) => s + (h.overall || 0), 0) / 3;
    if (recent > older + 5) trend = 'improving';
    else if (recent < older - 5) trend = 'declining';
  }

  return { total, avgScore, bestGrade, trend };
}

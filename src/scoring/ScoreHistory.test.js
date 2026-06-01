import { saveScore, getHistory, clearHistory, getDimensionTrend, getOverallTrend, getPersonalBests, getSessionStats } from './ScoreHistory';

// Mock chrome storage
const storageStore = {};
global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        const result = {};
        keys.forEach(k => {
          result[k] = storageStore[k] || null;
        });
        callback(result);
      }),
      set: jest.fn((obj, callback) => {
        Object.assign(storageStore, obj);
        if (callback) callback();
      })
    }
  }
};

describe('ScoreHistory Service tests', () => {
  beforeEach(() => {
    for (const key in storageStore) {
      delete storageStore[key];
    }
  });

  test('getHistory returns empty array when storage is clean', async () => {
    const history = await getHistory();
    expect(history).toEqual([]);
  });

  test('saveScore correctly appends entry to history', async () => {
    const entry = {
      promptText: 'Write a typescript script',
      scores: { clarity: { score: 85 } },
      overall: 80,
      grade: { letter: 'A' },
      type: 'manual'
    };

    const saved = await saveScore(entry);
    expect(saved).toHaveProperty('id');
    expect(saved.promptText).toBe('Write a typescript script');

    const history = await getHistory();
    expect(history.length).toBe(1);
    expect(history[0].overall).toBe(80);
  });

  test('clearHistory clears storage', async () => {
    await saveScore({ promptText: 'test' });
    await clearHistory();
    const history = await getHistory();
    expect(history).toEqual([]);
  });
});

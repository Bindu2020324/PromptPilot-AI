/**
 * promptBackup.test.js
 *
 * Unit tests for the Export / Import backup utility.
 * Run with: npm test
 */

import { exportPrompts, importPrompts } from '../src/promptBackup';

// ── Mock chrome.storage.local ─────────────────────────────────────────────────

const mockStore = {};

global.chrome = {
  storage: {
    local: {
      get: jest.fn(async (keys) => {
        const result = {};
        keys.forEach((k) => {
          if (k in mockStore) result[k] = mockStore[k];
        });
        return result;
      }),
      set: jest.fn(async (data) => {
        Object.assign(mockStore, data);
      }),
    },
  },
};

// ── Mock DOM APIs used by exportPrompts ──────────────────────────────────────

global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

const clickMock = jest.fn();
const appendChildMock = jest.fn();
const removeChildMock = jest.fn();

jest.spyOn(document, 'createElement').mockImplementation((tag) => {
  if (tag === 'a') return { href: '', download: '', click: clickMock };
  return document.createElement(tag);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBackupFile(data) {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      pp_prompts: data.pp_prompts ?? [],
      pp_history: data.pp_history ?? [],
      pp_score_history: data.pp_score_history ?? [],
    },
  };
  const text = JSON.stringify(backup);
  return new File([text], 'backup.json', { type: 'application/json' });
}

function makeMalformedFile(content) {
  return new File([content], 'bad.json', { type: 'application/json' });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset mock store
  Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  jest.clearAllMocks();
});

// Export ──────────────────────────────────────────────────────────────────────

describe('exportPrompts', () => {
  it('returns success and triggers a download', async () => {
    mockStore.pp_prompts = [{ id: '1', title: 'Hello' }];
    mockStore.pp_history = [];
    mockStore.pp_score_history = [];

    const result = await exportPrompts();

    expect(result.success).toBe(true);
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('exports empty arrays when storage is empty', async () => {
    const result = await exportPrompts();
    expect(result.success).toBe(true);
  });
});

// Import — happy paths ─────────────────────────────────────────────────────────

describe('importPrompts — merge mode', () => {
  it('imports new prompts without touching existing ones', async () => {
    mockStore.pp_prompts = [{ id: 'existing-1', title: 'Existing' }];
    mockStore.pp_history = [];
    mockStore.pp_score_history = [];

    const file = makeBackupFile({
      pp_prompts: [{ id: 'new-1', title: 'New prompt' }],
    });

    const result = await importPrompts(file, 'merge');

    expect(result.success).toBe(true);
    expect(mockStore.pp_prompts).toHaveLength(2);
    expect(mockStore.pp_prompts.map((p) => p.id)).toContain('existing-1');
    expect(mockStore.pp_prompts.map((p) => p.id)).toContain('new-1');
  });

  it('skips duplicate prompts in merge mode', async () => {
    mockStore.pp_prompts = [{ id: 'dupe-1', title: 'Original' }];
    mockStore.pp_history = [];
    mockStore.pp_score_history = [];

    const file = makeBackupFile({
      pp_prompts: [{ id: 'dupe-1', title: 'Duplicate — should be skipped' }],
    });

    const result = await importPrompts(file, 'merge');

    expect(result.success).toBe(true);
    expect(mockStore.pp_prompts).toHaveLength(1);
    expect(mockStore.pp_prompts[0].title).toBe('Original');
  });
});

describe('importPrompts — overwrite mode', () => {
  it('replaces duplicates with incoming data', async () => {
    mockStore.pp_prompts = [{ id: 'dupe-1', title: 'Old title' }];
    mockStore.pp_history = [];
    mockStore.pp_score_history = [];

    const file = makeBackupFile({
      pp_prompts: [{ id: 'dupe-1', title: 'Updated title' }],
    });

    const result = await importPrompts(file, 'overwrite');

    expect(result.success).toBe(true);
    expect(mockStore.pp_prompts).toHaveLength(1);
    expect(mockStore.pp_prompts[0].title).toBe('Updated title');
  });
});

// Import — validation failures ────────────────────────────────────────────────

describe('importPrompts — validation', () => {
  it('rejects malformed JSON', async () => {
    const file = makeMalformedFile('not json at all {{{{');
    const result = await importPrompts(file, 'merge');
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/JSON/i);
  });

  it('rejects JSON missing version field', async () => {
    const bad = JSON.stringify({ data: { pp_prompts: [], pp_history: [], pp_score_history: [] } });
    const file = makeMalformedFile(bad);
    const result = await importPrompts(file, 'merge');
    expect(result.success).toBe(false);
  });

  it('rejects JSON missing data field', async () => {
    const bad = JSON.stringify({ version: 1 });
    const file = makeMalformedFile(bad);
    const result = await importPrompts(file, 'merge');
    expect(result.success).toBe(false);
  });

  it('rejects JSON with non-array data fields', async () => {
    const bad = JSON.stringify({
      version: 1,
      data: { pp_prompts: 'wrong', pp_history: [], pp_score_history: [] },
    });
    const file = makeMalformedFile(bad);
    const result = await importPrompts(file, 'merge');
    expect(result.success).toBe(false);
  });
});

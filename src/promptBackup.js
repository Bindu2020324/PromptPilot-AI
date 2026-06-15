/**
 * promptBackup.js
 * Handles Export and Import of saved prompts / history / score history
 * as a structured JSON backup file.
 *
 * Storage keys used by PromptPilot:
 *   pp_prompts       – versioned prompt storage
 *   pp_history       – history list
 *   pp_score_history – score trend data
 */

const BACKUP_VERSION = 1;
const STORAGE_KEYS = ['pp_prompts', 'pp_history', 'pp_score_history'];

// ─── Export ──────────────────────────────────────────────────────────────────

/**
 * Reads all PromptPilot data from chrome.storage.local and triggers a
 * .json file download in the browser.
 *
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function exportPrompts() {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEYS);

    const backup = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        pp_prompts: data.pp_prompts ?? [],
        pp_history: data.pp_history ?? [],
        pp_score_history: data.pp_score_history ?? [],
      },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptpilot-backup-${formatDateForFilename()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return { success: true, message: 'Prompts exported successfully!' };
  } catch (err) {
    console.error('[PromptPilot] Export error:', err);
    return { success: false, message: `Export failed: ${err.message}` };
  }
}

// ─── Import ──────────────────────────────────────────────────────────────────

/**
 * Reads a user-selected .json backup file and merges/overwrites data
 * into chrome.storage.local.
 *
 * @param {File}   file        – File object from an <input type="file"> element
 * @param {'merge'|'overwrite'} mode – How to handle duplicate prompts
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function importPrompts(file, mode = 'merge') {
  try {
    const text = await readFileAsText(file);
    const backup = safeParseJSON(text);

    const validation = validateBackup(backup);
    if (!validation.valid) {
      return { success: false, message: `Invalid backup file: ${validation.reason}` };
    }

    const incoming = backup.data;
    const existing = await chrome.storage.local.get(STORAGE_KEYS);

    const merged = {
      pp_prompts: mergeArrays(
        existing.pp_prompts ?? [],
        incoming.pp_prompts ?? [],
        mode,
        identifyPrompt
      ),
      pp_history: mergeArrays(
        existing.pp_history ?? [],
        incoming.pp_history ?? [],
        mode,
        identifyHistory
      ),
      pp_score_history: mergeArrays(
        existing.pp_score_history ?? [],
        incoming.pp_score_history ?? [],
        mode,
        identifyScore
      ),
    };

    await chrome.storage.local.set(merged);

    const count = (incoming.pp_prompts ?? []).length;
    return {
      success: true,
      message: `Imported ${count} prompt(s) successfully! (mode: ${mode})`,
    };
  } catch (err) {
    console.error('[PromptPilot] Import error:', err);
    return { success: false, message: `Import failed: ${err.message}` };
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateBackup(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, reason: 'File is not a valid JSON object.' };
  }
  if (typeof parsed.version !== 'number') {
    return { valid: false, reason: 'Missing or invalid "version" field.' };
  }
  if (!parsed.data || typeof parsed.data !== 'object') {
    return { valid: false, reason: 'Missing "data" section.' };
  }
  const { pp_prompts, pp_history, pp_score_history } = parsed.data;
  if (
    !Array.isArray(pp_prompts) ||
    !Array.isArray(pp_history) ||
    !Array.isArray(pp_score_history)
  ) {
    return { valid: false, reason: 'One or more data arrays are missing or malformed.' };
  }
  return { valid: true };
}

// ─── Merge helpers ────────────────────────────────────────────────────────────

/**
 * Merges two arrays based on the chosen mode.
 * - merge:     keep existing, skip items already present (by identity key)
 * - overwrite: replace duplicates with incoming version
 */
function mergeArrays(existing, incoming, mode, identityFn) {
  if (mode === 'overwrite') {
    const existingMap = new Map(existing.map((item) => [identityFn(item), item]));
    incoming.forEach((item) => existingMap.set(identityFn(item), item));
    return Array.from(existingMap.values());
  }

  // merge (default): keep existing, skip duplicates
  const existingKeys = new Set(existing.map(identityFn));
  const newItems = incoming.filter((item) => !existingKeys.has(identityFn(item)));
  return [...existing, ...newItems];
}

// Identity functions – adjust these if the actual data shape differs
const identifyPrompt = (p) => p?.id ?? p?.title ?? JSON.stringify(p);
const identifyHistory = (h) => h?.id ?? h?.timestamp ?? JSON.stringify(h);
const identifyScore = (s) => s?.id ?? s?.timestamp ?? JSON.stringify(s);

// ─── Utilities ────────────────────────────────────────────────────────────────

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsText(file);
  });
}

function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }
}

function formatDateForFilename() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

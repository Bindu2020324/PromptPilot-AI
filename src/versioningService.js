// ═══════════════════════════════════════════════════════════════════════
// Prompt Versioning Service
// Manages storage and retrieval of prompt versions with history tracking
// ═══════════════════════════════════════════════════════════════════════

const STORAGE_KEY_PROMPTS = 'pp_prompts';
const STORAGE_KEY_METADATA = 'pp_metadata';
const STORAGE_KEY_SEARCHES = 'pp_recent_searches';
const EXPORT_VERSION = 1;
const MAX_PROMPTS = 100;

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePromptForDedup(prompt = {}) {
  return (prompt.original_text || '').trim().toLowerCase();
}

function sanitizeVersion(version = {}, index = 0) {
  const now = Date.now();
  return {
    version_number: asNumber(version.version_number, index + 1),
    enhanced_prompt: String(version.enhanced_prompt || ''),
    clarity_score: asNumber(version.clarity_score),
    specificity_score: asNumber(version.specificity_score),
    quality_score: asNumber(version.quality_score),
    domain_detected: String(version.domain_detected || ''),
    missing_requirements: Array.isArray(version.missing_requirements)
      ? version.missing_requirements
      : [],
    transformation_insight: String(version.transformation_insight || ''),
    ambiguities_resolved: Array.isArray(version.ambiguities_resolved)
      ? version.ambiguities_resolved
      : [],
    provider: String(version.provider || 'gemini'),
    model: String(version.model || 'gemini-pro'),
    created_at: asNumber(version.created_at, now),
    change_note: String(version.change_note || `Version ${index + 1}`),
  };
}

function sanitizePromptForImport(prompt = {}, index = 0) {
  const now = Date.now();
  const id = typeof prompt.id === 'string' && prompt.id.trim()
    ? prompt.id
    : `pp_import_${now}_${index}`;
  const versions = Array.isArray(prompt.versions)
    ? prompt.versions.map((v, i) => sanitizeVersion(v, i))
    : [];

  // Keep latest first so app behavior remains consistent.
  versions.sort((a, b) => b.created_at - a.created_at);
  versions.forEach((v, i) => {
    v.version_number = versions.length - i;
  });

  return {
    id,
    original_text: String(prompt.original_text || '').trim(),
    domain: String(prompt.domain || ''),
    mode: String(prompt.mode || 'technical'),
    versions,
    created_at: asNumber(prompt.created_at, now),
    updated_at: asNumber(prompt.updated_at, now),
    tags: Array.isArray(prompt.tags) ? prompt.tags : [],
  };
}

function toLegacyHistory(prompts = []) {
  return prompts
    .map((prompt) => {
      const latest = prompt.versions?.[0];
      if (!latest) return null;
      return {
        enhanced_prompt: latest.enhanced_prompt,
        clarity_score: latest.clarity_score,
        specificity_score: latest.specificity_score,
        quality_score: latest.quality_score,
        domain_detected: latest.domain_detected,
        missing_requirements: latest.missing_requirements || [],
        transformation_insight: latest.transformation_insight || '',
        ambiguities_resolved: latest.ambiguities_resolved || [],
        provider: latest.provider || 'gemini',
        model: latest.model || 'gemini-pro',
        original: prompt.original_text,
        mode: prompt.mode || 'technical',
        domain: prompt.domain || '',
        ts: prompt.updated_at || Date.now(),
        favorite: false,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 50);
}

export const versioningService = {
  /**
   * Get all prompts with their version history
   */
  async getAllPrompts() {
    return new Promise((res) => {
      chrome.storage.local.get([STORAGE_KEY_PROMPTS], (data) => {
        const prompts = data[STORAGE_KEY_PROMPTS] || [];
        res(prompts.sort((a, b) => b.updated_at - a.updated_at));
      });
    });
  },

  /**
   * Get a specific prompt by ID
   */
  async getPromptById(id) {
    const prompts = await this.getAllPrompts();
    return prompts.find((p) => p.id === id) || null;
  },

  /**
   * Create a new prompt entry with first version
   */
  async createPrompt(originalText, enhancedData, metadata = {}) {
    const prompts = await this.getAllPrompts();
    const id = `pp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = Date.now();

    const version = {
      version_number: 1,
      enhanced_prompt: enhancedData.enhanced_prompt,
      clarity_score: enhancedData.clarity_score,
      specificity_score: enhancedData.specificity_score,
      quality_score: enhancedData.quality_score,
      domain_detected: enhancedData.domain_detected,
      missing_requirements: enhancedData.missing_requirements,
      transformation_insight: enhancedData.transformation_insight,
      ambiguities_resolved: enhancedData.ambiguities_resolved,
      provider: metadata.provider || 'gemini',
      model: metadata.model || 'gemini-pro',
      created_at: now,
      change_note: metadata.change_note || 'Initial version',
    };

    const prompt = {
      id,
      original_text: originalText,
      domain: metadata.domain || '',
      mode: metadata.mode || 'technical',
      versions: [version],
      created_at: now,
      updated_at: now,
      tags: metadata.tags || [],
      favorite: false,
    };

    const updated = [prompt, ...prompts].slice(0, MAX_PROMPTS); // Keep max prompts
    await new Promise((res) => {
      chrome.storage.local.set({ [STORAGE_KEY_PROMPTS]: updated }, res);
    });

    return prompt;
  },

  /**
   * Add a new version to an existing prompt
   */
  async addVersion(promptId, enhancedData, metadata = {}) {
    const prompts = await this.getAllPrompts();
    const prompt = prompts.find((p) => p.id === promptId);
    if (!prompt) throw new Error(`Prompt ${promptId} not found`);

    const nextVersion = (prompt.versions[0]?.version_number || 0) + 1;
    const now = Date.now();

    const version = {
      version_number: nextVersion,
      enhanced_prompt: enhancedData.enhanced_prompt,
      clarity_score: enhancedData.clarity_score,
      specificity_score: enhancedData.specificity_score,
      quality_score: enhancedData.quality_score,
      domain_detected: enhancedData.domain_detected,
      missing_requirements: enhancedData.missing_requirements,
      transformation_insight: enhancedData.transformation_insight,
      ambiguities_resolved: enhancedData.ambiguities_resolved,
      provider: metadata.provider || 'gemini',
      model: metadata.model || 'gemini-pro',
      created_at: now,
      change_note: metadata.change_note || `Version ${nextVersion}`,
    };

    prompt.versions.unshift(version); // Latest version at front
    prompt.updated_at = now;

    const updated = prompts.map((p) => (p.id === promptId ? prompt : p));
    await new Promise((res) => {
      chrome.storage.local.set({ [STORAGE_KEY_PROMPTS]: updated }, res);
    });

    return prompt;
  },

  /**
   * Update the updated_at timestamp of a prompt (moves it to top of recent)
   */
  async touchPrompt(promptId) {
    const prompts = await this.getAllPrompts();
    const now = Date.now();
    const updated = prompts.map((p) => 
      p.id === promptId ? { ...p, updated_at: now } : p
    ).sort((a, b) => b.updated_at - a.updated_at);
    
    await new Promise((res) => {
      chrome.storage.local.set({ [STORAGE_KEY_PROMPTS]: updated }, res);
    });
    return updated;
  },

  /**
   * Get a specific version of a prompt
   */
  async getVersion(promptId, versionNumber) {
    const prompt = await this.getPromptById(promptId);
    if (!prompt) return null;
    return (
      prompt.versions.find((v) => v.version_number === versionNumber) || null
    );
  },

  /**
   * Restore a prompt to a previous version (creates new version from old)
   */
  async restoreVersion(promptId, sourceVersionNumber) {
    const prompt = await this.getPromptById(promptId);
    if (!prompt) throw new Error(`Prompt ${promptId} not found`);

    const sourceVersion = prompt.versions.find(
      (v) => v.version_number === sourceVersionNumber
    );
    if (!sourceVersion) {
      throw new Error(`Version ${sourceVersionNumber} not found`);
    }

    // Create a new version based on the old one
    const nextVersion = (prompt.versions[0]?.version_number || 0) + 1;
    const now = Date.now();

    const newVersion = {
      ...sourceVersion,
      version_number: nextVersion,
      created_at: now,
      change_note: `Restored from v${sourceVersionNumber}`,
    };

    prompt.versions.unshift(newVersion);
    prompt.updated_at = now;

    const prompts = await this.getAllPrompts();
    const updated = prompts.map((p) => (p.id === promptId ? prompt : p));

    await new Promise((res) => {
      chrome.storage.local.set({ [STORAGE_KEY_PROMPTS]: updated }, res);
    });

    return prompt;
  },

  /**
   * Compare two versions and return diff
   */
  compareVersions(version1, version2) {
    return {
      version1Number: version1.version_number,
      version2Number: version2.version_number,
      version1: version1,
      version2: version2,
      changes: {
        clarityDiff: version2.clarity_score - version1.clarity_score,
        specificityDiff:
          version2.specificity_score - version1.specificity_score,
        qualityDiff: version2.quality_score - version1.quality_score,
      },
    };
  },

  /**
   * Delete a prompt and all its versions
   */
  async deletePrompt(promptId) {
    const prompts = await this.getAllPrompts();
    const updated = prompts.filter((p) => p.id !== promptId);
    await new Promise((res) => {
      chrome.storage.local.set({ [STORAGE_KEY_PROMPTS]: updated }, res);
    });
  },

  /**
   * Clear all prompts and history
   */
  async clearAll() {
    await new Promise((res) => {
      chrome.storage.local.set({ [STORAGE_KEY_PROMPTS]: [] }, res);
    });
  },

  /**
   * Recent Search History
   */
  async getRecentSearches() {
    return new Promise((res) => {
      chrome.storage.local.get([STORAGE_KEY_SEARCHES], (data) => {
        res(data[STORAGE_KEY_SEARCHES] || []);
      });
    });
  },

  async saveSearch(query) {
    if (!query || !query.trim() || query.length < 3) return;
    const searches = await this.getRecentSearches();
    const updated = [query.trim(), ...searches.filter(s => s !== query.trim())].slice(0, 5);
    await new Promise((res) => {
      chrome.storage.local.set({ [STORAGE_KEY_SEARCHES]: updated }, res);
    });
    return updated;
  },

  async exportPrompts() {
    const prompts = await this.getAllPrompts();
    const legacyHistory = toLegacyHistory(prompts);
    return {
      format: 'promptpilot.prompts',
      version: EXPORT_VERSION,
      exported_at: Date.now(),
      prompt_count: prompts.length,
      prompts,
      legacy_history: legacyHistory,
    };
  },

  validateImportPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid JSON: expected an object payload.');
    }
    if (!Array.isArray(payload.prompts) && !Array.isArray(payload.legacy_history)) {
      throw new Error('Invalid JSON: expected "prompts" or "legacy_history" array.');
    }

    let sourcePrompts = Array.isArray(payload.prompts) ? payload.prompts : [];
    if (sourcePrompts.length === 0 && Array.isArray(payload.legacy_history)) {
      sourcePrompts = payload.legacy_history.map((item, idx) => ({
        id: `pp_legacy_import_${Date.now()}_${idx}`,
        original_text: item.original || '',
        domain: item.domain || '',
        mode: item.mode || 'technical',
        created_at: item.ts || Date.now(),
        updated_at: item.ts || Date.now(),
        versions: [
          {
            version_number: 1,
            enhanced_prompt: item.enhanced_prompt || '',
            clarity_score: item.clarity_score || 0,
            specificity_score: item.specificity_score || 0,
            quality_score: item.quality_score || 0,
            domain_detected: item.domain_detected || '',
            missing_requirements: item.missing_requirements || [],
            transformation_insight: item.transformation_insight || '',
            ambiguities_resolved: item.ambiguities_resolved || [],
            provider: item.provider || 'gemini',
            model: item.model || 'gemini-pro',
            created_at: item.ts || Date.now(),
            change_note: 'Imported from legacy backup',
          },
        ],
      }));
    }

    const sanitizedPrompts = sourcePrompts.map((prompt, index) =>
      sanitizePromptForImport(prompt, index)
    );

    const validPrompts = sanitizedPrompts.filter(
      (prompt) =>
        prompt.original_text &&
        Array.isArray(prompt.versions) &&
        prompt.versions.length > 0
    );

    if (validPrompts.length === 0) {
      throw new Error('No valid prompts found in import file.');
    }

    return validPrompts;
  },

  async importPrompts(payload, options = {}) {
    const { mode = 'merge' } = options;
    if (!['merge', 'overwrite'].includes(mode)) {
      throw new Error('Invalid import mode. Use "merge" or "overwrite".');
    }

    const importedPrompts = this.validateImportPayload(payload);
    const existingPrompts = mode === 'overwrite' ? [] : await this.getAllPrompts();
    const existingByKey = new Map(
      existingPrompts.map((prompt) => [normalizePromptForDedup(prompt), prompt])
    );

    let added = 0;
    let replaced = 0;
    let skipped = 0;
    const merged = [...existingPrompts];

    for (const incoming of importedPrompts) {
      const key = normalizePromptForDedup(incoming);
      if (!key) {
        skipped += 1;
        continue;
      }

      const existing = existingByKey.get(key);
      if (!existing) {
        merged.push(incoming);
        existingByKey.set(key, incoming);
        added += 1;
        continue;
      }

      if (mode === 'merge') {
        skipped += 1;
        continue;
      }

      const idx = merged.findIndex((p) => p.id === existing.id);
      if (idx >= 0) merged[idx] = incoming;
      existingByKey.set(key, incoming);
      replaced += 1;
    }

    const dedupedSorted = merged
      .sort((a, b) => asNumber(b.updated_at) - asNumber(a.updated_at))
      .slice(0, MAX_PROMPTS);
    await new Promise((res) => {
      chrome.storage.local.set(
        {
          [STORAGE_KEY_PROMPTS]: dedupedSorted,
          pp_history: toLegacyHistory(dedupedSorted),
        },
        res
      );
    });

    return {
      totalInFile: importedPrompts.length,
      imported: added + replaced,
      added,
      replaced,
      skipped,
      mode,
      prompts: dedupedSorted,
    };
  },

  /**
   * Migrate legacy flat history to versioned format
   */
  async migrateFromLegacy() {
    return new Promise((res) => {
      chrome.storage.local.get(
        ['pp_history', STORAGE_KEY_PROMPTS],
        async (data) => {
          const legacyHistory = data.pp_history || [];
          const existingPrompts = data[STORAGE_KEY_PROMPTS] || [];

          if (legacyHistory.length === 0 || existingPrompts.length > 0) {
            if (legacyHistory.length > 0) {
              await new Promise((res2) => {
                chrome.storage.local.remove(['pp_history'], res2);
              });
            }
            res();
            return;
          }

          const prompts = [];
          // Group by original text and create versioned entries
          const grouped = {};
          legacyHistory.forEach((item) => {
            const key = item.original || 'unknown';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
          });

          let id_counter = 1;
          Object.values(grouped).forEach((items) => {
            // Sort by timestamp
            items.sort((a, b) => a.ts - b.ts);

            const id = `pp_legacy_${id_counter++}`;
            const versions = items.map((item, idx) => ({
              version_number: idx + 1,
              enhanced_prompt: item.enhanced_prompt,
              clarity_score: item.clarity_score,
              specificity_score: item.specificity_score,
              quality_score: item.quality_score,
              domain_detected: item.domain_detected,
              missing_requirements: item.missing_requirements || [],
              transformation_insight: item.transformation_insight || '',
              ambiguities_resolved: item.ambiguities_resolved || [],
              provider: item.provider || 'gemini',
              model: item.model || 'gemini-pro',
              created_at: item.ts,
              change_note: `Migrated (v${idx + 1})`,
            }));

            prompts.push({
              id,
              original_text: items[0].original,
              domain: items[0].domain || '',
              mode: items[0].mode || 'technical',
              versions: versions.reverse(), // Most recent first
              created_at: items[0].ts,
              updated_at: items[items.length - 1].ts,
              tags: [],
              favorite: items.some((item) => item.favorite) || false,
            });
          });

          await new Promise((res2) => {
            chrome.storage.local.set({ [STORAGE_KEY_PROMPTS]: prompts }, res2);
          });

          // Clear legacy storage
          await new Promise((res2) => {
            chrome.storage.local.remove(['pp_history'], res2);
          });

          res();
        }
      );
    });
  },
};

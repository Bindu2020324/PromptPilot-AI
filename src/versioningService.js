// ═══════════════════════════════════════════════════════════════════════
// Prompt Versioning Service
// Manages storage and retrieval of prompt versions with history tracking
// ═══════════════════════════════════════════════════════════════════════

const STORAGE_KEY_PROMPTS = 'pp_prompts';
const STORAGE_KEY_METADATA = 'pp_metadata';

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
    };

    const updated = [prompt, ...prompts].slice(0, 100); // Keep max 100 prompts
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
   * Get a specific version of a prompt
   */
  async getVersion(promptId, versionNumber) {
    const prompt = await this.getPromptById(promptId);
    if (!prompt) return null;
    return prompt.versions.find((v) => v.version_number === versionNumber) || null;
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
        specificityDiff: version2.specificity_score - version1.specificity_score,
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
   * Migrate legacy flat history to versioned format
   */
  async migrateFromLegacy() {
    return new Promise((res) => {
      chrome.storage.local.get(['pp_history'], async (data) => {
        const legacyHistory = data.pp_history || [];
        if (legacyHistory.length === 0) {
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
      });
    });
  },
};

import { versioningService } from './versioningService';

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
      }),
      remove: jest.fn((keys, callback) => {
        keys.forEach(k => {
          delete storageStore[k];
        });
        if (callback) callback();
      })
    }
  }
};

describe('versioningService tests', () => {
  beforeEach(() => {
    for (const key in storageStore) {
      delete storageStore[key];
    }
  });

  test('getAllPrompts returns sorted prompts or empty array', async () => {
    const prompts = await versioningService.getAllPrompts();
    expect(prompts).toEqual([]);
  });

  test('createPrompt saves a new prompt to storage', async () => {
    const original = 'Test original text';
    const enhancedData = {
      enhanced_prompt: 'Test enhanced prompt',
      clarity_score: 90,
      specificity_score: 85,
      quality_score: 88,
      domain_detected: 'frontend',
      missing_requirements: [],
      transformation_insight: 'None',
      ambiguities_resolved: []
    };

    const prompt = await versioningService.createPrompt(original, enhancedData, {
      provider: 'groq',
      model: 'llama-3'
    });

    expect(prompt.original_text).toBe(original);
    expect(prompt.versions[0].enhanced_prompt).toBe(enhancedData.enhanced_prompt);

    const all = await versioningService.getAllPrompts();
    expect(all.length).toBe(1);
  });
});

/**
 * exportUtils.test.js
 *
 * Unit tests for the Export / Copy prompt history utility functions.
 * Run with: npm test
 */

import { exportHistoryAsJSON, generateHistoryMarkdown } from './exportUtils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePrompt(overrides = {}) {
  return {
    id: 'pp_12345_abc',
    original_text: 'Build a responsive login page',
    domain: 'frontend',
    mode: 'technical',
    favorite: false,
    created_at: 1718812345678,
    updated_at: 1718812400000,
    versions: [
      {
        version_number: 2,
        enhanced_prompt:
          'Create a responsive login page with email and password fields...',
        clarity_score: 90,
        specificity_score: 85,
        quality_score: 88,
        domain_detected: 'frontend',
        missing_requirements: ['error handling'],
        transformation_insight:
          'Added specific field types and validation requirements',
        ambiguities_resolved: ['responsive breakpoint'],
        provider: 'gemini',
        model: 'gemini-pro',
        created_at: 1718812400000,
        change_note: 'Re-enhanced with validation details',
      },
      {
        version_number: 1,
        enhanced_prompt: 'Create a responsive login page...',
        clarity_score: 75,
        specificity_score: 70,
        quality_score: 72,
        domain_detected: 'frontend',
        missing_requirements: [],
        transformation_insight: 'Initial enhancement',
        ambiguities_resolved: [],
        provider: 'gemini',
        model: 'gemini-pro',
        created_at: 1718812345678,
        change_note: 'Initial version',
      },
    ],
    tags: [],
    ...overrides,
  };
}

// ── exportHistoryAsJSON ───────────────────────────────────────────────────────

describe('exportHistoryAsJSON', () => {
  it('returns valid JSON that can be parsed', () => {
    const prompts = [makePrompt()];
    const { content } = exportHistoryAsJSON(prompts);
    const parsed = JSON.parse(content);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it('filename ends with .json and contains promptpilot-history', () => {
    const { filename } = exportHistoryAsJSON([]);
    expect(filename).toMatch(/^promptpilot-history-.+\.json$/);
  });

  it('filename timestamp has no colons or dots', () => {
    const { filename } = exportHistoryAsJSON([]);
    const timestampPart = filename.replace('promptpilot-history-', '').replace('.json', '');
    expect(timestampPart).not.toMatch(/[:.]/);
  });

  it('includes all prompt fields', () => {
    const prompts = [makePrompt()];
    const { content } = exportHistoryAsJSON(prompts);
    const parsed = JSON.parse(content);
    const p = parsed[0];
    expect(p.id).toBe('pp_12345_abc');
    expect(p.original_text).toBe('Build a responsive login page');
    expect(p.domain).toBe('frontend');
    expect(p.mode).toBe('technical');
    expect(p.favorite).toBe(false);
    expect(p.created_at).toBe(1718812345678);
    expect(p.updated_at).toBe(1718812400000);
    expect(p.versions).toHaveLength(2);
  });

  it('includes version scores and metadata', () => {
    const prompts = [makePrompt()];
    const { content } = exportHistoryAsJSON(prompts);
    const parsed = JSON.parse(content);
    const v = parsed[0].versions[0];
    expect(v.version_number).toBe(2);
    expect(v.clarity_score).toBe(90);
    expect(v.specificity_score).toBe(85);
    expect(v.quality_score).toBe(88);
    expect(v.provider).toBe('gemini');
    expect(v.model).toBe('gemini-pro');
    expect(v.change_note).toBe('Re-enhanced with validation details');
    expect(v.transformation_insight).toContain('Added specific field types');
  });

  it('handles empty prompts array', () => {
    const { content, filename } = exportHistoryAsJSON([]);
    const parsed = JSON.parse(content);
    expect(parsed).toEqual([]);
    expect(filename).toMatch(/\.json$/);
  });

  it('formats JSON with indentation', () => {
    const prompts = [makePrompt()];
    const { content } = exportHistoryAsJSON(prompts);
    expect(content).toContain('  "id"');
    expect(content).toContain('  "original_text"');
  });

  it('exports multiple prompts', () => {
    const prompts = [makePrompt({ id: '1' }), makePrompt({ id: '2' })];
    const { content } = exportHistoryAsJSON(prompts);
    const parsed = JSON.parse(content);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe('1');
    expect(parsed[1].id).toBe('2');
  });
});

// ── generateHistoryMarkdown ───────────────────────────────────────────────────

describe('generateHistoryMarkdown', () => {
  it('filename ends with .md and contains promptpilot-history', () => {
    const { filename } = generateHistoryMarkdown([]);
    expect(filename).toMatch(/^promptpilot-history-.+\.md$/);
  });

  it('contains header with title and prompt count', () => {
    const prompts = [makePrompt()];
    const { content } = generateHistoryMarkdown(prompts);
    expect(content).toContain('# PromptPilot AI - Exported Prompt History');
    expect(content).toContain('Total Prompts: 1');
  });

  it('includes original prompt text', () => {
    const prompts = [makePrompt()];
    const { content } = generateHistoryMarkdown(prompts);
    expect(content).toContain('Build a responsive login page');
  });

  it('includes domain and mode', () => {
    const prompts = [makePrompt()];
    const { content } = generateHistoryMarkdown(prompts);
    expect(content).toContain('**Domain:** frontend');
    expect(content).toContain('**Mode:** technical');
  });

  it('shows favorite status', () => {
    const fav = makePrompt({ favorite: true });
    const { content } = generateHistoryMarkdown([fav]);
    expect(content).toContain('⭐ Favorite');
  });

  it('shows standard status when not favorite', () => {
    const std = makePrompt({ favorite: false });
    const { content } = generateHistoryMarkdown([std]);
    expect(content).toContain('Standard');
  });

  it('includes version number and scores', () => {
    const prompts = [makePrompt()];
    const { content } = generateHistoryMarkdown(prompts);
    expect(content).toContain('#### Version 2');
    expect(content).toContain('Clarity: 90');
    expect(content).toContain('Specificity: 85');
    expect(content).toContain('Quality: 88');
  });

  it('marks latest version with (Latest) label', () => {
    const prompts = [makePrompt()];
    const { content } = generateHistoryMarkdown(prompts);
    expect(content).toContain('#### Version 2 (Latest)');
    expect(content).not.toContain('#### Version 1 (Latest)');
  });

  it('includes provider and model', () => {
    const prompts = [makePrompt()];
    const { content } = generateHistoryMarkdown(prompts);
    expect(content).toContain('**AI Provider:** gemini (gemini-pro)');
  });

  it('includes change note when present', () => {
    const prompts = [makePrompt()];
    const { content } = generateHistoryMarkdown(prompts);
    expect(content).toContain(
      '**Change Note:** *Re-enhanced with validation details*'
    );
  });

  it('includes transformation insight when present', () => {
    const prompts = [makePrompt()];
    const { content } = generateHistoryMarkdown(prompts);
    expect(content).toContain(
      '**Insight:** Added specific field types and validation requirements'
    );
  });

  it('wraps enhanced prompt in code blocks', () => {
    const prompts = [makePrompt()];
    const { content } = generateHistoryMarkdown(prompts);
    expect(content).toContain(
      '```\nCreate a responsive login page with email and password fields...\n```'
    );
  });

  it('handles empty prompts array', () => {
    const { content } = generateHistoryMarkdown([]);
    expect(content).toContain('Total Prompts: 0');
    expect(content).not.toContain('## 1.');
  });

  it('handles prompt with empty versions array', () => {
    const prompts = [makePrompt({ versions: [] })];
    const { content } = generateHistoryMarkdown(prompts);
    expect(content).toContain('Build a responsive login page');
    expect(content).toContain('### Version History');
  });

  it('handles missing domain gracefully', () => {
    const prompts = [makePrompt({ domain: '' })];
    const { content } = generateHistoryMarkdown(prompts);
    expect(content).toContain('**Domain:** General');
  });

  it('handles missing optional version fields', () => {
    const prompts = [
      makePrompt({
        versions: [
          {
            version_number: 1,
            enhanced_prompt: 'Enhanced text',
            clarity_score: 80,
            specificity_score: 75,
            quality_score: 77,
            created_at: 1718812345678,
          },
        ],
      }),
    ];
    const { content } = generateHistoryMarkdown(prompts);
    expect(content).toContain('**AI Provider:** Gemini (gemini-pro)');
    expect(content).not.toContain('**Change Note:**');
    expect(content).not.toContain('**Insight:**');
  });

  it('exports multiple prompts with separator lines', () => {
    const prompts = [makePrompt({ id: '1' }), makePrompt({ id: '2' })];
    const { content } = generateHistoryMarkdown(prompts);
    const sections = content.split('---');
    expect(sections.length).toBeGreaterThanOrEqual(3);
  });
});

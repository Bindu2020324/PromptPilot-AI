// ═══════════════════════════════════════════════════════════════════════
// PromptPilot AI — Prompt Scoring Engine
// Client-side scoring across 8 dimensions — zero API calls needed
// ═══════════════════════════════════════════════════════════════════════

// ── Dimension definitions ─────────────────────────────────────────────
export const DIMENSIONS = [
  { id: 'clarity',      label: 'Clarity',           color: '#a78bfa', icon: '◉', weight: 1.2 },
  { id: 'specificity',  label: 'Specificity',       color: '#34d399', icon: '◎', weight: 1.3 },
  { id: 'actionability',label: 'Actionability',     color: '#60a5fa', icon: '▸', weight: 1.1 },
  { id: 'context',      label: 'Context Richness',  color: '#fbbf24', icon: '◈', weight: 1.0 },
  { id: 'constraints',  label: 'Constraints',       color: '#22d3ee', icon: '⊞', weight: 0.9 },
  { id: 'outputFormat', label: 'Output Format',     color: '#f472b6', icon: '⊟', weight: 0.8 },
  { id: 'edgeCases',    label: 'Edge Cases',        color: '#fb923c', icon: '⚡', weight: 0.7 },
  { id: 'bestPractices',label: 'Best Practices',    color: '#2dd4bf', icon: '✦', weight: 0.8 },
];

// ── Keyword dictionaries ──────────────────────────────────────────────
const VAGUE_WORDS = [
  'good', 'nice', 'thing', 'stuff', 'something', 'some', 'make',
  'do', 'help', 'create', 'build', 'write', 'just', 'simple',
  'basic', 'easy', 'quick', 'better', 'improve', 'fix', 'change',
  'update', 'modify', 'maybe', 'probably', 'kind of', 'sort of',
  'like', 'whatever', 'etc', 'and so on', 'anything', 'everything',
];

const ACTION_VERBS = [
  'implement', 'design', 'architect', 'develop', 'integrate', 'optimize',
  'analyze', 'evaluate', 'compare', 'benchmark', 'test', 'validate',
  'debug', 'refactor', 'deploy', 'configure', 'migrate', 'transform',
  'generate', 'synthesize', 'extract', 'classify', 'predict', 'summarize',
  'document', 'explain', 'enumerate', 'outline', 'define', 'specify',
  'ensure', 'enforce', 'verify', 'audit', 'review', 'calculate',
];

const CONTEXT_SIGNALS = [
  'because', 'since', 'given that', 'assuming', 'in the context of',
  'for the purpose of', 'background', 'scenario', 'use case',
  'target audience', 'stakeholder', 'requirement', 'objective',
  'goal', 'constraint', 'limitation', 'assumption', 'prerequisite',
  'currently', 'existing', 'legacy', 'previous', 'prior',
  'environment', 'production', 'staging', 'development',
];

const CONSTRAINT_SIGNALS = [
  'must', 'should', 'shall', 'cannot', 'must not', 'do not', 'avoid',
  'limit', 'restrict', 'within', 'maximum', 'minimum', 'at least',
  'at most', 'no more than', 'no less than', 'exactly', 'only',
  'required', 'mandatory', 'optional', 'forbidden', 'prohibited',
  'deadline', 'budget', 'scope', 'boundary', 'threshold',
];

const OUTPUT_FORMAT_SIGNALS = [
  'json', 'xml', 'csv', 'markdown', 'table', 'list', 'bullet',
  'numbered', 'code', 'snippet', 'example', 'template', 'schema',
  'format', 'structure', 'layout', 'diagram', 'chart', 'graph',
  'step by step', 'step-by-step', 'sections', 'headers', 'paragraphs',
  'response should', 'output should', 'return', 'provide',
];

const EDGE_CASE_SIGNALS = [
  'edge case', 'corner case', 'error', 'failure', 'exception',
  'fallback', 'default', 'empty', 'null', 'undefined', 'missing',
  'invalid', 'malformed', 'overflow', 'timeout', 'retry',
  'concurrent', 'race condition', 'duplicate', 'boundary',
  'what if', 'in case of', 'handle', 'gracefully', 'robust',
];

const BEST_PRACTICE_SIGNALS = [
  'best practice', 'industry standard', 'convention', 'pattern',
  'anti-pattern', 'solid', 'dry', 'kiss', 'yagni', 'clean code',
  'maintainable', 'scalable', 'performant', 'accessible', 'wcag',
  'responsive', 'mobile-first', 'progressive', 'semantic',
  'security', 'authentication', 'authorization', 'encryption',
  'testing', 'unit test', 'integration test', 'ci/cd', 'devops',
  'documentation', 'type-safe', 'typescript', 'linting',
];

const SPECIFIC_SIGNALS = [
  /\d+/, /\d+%/, /\d+px/, /\d+ms/, /\d+s/,     // numbers
  /v\d+/, /\d+\.\d+/,                            // versions
  /react|vue|angular|next\.?js|node\.?js/i,       // tech names
  /python|java|typescript|rust|go/i,
  /postgres|mysql|mongodb|redis|aws|docker/i,
  /api|rest|graphql|websocket|grpc/i,
];

// ── Grade thresholds ──────────────────────────────────────────────────
export const GRADES = [
  { letter: 'S', min: 90, color: '#fbbf24', glow: 'rgba(251,191,36,0.6)',  label: 'Masterclass' },
  { letter: 'A', min: 75, color: '#34d399', glow: 'rgba(52,211,153,0.5)',  label: 'Excellent' },
  { letter: 'B', min: 60, color: '#60a5fa', glow: 'rgba(96,165,250,0.5)',  label: 'Good' },
  { letter: 'C', min: 45, color: '#a78bfa', glow: 'rgba(167,139,250,0.5)', label: 'Average' },
  { letter: 'D', min: 30, color: '#fb923c', glow: 'rgba(251,146,60,0.5)',  label: 'Needs Work' },
  { letter: 'F', min: 0,  color: '#f87171', glow: 'rgba(248,113,113,0.5)', label: 'Weak' },
];

export function getGrade(score) {
  return GRADES.find(g => score >= g.min) || GRADES[GRADES.length - 1];
}

// ── Core scoring functions ────────────────────────────────────────────

function countMatches(text, patterns) {
  const lower = text.toLowerCase();
  let count = 0;
  for (const p of patterns) {
    if (p instanceof RegExp) {
      const matches = lower.match(p);
      if (matches) count += matches.length;
    } else {
      // Count occurrences of string
      let idx = 0;
      while ((idx = lower.indexOf(p, idx)) !== -1) {
        count++;
        idx += p.length;
      }
    }
  }
  return count;
}

function clamp(val, min = 0, max = 100) {
  return Math.round(Math.min(max, Math.max(min, val)));
}

// ── Individual dimension scorers ──────────────────────────────────────

function scoreClarity(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  if (wordCount < 3) return { score: 5, tips: ['Your prompt is too short to be clear. Add more detail.'] };

  const tips = [];
  let score = 30; // base

  // Sentence structure — multiple sentences are clearer
  if (sentences.length >= 3) score += 20;
  else if (sentences.length >= 2) score += 12;
  else tips.push('Break your prompt into multiple sentences for clarity');

  // Average words per sentence (ideal: 10-25)
  const avgWordsPerSentence = wordCount / Math.max(1, sentences.length);
  if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 30) score += 15;
  else if (avgWordsPerSentence > 30) {
    score += 5;
    tips.push('Sentences are very long — consider breaking them up');
  }

  // Vague word penalty
  const vagueCount = countMatches(text, VAGUE_WORDS);
  const vagueRatio = vagueCount / wordCount;
  if (vagueRatio > 0.15) {
    score -= 15;
    tips.push('Too many vague words (good, stuff, things) — be specific');
  } else if (vagueRatio < 0.05) {
    score += 15;
  } else {
    score += 5;
  }

  // Question marks or imperative tone (good for clarity)
  if (text.includes('?') || /^(please |kindly )?(implement|design|create|build|write|develop|explain)/i.test(text.trim())) {
    score += 10;
  }

  // Length bonus (longer prompts tend to be clearer, up to a point)
  if (wordCount >= 20 && wordCount <= 200) score += 10;
  else if (wordCount > 200) score += 5;
  else if (wordCount >= 10) score += 5;

  return { score: clamp(score), tips };
}

function scoreSpecificity(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  if (wordCount < 3) return { score: 5, tips: ['Add specific details, technologies, and requirements.'] };

  const tips = [];
  let score = 15; // base

  // Specific signals (tech names, numbers, versions)
  const specificCount = countMatches(text, SPECIFIC_SIGNALS);
  if (specificCount >= 5) score += 30;
  else if (specificCount >= 3) score += 22;
  else if (specificCount >= 1) score += 12;
  else tips.push('Mention specific technologies, numbers, or versions');

  // Named entities / proper nouns (capitalized words not at start of sentence)
  const properNouns = words.filter((w, i) => i > 0 && /^[A-Z][a-z]/.test(w)).length;
  if (properNouns >= 3) score += 15;
  else if (properNouns >= 1) score += 8;

  // Numerical values
  const numbers = text.match(/\b\d+\b/g) || [];
  if (numbers.length >= 3) score += 15;
  else if (numbers.length >= 1) score += 8;
  else tips.push('Add concrete numbers (e.g., "5 items", "3 sections", "under 200ms")');

  // Quoted strings or code-like patterns
  const hasCode = /`[^`]+`|"[^"]+"|'[^']+'/.test(text);
  if (hasCode) score += 10;

  // Length contributes to specificity
  if (wordCount >= 30) score += 10;
  else if (wordCount >= 15) score += 5;
  else tips.push('Longer, more detailed prompts score higher on specificity');

  // Vague word penalty
  const vagueCount = countMatches(text, VAGUE_WORDS);
  if (vagueCount > 3) {
    score -= 10;
  }

  return { score: clamp(score), tips };
}

function scoreActionability(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  if (wordCount < 3) return { score: 5, tips: ['Use action verbs to make your prompt actionable.'] };

  const tips = [];
  let score = 15;

  // Action verbs
  const actionCount = countMatches(text, ACTION_VERBS);
  if (actionCount >= 5) score += 30;
  else if (actionCount >= 3) score += 22;
  else if (actionCount >= 1) score += 12;
  else tips.push('Start with action verbs: implement, design, analyze, evaluate...');

  // Imperative mood (starts with verb)
  if (/^(implement|design|create|build|develop|write|generate|analyze|explain|list|define|compare)/i.test(text.trim())) {
    score += 15;
  } else {
    tips.push('Start your prompt with a clear action verb');
  }

  // Step-by-step or numbered instructions
  if (/\d+[.)]\s|step\s*\d|first.*then|step.*step/i.test(text)) {
    score += 15;
  }

  // Clear deliverable mentioned
  if (/deliver|output|result|return|provide|produce|generate|create/i.test(text)) {
    score += 10;
  } else {
    tips.push('Specify what deliverable you expect from the AI');
  }

  // Multiple tasks identified
  const tasks = text.split(/\band\b|\bthen\b|\balso\b|\badditionally\b/i).length - 1;
  if (tasks >= 2) score += 10;
  else if (tasks >= 1) score += 5;

  return { score: clamp(score), tips };
}

function scoreContext(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  if (wordCount < 5) return { score: 5, tips: ['Add background context to your prompt.'] };

  const tips = [];
  let score = 10;

  // Context signals
  const contextCount = countMatches(text, CONTEXT_SIGNALS);
  if (contextCount >= 5) score += 30;
  else if (contextCount >= 3) score += 20;
  else if (contextCount >= 1) score += 10;
  else tips.push('Add context: "Given that...", "In the context of...", "The goal is..."');

  // Role or persona mentioned
  if (/as a|you are|act as|role|persona|expert|senior|junior|beginner/i.test(text)) {
    score += 15;
  } else {
    tips.push('Assign a role: "As a senior developer..." or "You are an expert in..."');
  }

  // Audience mentioned
  if (/audience|user|reader|developer|beginner|student|customer|client|team/i.test(text)) {
    score += 10;
  }

  // Background information
  if (/currently|existing|we have|our|project|system|application|codebase/i.test(text)) {
    score += 10;
  }

  // Word count bonus for rich context
  if (wordCount >= 50) score += 15;
  else if (wordCount >= 30) score += 10;
  else if (wordCount >= 15) score += 5;
  else tips.push('Add more background detail for richer context');

  return { score: clamp(score), tips };
}

function scoreConstraints(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 5) return { score: 5, tips: ['Add constraints and limitations to your prompt.'] };

  const tips = [];
  let score = 10;

  const constraintCount = countMatches(text, CONSTRAINT_SIGNALS);
  if (constraintCount >= 5) score += 35;
  else if (constraintCount >= 3) score += 25;
  else if (constraintCount >= 1) score += 15;
  else tips.push('Add constraints: "must", "should not", "limited to", "within X"');

  // Negative constraints (what NOT to do)
  if (/don't|do not|avoid|never|without|exclude|no\s+\w+/i.test(text)) {
    score += 15;
  } else {
    tips.push('Specify what to avoid: "Don\'t use...", "Avoid..."');
  }

  // Quantitative constraints
  if (/\b(under|over|less than|more than|between|within)\s+\d/i.test(text)) {
    score += 15;
  }

  // Time/scope constraints
  if (/deadline|time|quick|brief|concise|short|long|comprehensive|thorough/i.test(text)) {
    score += 10;
  }

  return { score: clamp(score), tips };
}

function scoreOutputFormat(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 3) return { score: 5, tips: ['Specify the desired output format.'] };

  const tips = [];
  let score = 10;

  const formatCount = countMatches(text, OUTPUT_FORMAT_SIGNALS);
  if (formatCount >= 4) score += 35;
  else if (formatCount >= 2) score += 25;
  else if (formatCount >= 1) score += 15;
  else tips.push('Specify output format: "Return as JSON", "Use a table", "Step-by-step list"');

  // Example output requested
  if (/example|sample|like this|such as|e\.g\.|for instance/i.test(text)) {
    score += 15;
  } else {
    tips.push('Include an example of the desired output');
  }

  // Code blocks or formatting
  if (/```|code block|snippet|function|class|component/i.test(text)) {
    score += 15;
  }

  // Length/detail specifications for output
  if (/\b(brief|detailed|comprehensive|paragraph|sentence|word|line|page)\b/i.test(text)) {
    score += 10;
  }

  return { score: clamp(score), tips };
}

function scoreEdgeCases(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 5) return { score: 5, tips: ['Consider mentioning edge cases and error handling.'] };

  const tips = [];
  let score = 8;

  const edgeCount = countMatches(text, EDGE_CASE_SIGNALS);
  if (edgeCount >= 4) score += 40;
  else if (edgeCount >= 2) score += 28;
  else if (edgeCount >= 1) score += 16;
  else tips.push('Mention edge cases: "Handle empty inputs", "What if the API fails?"');

  // Error handling
  if (/error|exception|fail|invalid|missing/i.test(text)) {
    score += 15;
  }

  // Conditional logic
  if (/if\s+|when\s+|unless|otherwise|alternatively/i.test(text)) {
    score += 12;
  } else {
    tips.push('Add conditional scenarios: "If X fails, then..."');
  }

  // Boundary conditions
  if (/empty|zero|null|none|maximum|minimum|overflow|large|small/i.test(text)) {
    score += 12;
  }

  return { score: clamp(score), tips };
}

function scoreBestPractices(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 5) return { score: 5, tips: ['Reference industry best practices and standards.'] };

  const tips = [];
  let score = 10;

  const bpCount = countMatches(text, BEST_PRACTICE_SIGNALS);
  if (bpCount >= 5) score += 35;
  else if (bpCount >= 3) score += 25;
  else if (bpCount >= 1) score += 15;
  else tips.push('Reference standards: "Follow SOLID principles", "Use TypeScript", "Include tests"');

  // Quality attributes
  if (/quality|reliable|robust|secure|efficient|performant|scalable|maintainable/i.test(text)) {
    score += 15;
  }

  // Testing mentioned
  if (/test|spec|coverage|ci|cd|pipeline|deploy/i.test(text)) {
    score += 12;
  }

  // Documentation
  if (/document|comment|readme|changelog|api doc/i.test(text)) {
    score += 10;
  }

  // Code quality
  if (/lint|format|prettier|eslint|type.?safe|error.?handling/i.test(text)) {
    score += 10;
  }

  return { score: clamp(score), tips };
}

// ── Main scorer ───────────────────────────────────────────────────────

const SCORERS = {
  clarity:       scoreClarity,
  specificity:   scoreSpecificity,
  actionability: scoreActionability,
  context:       scoreContext,
  constraints:   scoreConstraints,
  outputFormat:  scoreOutputFormat,
  edgeCases:     scoreEdgeCases,
  bestPractices: scoreBestPractices,
};

/**
 * Score a prompt across all 8 dimensions.
 * @param {string} text — The prompt text to score
 * @returns {{ dimensions: Object, overall: number, grade: Object, tips: string[] }}
 */
export function scorePrompt(text) {
  if (!text || typeof text !== 'string') {
    return {
      dimensions: Object.fromEntries(DIMENSIONS.map(d => [d.id, { score: 0, tips: [] }])),
      overall: 0,
      grade: GRADES[GRADES.length - 1],
      tips: ['Enter a prompt to see your score.'],
    };
  }

  const trimmed = text.trim();
  if (trimmed.length < 3) {
    return {
      dimensions: Object.fromEntries(DIMENSIONS.map(d => [d.id, { score: 0, tips: [] }])),
      overall: 0,
      grade: GRADES[GRADES.length - 1],
      tips: ['Your prompt is too short. Add more detail.'],
    };
  }

  const dimensions = {};
  let totalWeightedScore = 0;
  let totalWeight = 0;
  const allTips = [];

  for (const dim of DIMENSIONS) {
    const scorer = SCORERS[dim.id];
    const result = scorer(trimmed);
    dimensions[dim.id] = result;
    totalWeightedScore += result.score * dim.weight;
    totalWeight += dim.weight;
    allTips.push(...result.tips.map(t => ({ dimension: dim.label, tip: t, color: dim.color })));
  }

  const overall = clamp(Math.round(totalWeightedScore / totalWeight));
  const grade = getGrade(overall);

  // Sort tips: weakest dimensions first
  const sortedTips = allTips.sort((a, b) => {
    const aScore = dimensions[DIMENSIONS.find(d => d.label === a.dimension)?.id]?.score || 0;
    const bScore = dimensions[DIMENSIONS.find(d => d.label === b.dimension)?.id]?.score || 0;
    return aScore - bScore;
  });

  return { dimensions, overall, grade, tips: sortedTips.slice(0, 6) };
}

/**
 * Compare scores of original vs enhanced prompt.
 * @returns {{ original: Object, enhanced: Object, improvements: Object[] }}
 */
export function compareScores(originalText, enhancedText) {
  const original = scorePrompt(originalText);
  const enhanced = scorePrompt(enhancedText);

  const improvements = DIMENSIONS.map(dim => ({
    id: dim.id,
    label: dim.label,
    color: dim.color,
    before: original.dimensions[dim.id]?.score || 0,
    after: enhanced.dimensions[dim.id]?.score || 0,
    delta: (enhanced.dimensions[dim.id]?.score || 0) - (original.dimensions[dim.id]?.score || 0),
  }));

  return { original, enhanced, improvements };
}

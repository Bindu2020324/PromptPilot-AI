// src/scoring/PromptScorer.js

/**
 * Prompt Scoring Engine - Multi-Dimension Quality Analysis
 * Evaluates prompts across 5 dimensions and returns comprehensive scores
 */

// Scoring weights for each dimension
const DIMENSION_WEIGHTS = {
  clarity: 0.25,
  specificity: 0.25,
  context: 0.20,
  goalOrientation: 0.15,
  structure: 0.15
};

// Grade thresholds (0-100)
const GRADE_THRESHOLDS = {
  S: { min: 95, label: 'S', description: 'Outstanding - Production ready', color: '#fbbf24' },
  A: { min: 85, label: 'A', description: 'Excellent - Very clear and specific', color: '#34d399' },
  B: { min: 75, label: 'B', description: 'Good - Some room for improvement', color: '#60a5fa' },
  C: { min: 65, label: 'C', description: 'Fair - Needs more detail', color: '#a78bfa' },
  D: { min: 50, label: 'D', description: 'Poor - Vague or incomplete', color: '#fb923c' },
  F: { min: 0, label: 'F', description: 'Failing - Unclear or missing key elements', color: '#f87171' }
};

/**
 * Calculate grade based on overall score
 */
function calculateGrade(overallScore) {
  for (const [grade, thresholds] of Object.entries(GRADE_THRESHOLDS)) {
    if (overallScore >= thresholds.min) {
      return {
        letter: grade,
        score: overallScore,
        description: thresholds.description,
        color: thresholds.color
      };
    }
  }
  return GRADE_THRESHOLDS.F;
}

/**
 * Evaluate a prompt using AI or local heuristics
 * @param {string} promptText - The prompt to evaluate
 * @param {Object} options - Configuration options
 * @param {boolean} options.useAI - Whether to use AI for scoring (default: false)
 * @param {Object} options.apiConfig - API configuration for AI scoring
 * @returns {Promise<Object>} Scoring results
 */
export async function scorePrompt(promptText, options = {}) {
  const { useAI = false, apiConfig = null } = options;
  
  if (useAI && apiConfig) {
    return await scorePromptWithAI(promptText, apiConfig);
  }
  
  // Use local heuristic scoring (faster, no API key needed)
  return scorePromptLocally(promptText);
}

/**
 * Local heuristic-based scoring (doesn't require API)
 */
function scorePromptLocally(promptText) {
  const scores = {
    clarity: calculateClarityScore(promptText),
    specificity: calculateSpecificityScore(promptText),
    context: calculateContextScore(promptText),
    goalOrientation: calculateGoalScore(promptText),
    structure: calculateStructureScore(promptText)
  };
  
  // Calculate weighted overall score
  let overallScore = 0;
  for (const [dimension, score] of Object.entries(scores)) {
    overallScore += score * DIMENSION_WEIGHTS[dimension];
  }
  overallScore = Math.round(overallScore);
  
  // Generate explanations
  const explanations = generateExplanations(scores, promptText);
  
  // Calculate grade
  const grade = calculateGrade(overallScore);
  
  return {
    scores,
    overall: overallScore,
    grade,
    explanations,
    timestamp: Date.now(),
    suggestions: generateSuggestions(scores, promptText)
  };
}

/**
 * Calculate Clarity Score (0-100)
 * Measures: Unambiguous, direct, clear language
 */
function calculateClarityScore(text) {
  let score = 70; // Base score
  
  // Penalize vague terms
  const vagueTerms = ['something', 'some', 'maybe', 'perhaps', 'kind of', 'sort of'];
  vagueTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) score -= 5;
  });
  
  // Penalize excessive pronouns without clear reference
  const ambiguousPronouns = ['it', 'they', 'them', 'this', 'that'];
  ambiguousPronouns.forEach(pronoun => {
    const matches = (text.match(new RegExp(`\\b${pronoun}\\b`, 'gi')) || []).length;
    if (matches > 3) score -= 3;
  });
  
  // Reward clear action verbs
  const clearVerbs = ['implement', 'create', 'build', 'design', 'write', 'generate', 'explain'];
  clearVerbs.forEach(verb => {
    if (text.toLowerCase().includes(verb)) score += 3;
  });
  
  // Reward question marks (indicates specific query)
  if (text.includes('?')) score += 5;
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate Specificity Score (0-100)
 * Measures: Concrete details, examples, numbers
 */
function calculateSpecificityScore(text) {
  let score = 60;
  
  // Check for numbers/dates
  const hasNumbers = /\d+/.test(text);
  if (hasNumbers) score += 15;
  
  // Check for code/technical terms
  const technicalTerms = ['function', 'class', 'API', 'endpoint', 'database', 'array', 'object'];
  technicalTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) score += 5;
  });
  
  // Check for examples
  const exampleIndicators = ['example', 'e.g.', 'for instance', 'like'];
  exampleIndicators.forEach(ind => {
    if (text.toLowerCase().includes(ind)) score += 10;
  });
  
  // Check word count (too short = less specific)
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 10) score -= 20;
  if (wordCount > 30) score += 10;
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate Context Score (0-100)
 * Measures: Background information provided
 */
function calculateContextScore(text) {
  let score = 50;
  
  // Context indicators
  const contextTerms = ['context', 'background', 'scenario', 'situation', 'environment'];
  contextTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) score += 10;
  });
  
  // Check for role/persona specification
  const roleTerms = ['as a', 'acting as', 'role:', 'you are', 'pretend'];
  roleTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) score += 12;
  });
  
  // Check for constraints/limitations
  const constraintTerms = ['constraint', 'limit', 'cannot', 'must not', 'restriction'];
  constraintTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) score += 8;
  });
  
  // Check for target audience
  if (text.toLowerCase().match(/for\s+(\w+\s+)?(user|audience|beginner|expert|developer)/i)) {
    score += 10;
  }
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate Goal Orientation Score (0-100)
 * Measures: Clearly defined desired output
 */
function calculateGoalScore(text) {
  let score = 65;
  
  // Goal indicators
  const goalTerms = ['goal', 'objective', 'aim', 'purpose', 'want to', 'need to'];
  goalTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) score += 8;
  });
  
  // Check for output specification
  const outputTerms = ['output', 'return', 'provide', 'give me', 'show'];
  outputTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) score += 10;
  });
  
  // Check for format specification
  const formatTerms = ['format:', 'json', 'markdown', 'list', 'table', 'bullet'];
  formatTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) score += 8;
  });
  
  // Check for success criteria
  if (text.toLowerCase().includes('should') || text.toLowerCase().includes('must')) {
    score += 5;
  }
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate Structure Score (0-100)
 * Measures: Logical flow and formatting
 */
function calculateStructureScore(text) {
  let score = 70;
  
  // Check for line breaks/paragraphs
  const paragraphs = text.split(/\n\s*\n/).length;
  if (paragraphs > 1) score += 10;
  
  // Check for bullet points or numbered lists
  if (text.includes('- ') || text.includes('* ') || text.includes('•')) score += 15;
  if (/\d+\./.test(text)) score += 10;
  
  // Check for sections/headers
  if (text.includes(':') || text.toLowerCase().includes('section')) score += 8;
  
  // Penalize run-on sentences
  const sentences = text.split(/[.!?]+/).length;
  const avgSentenceLength = text.split(/\s+/).length / sentences;
  if (avgSentenceLength > 25) score -= 10;
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Generate explanations for each dimension score
 */
function generateExplanations(scores, text) {
  const explanations = {};
  
  // Clarity explanation
  if (scores.clarity >= 80) {
    explanations.clarity = "Very clear and direct language. Easy to understand intent.";
  } else if (scores.clarity >= 60) {
    explanations.clarity = "Generally clear but could reduce vague terms and ambiguous references.";
  } else {
    explanations.clarity = "Unclear in places. Consider using more specific action verbs and reducing ambiguity.";
  }
  
  // Specificity explanation
  if (scores.specificity >= 80) {
    explanations.specificity = "Excellent detail with concrete examples and specific requirements.";
  } else if (scores.specificity >= 60) {
    explanations.specificity = "Good baseline but could include more examples, numbers, or technical specifics.";
  } else {
    explanations.specificity = "Too vague. Add specific examples, quantities, or technical details.";
  }
  
  // Context explanation
  if (scores.context >= 80) {
    explanations.context = "Rich background information. Role, constraints, and audience are well-defined.";
  } else if (scores.context >= 60) {
    explanations.context = "Some context provided but missing role specification or constraints.";
  } else {
    explanations.context = "Lacks important context. Specify your role, constraints, or background scenario.";
  }
  
  // Goal Orientation explanation
  if (scores.goalOrientation >= 80) {
    explanations.goalOrientation = "Clear objective with specific output format requirements.";
  } else if (scores.goalOrientation >= 60) {
    explanations.goalOrientation = "Goal is stated but output format or success criteria could be clearer.";
  } else {
    explanations.goalOrientation = "Unclear what you want as output. Specify the desired result format.";
  }
  
  // Structure explanation
  if (scores.structure >= 80) {
    explanations.structure = "Well-organized with logical flow and good formatting.";
  } else if (scores.structure >= 60) {
    explanations.structure = "Acceptable structure but could benefit from sections or bullet points.";
  } else {
    explanations.structure = "Poor organization. Use paragraphs, bullet points, or numbered sections.";
  }
  
  return explanations;
}

/**
 * Generate actionable suggestions for improvement
 */
function generateSuggestions(scores, text) {
  const suggestions = [];
  
  if (scores.clarity < 70) {
    suggestions.push("🎯 Replace vague words with specific action verbs");
    suggestions.push("📝 Break complex sentences into simpler ones");
  }
  
  if (scores.specificity < 70) {
    suggestions.push("📊 Add concrete examples or numbers");
    suggestions.push("🔧 Include technical terms or specific requirements");
  }
  
  if (scores.context < 70) {
    suggestions.push("📖 Specify your role (e.g., 'As a senior developer...')");
    suggestions.push("⚠️ Add constraints or limitations");
  }
  
  if (scores.goalOrientation < 70) {
    suggestions.push("🎯 Explicitly state what output you want");
    suggestions.push("📐 Define the expected format (JSON, list, paragraph, etc.)");
  }
  
  if (scores.structure < 70) {
    suggestions.push("📑 Use bullet points or numbered lists for multiple requirements");
    suggestions.push("🔨 Break into sections with clear headers");
  }
  
  return suggestions.slice(0, 5);
}

/**
 * AI-powered scoring (more accurate but requires API)
 */
async function scorePromptWithAI(promptText, apiConfig) {
  const { provider, apiKey, model = 'gemini-1.5-flash' } = apiConfig;
  
  const scoringPrompt = `You are a prompt quality evaluator. Analyze the following prompt and score it across 5 dimensions (0-100):

Prompt: "${promptText}"

Dimensions:
1. Clarity - How unambiguous and direct is the prompt?
2. Specificity - How many concrete details and examples?
3. Context - How much background information is provided?
4. Goal Orientation - How clearly defined is the desired output?
5. Structure - How logical is the flow and formatting?

Return ONLY valid JSON with this exact structure:
{
  "scores": {
    "clarity": <0-100>,
    "specificity": <0-100>,
    "context": <0-100>,
    "goalOrientation": <0-100>,
    "structure": <0-100>
  },
  "explanations": {
    "clarity": "<brief explanation>",
    "specificity": "<brief explanation>",
    "context": "<brief explanation>",
    "goalOrientation": "<brief explanation>",
    "structure": "<brief explanation>"
  },
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

  try {
    let response;
    if (provider === 'gemini') {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: scoringPrompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 500 }
          })
        }
      );
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const result = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
      
      const overallScore = Math.round(
        result.scores.clarity * 0.25 +
        result.scores.specificity * 0.25 +
        result.scores.context * 0.20 +
        result.scores.goalOrientation * 0.15 +
        result.scores.structure * 0.15
      );
      
      return {
        scores: result.scores,
        overall: overallScore,
        grade: calculateGrade(overallScore),
        explanations: result.explanations,
        suggestions: result.suggestions,
        timestamp: Date.now()
      };
    }
  } catch (error) {
    console.error('AI scoring failed, falling back to local scoring:', error);
    return scorePromptLocally(promptText);
  }
}

// Export individual scoring functions for testing
export {
  calculateClarityScore,
  calculateSpecificityScore,
  calculateContextScore,
  calculateGoalScore,
  calculateStructureScore,
  calculateGrade
};
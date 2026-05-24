// ═══════════════════════════════════════════════════════════════════════
// PromptPilot AI — Background Service Worker
// ═══════════════════════════════════════════════════════════════════════

// ── Setup ─────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'pp-enhance',
    title: '✦ Enhance with PromptPilot AI',
    contexts: ['selection'],
  });
});

// ── Context menu ──────────────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'pp-enhance' || !info.selectionText || !tab?.id)
    return;
  await ensureContent(tab.id);
  chrome.tabs.sendMessage(tab.id, {
    type: 'PP_OPEN',
    text: info.selectionText,
  });
});

// ── Keyboard shortcut ─────────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (cmd, tab) => {
  if (cmd !== 'enhance-selection' || !tab?.id) return;
  await ensureContent(tab.id);
  chrome.tabs.sendMessage(tab.id, { type: 'PP_SHORTCUT' });
});

async function ensureContent(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content.js'],
    });
  } catch (_) {}
}

// ── API proxy ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'PP_API') {
    callAPI(msg)
      .then((r) => sendResponse({ ok: true, data: r }))
      .catch((e) => sendResponse({ ok: false, error: e.message }));
    return true;
  }
});

// ── Domain system prompts ─────────────────────────────────────────────

const DOMAIN_CONTEXT = {
  frontend:
    'You are a senior frontend engineer. Inject: React/TypeScript best practices, responsive design, accessibility (WCAG 2.1), reusable components, Tailwind CSS, performance optimization, loading/error states, SEO.',
  backend:
    'You are a senior backend engineer. Inject: REST/GraphQL API design, JWT auth, database schema, scalability, security hardening, error handling, rate limiting, logging, test coverage.',
  fullstack:
    'You are a senior full-stack engineer. Inject: end-to-end architecture, API contracts, auth flows, DB design, deployment, CI/CD, monorepo patterns, performance at scale.',
  uiux: 'You are a senior UI/UX designer. Inject: user flows, design system tokens, accessibility, color/typography hierarchy, interaction patterns, usability heuristics, responsive breakpoints.',
  writing:
    'You are a content strategist. Inject: target audience, tone, hook, structure (intro/body/CTA), SEO keywords, readability, emotional triggers, formatting.',
  marketing:
    'You are a growth marketer. Inject: target persona, funnel stage, value proposition, differentiation, messaging, channels, KPIs, conversion optimization.',
  research:
    'You are an academic researcher. Inject: research question, methodology, data sources, citation standards, objectivity, structured analysis, limitations, conclusions.',
  resume:
    'You are a career coach. Inject: ATS optimization, quantified achievements, action verbs, keywords, role-specific skills, format standards, LinkedIn alignment.',
  interview:
    'You are a FAANG interviewer. Inject: STAR format, technical depth, behavioral examples, role competencies, common follow-ups, evaluation rubric.',
  business:
    'You are a strategy consultant. Inject: problem framing, stakeholder map, market context, SWOT/OKR frameworks, success metrics, risk assessment, roadmap.',
  youtube:
    'You are a YouTube strategist. Inject: hook (0-30s), retention arc, chapter structure, pattern interrupts, CTA placement, SEO optimization, thumbnail concept.',
  social:
    'You are a social media expert. Inject: platform format, hook line, engagement triggers, hashtags, timing, visual suggestions, CTA, brand voice.',
  education:
    "You are a curriculum designer. Inject: learning objectives, Bloom's taxonomy, analogies, exercises, assessment criteria, progressive difficulty.",
  dsa: 'You are a competitive programmer. Inject: constraints, time/space complexity, edge cases, brute→optimized approaches, data structure rationale, test cases.',
  general:
    'You are a world-class prompt engineer. Make prompts specific, structured, and highly actionable for modern LLMs.',
};

function buildSystemPrompt(domain, mode, profileRole, profileStack, profileRules) {
  let ctx = DOMAIN_CONTEXT[domain] || DOMAIN_CONTEXT.general;
  
  let profileCtx = '';
  if (profileRole || profileStack || profileRules) {
    profileCtx = '\n\nUSER PROFILE CONTEXT:\nAlways incorporate this context into the enhanced prompt if relevant.\n';
    if (profileRole) profileCtx += `- Role: ${profileRole}\n`;
    if (profileStack) profileCtx += `- Tech Stack: ${profileStack}\n`;
    if (profileRules) profileCtx += `- Coding Rules & Preferences: ${profileRules}\n`;
  }

  return `${ctx}${profileCtx}

TASK: Transform the user's weak/vague prompt into a structured expert-level prompt.
MODE: ${mode || 'technical'}

OUTPUT STRUCTURE (use all applicable sections):
━━━ ROLE ━━━
[Expert role the AI should assume]

━━━ OBJECTIVE ━━━
[Clear, specific goal]

━━━ CONTEXT ━━━
[Relevant background and constraints]

━━━ REQUIREMENTS ━━━
[Detailed bullet list of what must be included]

━━━ TECH STACK ━━━
[Technologies, tools, frameworks — if applicable]

━━━ CONSTRAINTS ━━━
[Limitations, rules, non-negotiables]

━━━ OUTPUT FORMAT ━━━
[Exact format expected in the response]

━━━ QUALITY EXPECTATIONS ━━━
[What "done well" looks like]

━━━ EDGE CASES ━━━
[Things to handle carefully]

━━━ BEST PRACTICES ━━━
[Domain-specific standards to follow]

RULES:
- Infer all missing details — never ask for clarification
- Preserve the user's original intent exactly
- Be specific and actionable, not generic
- Optimize for GPT-4o, Claude 3.5, Gemini 1.5
- No filler or unnecessary text

Respond ONLY with valid JSON. Zero markdown. Zero text outside JSON.

JSON schema:
{
  "enhanced_prompt": "<full structured prompt with real newlines>",
  "clarity_score": <0-100>,
  "specificity_score": <0-100>,
  "quality_score": <0-100>,
  "domain_detected": "<string>",
  "missing_requirements": ["<string>","<string>","<string>"],
  "transformation_insight": "<1-2 sentences>",
  "ambiguities_resolved": ["<string>"]
}`;
}

// ── Provider calls ────────────────────────────────────────────────────

async function callAPI({ prompt, domain, mode, provider, apiKey, profileRole, profileStack, profileRules }) {
  const sys = buildSystemPrompt(domain, mode, profileRole, profileStack, profileRules);
  const userMsg = `Enhance this prompt: "${prompt}"`;
  let raw = '';

  if (provider === 'groq') {
    raw = await callGroq(sys, userMsg, apiKey);
  } else if (provider === 'openai') {
    raw = await callOpenAI(sys, userMsg, apiKey);
  } else {
    raw = await callGemini(sys, userMsg, apiKey);
  }

  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    return {
      enhanced_prompt: raw,
      clarity_score: 30,
      specificity_score: 30,
      quality_score: 30,
      domain_detected: domain || 'general',
      missing_requirements: [],
      transformation_insight: 'Enhancement complete.',
      ambiguities_resolved: [],
    };
  }
}

async function callGemini(sys, userMsg, apiKey) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: sys }] },
          contents: [{ parts: [{ text: userMsg }] }],
          generationConfig: { maxOutputTokens: 2000, temperature: 0.3 },
        }),
      }
    );
    await assertOK(res, 'Gemini');
    const d = await res.json();
    const text = d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text.trim()) {
      throw new Error('Empty Response: AI returned empty response. Try rephrasing your prompt.');
    }
    return text;
  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error('Network Error: Can\'t reach Gemini. Check your internet connection.');
    }
    throw error;
  }
}

async function callGroq(sys, userMsg, apiKey) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: userMsg },
        ],
      }),
    });
    await assertOK(res, 'Groq');
    const d = await res.json();
    const text = d?.choices?.[0]?.message?.content || '';
    if (!text.trim()) {
      throw new Error('Empty Response: AI returned empty response. Try rephrasing your prompt.');
    }
    return text;
  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error('Network Error: Can\'t reach Groq. Check your internet connection.');
    }
    throw error;
  }
}

async function callOpenAI(sys, userMsg, apiKey) {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: userMsg },
        ],
      }),
    });
    await assertOK(res, 'OpenAI');
    const d = await res.json();
    const text = d?.choices?.[0]?.message?.content || '';
    if (!text.trim()) {
      throw new Error('Empty Response: AI returned empty response. Try rephrasing your prompt.');
    }
    return text;
  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error('Network Error: Can\'t reach OpenAI. Check your internet connection.');
    }
    throw error;
  }
}

async function assertOK(res, provider) {
  if (res.ok) return;
  let msg = `${provider} error ${res.status}`;
  try {
    const b = await res.json();
    msg = b?.error?.message || msg;
  } catch (_) {}
  if (res.status === 401) {
    const providerLinks = {
      Gemini: 'aistudio.google.com',
      Groq: 'console.groq.com',
      OpenAI: 'platform.openai.com'
    };
    throw new Error(`Invalid API Key: Your ${provider} key is incorrect. Go to Settings → re-copy from ${providerLinks[provider] || provider.toLowerCase() + '.com'}.`);
  }
  if (res.status === 429)
    throw new Error(`Rate Limit Exceeded: You've hit the rate limit. Wait 60 seconds and try again.`);
  if (res.status >= 500)
    throw new Error(`Network Error: Can't reach ${provider}. Check your internet connection.`);
  throw new Error(`API Error: ${msg}`);
}

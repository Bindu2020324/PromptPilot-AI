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

let isProcessing = false;
let lastRequestTime = 0;
<<<<<<< HEAD
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'PP_API') return false;

  const now = Date.now();
  // debounce rapid requests
  if (now - lastRequestTime < 500) {
    sendResponse({ ok: false, error: 'Duplicate request ignored.' });
    return false;
  }

  lastRequestTime = now;
  if (isProcessing) {
    sendResponse({ ok: false, error: 'Another request is already in progress. Please wait.' });
    return false;
  }

  isProcessing = true;
  callAPI(msg)
    .then((r) => sendResponse({ ok: true, data: r }))
    .catch((e) => sendResponse({ ok: false, error: e.message }))
    .finally(() => { isProcessing = false; });
=======

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'PP_API') return;

  const now = Date.now();

  // debounce rapid requests
  if (now - lastRequestTime < 500) {
    sendResponse({ ok: false, error: 'Duplicate request ignored.' });
    return true;
  }

  lastRequestTime = now;

  if (isProcessing) {
    sendResponse({
      ok: false,
      error: 'Another request is already in progress. Please wait.',
    });
    return true;
  }

  isProcessing = true;

  callAPI(msg)
    .then((r) => sendResponse({ ok: true, data: r }))
    .catch((e) => sendResponse({ ok: false, error: e.message }))
    .finally(() => {
      isProcessing = false;
    });

>>>>>>> upstream/main
  return true;
});

// ── Domain system prompts ─────────────────────────────────────────────

const DOMAIN_CONTEXT = {
  frontend:
    'You are a senior frontend engineer. Inject: React/TypeScript best practices, responsive design, accessibility (WCAG 2.1), reusable components, Tailwind CSS, performance optimization.',
  backend:
    'You are a senior backend engineer. Inject: REST/GraphQL API design, JWT auth, database schema, scalability, security, rate limiting, logging.',
  fullstack:
    'You are a senior full-stack engineer. Inject: architecture, API contracts, auth flows, DB design, deployment, CI/CD.',
  uiux:
    'You are a senior UI/UX designer. Inject: user flows, accessibility, design systems, typography, usability.',
  writing:
    'You are a content strategist. Inject: audience, tone, structure, SEO keywords, readability.',
  marketing:
    'You are a growth marketer. Inject: persona, funnel stage, messaging, conversion strategy.',
  research:
    'You are an academic researcher. Inject: methodology, citations, structured analysis.',
  resume:
    'You are a career coach. Inject: ATS optimization, action verbs, quantified achievements.',
  interview:
    'You are a FAANG interviewer. Inject: STAR format, technical depth, evaluation criteria.',
  business:
    'You are a strategy consultant. Inject: SWOT, KPIs, roadmap, market context.',
  youtube:
    'You are a YouTube strategist. Inject: hook, retention, structure, SEO.',
  social:
    'You are a social media expert. Inject: hooks, engagement, hashtags, CTA.',
  education:
    "You are a curriculum designer. Inject: learning objectives, exercises, progression.",
  dsa:
    'You are a competitive programmer. Inject: complexity, edge cases, optimized approaches.',
  general:
    'You are a world-class prompt engineer. Make prompts structured and actionable.',
};

function buildSystemPrompt(domain, mode, profileRole, profileStack, profileRules) {
  const ctx = DOMAIN_CONTEXT[domain] || DOMAIN_CONTEXT.general;

  let profileCtx = '';
  if (profileRole || profileStack || profileRules) {
    profileCtx = '\n\nUSER PROFILE:\n';
    if (profileRole) profileCtx += `Role: ${profileRole}\n`;
    if (profileStack) profileCtx += `Stack: ${profileStack}\n`;
    if (profileRules) profileCtx += `Rules: ${profileRules}\n`;
  }

  return `${ctx}${profileCtx}

TASK: Transform weak prompt into structured expert-level prompt.
MODE: ${mode || 'technical'}

OUTPUT FORMAT:
Return ONLY valid JSON:
{
  "enhanced_prompt": "...",
  "clarity_score": 0,
  "specificity_score": 0,
  "quality_score": 0,
  "domain_detected": "...",
  "missing_requirements": [],
  "transformation_insight": "...",
  "ambiguities_resolved": []
}`;
}

// ── Main API dispatcher ───────────────────────────────────────────────

async function callAPI(msg) {
  const { prompt, domain, mode, provider, apiKey } = msg;

  const sys = buildSystemPrompt(domain, mode);
  const userMsg = `Enhance this prompt: "${prompt}"`;

  let raw = '';

  try {
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

    return JSON.parse(cleaned);
  } catch (err) {
    return {
      enhanced_prompt: raw || '',
      clarity_score: 30,
      specificity_score: 30,
      quality_score: 30,
      domain_detected: domain || 'general',
      missing_requirements: [],
      transformation_insight: err.message || 'Failed to enhance prompt',
      ambiguities_resolved: [],
    };
  }
}

// ── Providers ─────────────────────────────────────────────────────────

async function callGemini(sys, userMsg, apiKey) {
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

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGroq(sys, userMsg, apiKey) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: userMsg },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });

  await assertOK(res, 'Groq');

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function callOpenAI(sys, userMsg, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: userMsg },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });

  await assertOK(res, 'OpenAI');

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

// ── Error handling ───────────────────────────────────────────────────

async function assertOK(res, provider) {
  if (res.ok) return;

  let msg = `${provider} error ${res.status}`;

  try {
    const b = await res.json();
    msg = b?.error?.message || msg;
  } catch (_) {}

  if (res.status === 401) {
    throw new Error(`Invalid ${provider} API key.`);
  }

  if (res.status === 429) {
    throw new Error('Rate limit exceeded. Try again later.');
  }

  throw new Error(msg);
}
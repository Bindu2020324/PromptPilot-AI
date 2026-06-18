// ═══════════════════════════════════════════════════════════════════════
// PromptPilot AI — Content Script (Grammarly-style)
// ═══════════════════════════════════════════════════════════════════════
import { scorePrompt } from './scoring/PromptScorer.js';

(function () {
  if (window.__pp_injected) return;
  window.__pp_injected = true;

  // ── Config ───────────────────────────────────────────────────────────
  const SUPPORTED = [
    'chat.openai.com',
    'chatgpt.com',
    'claude.ai',
    'gemini.google.com',
    'perplexity.ai',
    'linkedin.com',
    'mail.google.com',
    'notion.so',
    'github.com',
    'cursor.sh',
    'twitter.com',
    'x.com',
  ];
  const host = location.hostname.replace('www.', '');
  const IS_SUPPORTED = SUPPORTED.some((s) => host.includes(s));

  // ── State ────────────────────────────────────────────────────────────
  let pillEl = null; // floating ✦ button
  let overlayEl = null; // main modal
  let toastRoot = null; // toast container
  let activeField = null; // currently focused input
  let lastSel = ''; // last selected text
  let selRange = null; // selection range for replacement
  let debounceT = null;

  // ── Shadow DOM host ───────────────────────────────────────────────────
  let shadowHost = null;
  let shadow = null;

  function initShadow() {
    if (shadowHost) return;
    shadowHost = document.createElement('div');
    shadowHost.id = '__pp_root';
    Object.assign(shadowHost.style, {
      all: 'initial',
      position: 'fixed',
      zIndex: '2147483647',
      pointerEvents: 'none',
    });
    document.documentElement.appendChild(shadowHost);
    shadow = shadowHost.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = SHADOW_CSS;
    shadow.appendChild(styleEl);

    const root = document.createElement('div');
    root.id = '__pp_container';
    shadow.appendChild(root);
  }

  function shadowRoot() {
    initShadow();
    return shadow.getElementById('__pp_container');
  }

  // ── Pill button ───────────────────────────────────────────────────────

  function showPill(x, y, text) {
    if (!pillEl) {
      pillEl = document.createElement('button');
      pillEl.id = '__pp_pill';
      pillEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      pillEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handlePillClick();
      });
      shadowRoot().appendChild(pillEl);
    }

    let gradeLetter = null;
    if (text) {
      try {
        const result = scorePrompt(text);
        if (result && result.grade && result.grade.letter) {
          gradeLetter = result.grade.letter;
        }
      } catch (err) {
        console.error('Error scoring prompt:', err);
      }
    }

    pillEl.className = '';

    if (gradeLetter) {
      pillEl.classList.add('__pp_pill_graded', `pp-grade-${gradeLetter}`);
      pillEl.innerHTML = `
        <span class="pp-pill-grade-text">${gradeLetter}</span>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" stroke="white" stroke-width="0.5"/>
        </svg>
      `;
      pillEl.title = `Prompt Quality: Grade ${gradeLetter} — Enhance with PromptPilot (Ctrl+Shift+E)`;
    } else {
      pillEl.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" stroke="white" stroke-width="0.5"/>
        </svg>
      `;
      pillEl.title = 'Enhance with PromptPilot (Ctrl+Shift+E)';
    }

    const VW = window.innerWidth, VH = window.innerHeight;
    const px = Math.min(Math.max(x, 12), VW - 52);
    const py = Math.min(Math.max(y - 52, 8), VH - 52);

    pillEl.style.left = px + 'px';
    pillEl.style.top = py + 'px';
    pillEl.style.opacity = '1';
    pillEl.style.transform = 'scale(1)';
    pillEl.style.pointerEvents = 'all';
    shadowHost.style.pointerEvents = 'none';
  }

  function hidePill() {
    if (!pillEl) return;
    pillEl.style.opacity = '0';
    pillEl.style.transform = 'scale(0.6)';
    pillEl.style.pointerEvents = 'none';
  }

  function handlePillClick() {
    hidePill();
    if (lastSel) openOverlay(lastSel);
  }

  // ── Text selection detection ──────────────────────────────────────────

  document.addEventListener('mouseup', (e) => {
    clearTimeout(debounceT);
    debounceT = setTimeout(() => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (text && text.length > 3) {
        lastSel = text;
        try {
          selRange = sel.getRangeAt(0).cloneRange();
        } catch (_) {
          selRange = null;
        }
        activeField = document.activeElement;
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        showPill(
          e.clientX,
          rect.top < 60
            ? rect.bottom + window.scrollY
            : rect.top + window.scrollY - 8,
          text
        );
      } else {
        if (e.target !== pillEl) hidePill();
      }
    }, 60);
  });

  document.addEventListener('selectionchange', () => {
    const text = window.getSelection()?.toString().trim();
    if (!text) hidePill();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hidePill();
      closeOverlay();
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      const sel = window.getSelection()?.toString().trim();
      if (sel) {
        lastSel = sel;
        try {
          selRange = window.getSelection().getRangeAt(0).cloneRange();
        } catch (_) {}
        openOverlay(sel);
      }
    }
  });

  // ── Messages from background ──────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'PP_OPEN' && msg.text) {
      lastSel = msg.text;
      openOverlay(msg.text);
    }
    if (msg.type === 'PP_SHORTCUT') {
      const sel = window.getSelection()?.toString().trim();
      if (sel) {
        lastSel = sel;
        openOverlay(sel);
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // OVERLAY
  // ═══════════════════════════════════════════════════════════════════════

  function openOverlay(text) {
    closeOverlay();
    initShadow();

    const el = document.createElement('div');
    el.id = '__pp_overlay';
    el.innerHTML = buildOverlayHTML(text);
    shadowRoot().appendChild(el);
    overlayEl = el;
    shadowHost.style.pointerEvents = 'all';

    positionOverlay();
    window.addEventListener('resize', positionOverlay);

    wireOverlay(text);
  }

  function positionOverlay() {
    if (!overlayEl) return;
    const box = overlayEl.querySelector('#__pp_box');
    if (!box) return;
    let top = '50%', left = '50%', transform = 'translate(-50%,-50%)';
    if (selRange) {
      const rect = selRange.getBoundingClientRect();
      const VW = window.innerWidth, VH = window.innerHeight;
      const bh = 580, bw = 540;
      let t = rect.bottom + 12;
      let l = rect.left;
      if (t + bh > VH - 20) t = rect.top - bh - 12;
      if (t < 20) t = 20;
      if (l + bw > VW - 20) l = VW - bw - 20;
      if (l < 20) l = 20;
      top = t + 'px';
      left = l + 'px';
      transform = 'none';
    }
    Object.assign(overlayEl.style, { top, left, transform });
  }

  function closeOverlay() {
    if (!overlayEl) return;
    overlayEl.remove();
    overlayEl = null;
    if (shadowHost) shadowHost.style.pointerEvents = 'none';
    window.removeEventListener('resize', positionOverlay);
  }

  function buildOverlayHTML(text) {
    const preview = esc(text.slice(0, 180)) + (text.length > 180 ? '…' : '');
    return `
    <div id="__pp_backdrop"></div>
    <div id="__pp_box" role="dialog" aria-label="PromptPilot AI">
      <div id="__pp_header">
        <div id="__pp_logo">
          <div id="__pp_logomark">P</div>
          <span id="__pp_logotext">PromptPilot AI</span>
          <span id="__pp_badge">Copilot</span>
        </div>
        <button id="__pp_close" title="Close (Esc)">✕</button>
      </div>
      <div id="__pp_body">
        <div id="__pp_nokey" style="display:none">
          ⚠ No API key — click the PromptPilot icon in your toolbar → ⚙ Settings to add one.
        </div>
        <div class="pp-backup-row">
          <button id="__pp_export_btn" class="pp-btn-ghost" type="button">Export Prompts</button>
          <button id="__pp_import_btn" class="pp-btn-ghost" type="button">Import Prompts</button>
          <input id="__pp_import_file" type="file" accept="application/json,.json" style="display:none" />
        </div>
        <div class="pp-section">
          <div class="pp-label">Original Prompt</div>
          <div id="__pp_original" class="pp-original-box">${preview}</div>
        </div>
        <div class="pp-row">
          <div style="flex:1">
            <div class="pp-label">Domain</div>
            <select id="__pp_domain" class="pp-select">
              <option value="">Auto-detect</option>
              <option value="frontend">Frontend Dev</option>
              <option value="backend">Backend Dev</option>
              <option value="fullstack">Full Stack</option>
              <option value="uiux">UI/UX Design</option>
              <option value="writing">Content Writing</option>
              <option value="marketing">Marketing</option>
              <option value="research">Research</option>
              <option value="resume">Resume</option>
              <option value="interview">Interview Prep</option>
              <option value="business">Business Strategy</option>
              <option value="youtube">YouTube Script</option>
              <option value="social">Social Media</option>
              <option value="education">Education</option>
              <option value="dsa">DSA / CP</option>
              <optgroup id="__pp_custom_templates_group" label="Custom Templates" style="display:none"></optgroup>
            </select>
          </div>
          <div style="flex:1">
            <div class="pp-label">Mode</div>
            <select id="__pp_mode" class="pp-select">
              <option value="technical">Technical</option>
              <option value="senior">Senior Dev</option>
              <option value="creative">Creative</option>
              <option value="concise">Concise</option>
              <option value="detailed">Detailed</option>
              <option value="startup">Startup Style</option>
              <option value="beginner">Beginner</option>
            </select>
          </div>
        </div>
        <button id="__pp_forge_btn" class="pp-btn-primary">
          <span id="__pp_btn_text">✦ Enhance Prompt</span>
        </button>
        <div id="__pp_error" class="pp-error" style="display:none"></div>
        <div id="__pp_loading" style="display:none" class="pp-loading">
          <div class="pp-spinner"></div>
          <span>Analyzing intent · Injecting expertise…</span>
        </div>
        <div id="__pp_result" style="display:none">
          <div id="__pp_scores" class="pp-scores">
            <div class="pp-score-item">
              <div class="pp-score-label">Clarity</div>
              <div class="pp-score-bar"><div class="pp-score-fill clarity-fill" id="__pp_clarity_bar"></div></div>
              <div class="pp-score-num" id="__pp_clarity_num" style="color:#a78bfa">—</div>
            </div>
            <div class="pp-score-item">
              <div class="pp-score-label">Specificity</div>
              <div class="pp-score-bar"><div class="pp-score-fill spec-fill" id="__pp_spec_bar"></div></div>
              <div class="pp-score-num" id="__pp_spec_num" style="color:#34d399">—</div>
            </div>
            <div class="pp-score-item">
              <div class="pp-score-label">Quality</div>
              <div class="pp-score-bar"><div class="pp-score-fill qual-fill" id="__pp_qual_bar"></div></div>
              <div class="pp-score-num" id="__pp_qual_num" style="color:#60a5fa">—</div>
            </div>
          </div>
          <div class="pp-domain-row">
            <span class="pp-domain-badge" id="__pp_domain_badge">—</span>
            <span class="pp-insight" id="__pp_insight_text"></span>
          </div>
          <div id="__pp_tabs" class="pp-tabs">
            <button class="pp-tab pp-tab-active" data-tab="enhanced">Enhanced</button>
            <button class="pp-tab" data-tab="diff">Compare Changes</button>
            <button class="pp-tab" data-tab="added">What Was Added</button>
          </div>
          <div id="__pp_tab_enhanced" class="pp-tab-panel">
            <div class="pp-prompt-box">
              <div class="pp-prompt-header">
                <span class="pp-prompt-label"><span class="pp-green-dot"></span> Enhanced Prompt</span>
                <button id="__pp_copy_enhanced" class="pp-btn-ghost">Copy</button>
              </div>
              <div id="__pp_enhanced_text" class="pp-prompt-body"></div>
            </div>
          </div>
          <div id="__pp_tab_diff" class="pp-tab-panel" style="display:none">
            <div class="pp-diff-legend">
              <span class="pp-diff-rem-badge">Removed</span>
              <span class="pp-diff-add-badge">Added</span>
            </div>
            <div id="__pp_diff_body" class="pp-prompt-body pp-diff-body"></div>
          </div>
          <div id="__pp_tab_added" class="pp-tab-panel" style="display:none">
            <div id="__pp_tags_row" class="pp-tags-row"></div>
            <div id="__pp_ambig_row" class="pp-tags-row" style="margin-top:8px"></div>
          </div>
          <div id="__pp_actions" class="pp-actions">
            <button id="__pp_replace_btn" class="pp-btn-primary pp-btn-green">✓ Replace Original</button>
            <button id="__pp_copy_btn" class="pp-btn-ghost">Copy Enhanced</button>
            <button id="__pp_cancel_btn" class="pp-btn-ghost pp-btn-dim">Cancel</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  // ── Wire overlay interactions ─────────────────────────────────────────

  function wireOverlay(originalText) {
    const $ = (id) => overlayEl.querySelector(`#${id}`);

    $('__pp_close').addEventListener('click', closeOverlay);
    $('__pp_backdrop').addEventListener('click', closeOverlay);

    overlayEl.querySelectorAll('.pp-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        overlayEl.querySelectorAll('.pp-tab').forEach((t) => t.classList.remove('pp-tab-active'));
        tab.classList.add('pp-tab-active');
        const target = tab.dataset.tab;
        overlayEl.querySelectorAll('.pp-tab-panel').forEach((p) => (p.style.display = 'none'));
        $(`__pp_tab_${target}`).style.display = 'block';
      });
    });

    chrome.storage.local.get(['pp_templates'], ({ pp_templates }) => {
      const templates = pp_templates || [];
      const groupEl = $('__pp_custom_templates_group');
      if (groupEl && templates.length > 0) {
        groupEl.style.display = 'block';
        groupEl.innerHTML = templates
          .map((t) => `<option value="custom_${t.id}">${esc(t.name)}</option>`)
          .join('');
      }
    });

    const domainSelect = $('__pp_domain');
    const modeSelect = $('__pp_mode');
    domainSelect.addEventListener('change', () => {
      if (domainSelect.value.startsWith('custom_')) {
        modeSelect.disabled = true;
        modeSelect.style.opacity = '0.5';
      } else {
        modeSelect.disabled = false;
        modeSelect.style.opacity = '1';
      }
    });

    chrome.storage.local.get(['pp_key'], ({ pp_key }) => {
      if (!pp_key) $('__pp_nokey').style.display = 'flex';
    });

    $('__pp_export_btn').addEventListener('click', async () => {
      try {
        const data = await storageGet(['pp_prompts', 'pp_history', 'pp_score_history']);
        const payload = {
          format: 'promptpilot.prompts',
          version: 1,
          exported_at: Date.now(),
          prompt_count: Array.isArray(data.pp_prompts) ? data.pp_prompts.length : 0,
          prompts: Array.isArray(data.pp_prompts) ? data.pp_prompts : [],
          legacy_history: Array.isArray(data.pp_history) ? data.pp_history : [],
          score_history: Array.isArray(data.pp_score_history) ? data.pp_score_history : [],
        };
        const stamp = new Date().toISOString().slice(0, 10);
        downloadJson(payload, `promptpilot-prompts-${stamp}.json`);
        showToast('Backup exported successfully.', 'success');
      } catch (err) {
        showToast(`Export failed: ${err?.message || 'Unable to generate backup file.'}`, 'error');
      }
    });

    $('__pp_import_btn').addEventListener('click', () => {
      $('__pp_import_file').click();
    });

    $('__pp_import_file').addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (
          !parsed ||
          typeof parsed !== 'object' ||
          (!Array.isArray(parsed.prompts) && !Array.isArray(parsed.legacy_history))
        ) {
          throw new Error('Invalid backup format.');
        }

        const overwrite = window.confirm(
          'Import mode:\nOK = overwrite duplicates\nCancel = merge and skip duplicates.'
        );
        const existing = await storageGet(['pp_prompts', 'pp_history', 'pp_score_history']);
        const merged = mergeImportedData(
          existing,
          {
            prompts: Array.isArray(parsed.prompts) ? parsed.prompts : [],
            legacy_history: Array.isArray(parsed.legacy_history) ? parsed.legacy_history : [],
            score_history: Array.isArray(parsed.score_history) ? parsed.score_history : [],
          },
          overwrite ? 'overwrite' : 'merge'
        );

        await storageSet({
          pp_prompts: merged.prompts,
          pp_history: merged.legacyHistory,
          pp_score_history: merged.scoreHistory,
        });
        showToast(
          `Import done. Added: ${merged.added}, Replaced: ${merged.replaced}, Skipped: ${merged.skipped}`,
          'success'
        );
      } catch (err) {
        showToast(`Import failed: ${err?.message || 'Invalid JSON file.'}`, 'error');
      }
    });

    // Enhance click listener execution flow
    $('__pp_forge_btn').addEventListener('click', () => {
      chrome.storage.local.get(
        ['pp_key', 'pp_provider', 'pp_templates', 'pp_profile_role', 'pp_profile_stack', 'pp_profile_rules'],
        async ({ pp_key, pp_provider, pp_templates, pp_profile_role, pp_profile_stack, pp_profile_rules }) => {
          if (!pp_key) {
            $('__pp_nokey').style.display = 'flex';
            return;
          }
          const domainVal = domainSelect.value;
          const modeVal = modeSelect.value;

          let customTemplate = null;
          let domain = domainVal;
          let mode = modeVal;

          if (domainVal.startsWith('custom_')) {
            const templateId = domainVal.replace('custom_', '');
            customTemplate = (pp_templates || []).find((t) => String(t.id) === templateId);
          }

          // Define local handler for visual stream rendering
          const forgeBtn = $('__pp_forge_btn');
          const loadingEl = $('__pp_loading');
          const errorEl = $('__pp_error');
          const resultEl = $('__pp_result');

          // UI Lock: Disable button and show loading state
          forgeBtn.disabled = true;
          forgeBtn.style.opacity = '0.6';
          forgeBtn.style.cursor = 'not-allowed';
          loadingEl.style.display = 'flex';
          errorEl.style.display = 'none';
          resultEl.style.display = 'none';

          chrome.runtime.sendMessage({
            type: 'PP_API',
            prompt: originalText,
            domain: domain,
            mode: mode,
            provider: pp_provider || 'gemini',
            apiKey: pp_key,
            profileRole: pp_profile_role,
            profileStack: pp_profile_stack,
            profileRules: pp_profile_rules
          }, (response) => {
            // Re-enable UI
            forgeBtn.disabled = false;
            forgeBtn.style.opacity = '1';
            forgeBtn.style.cursor = 'pointer';
            loadingEl.style.display = 'none';

            if (chrome.runtime.lastError) {
              errorEl.textContent = 'Extension communication error.';
              errorEl.style.display = 'block';
              return;
            }

            if (response && response.ok) {
              renderResult(response.data, originalText, overlayEl);
              
              // Persist to history
              chrome.storage.local.get(['pp_prompts'], (data) => {
                const prompts = data.pp_prompts || [];
                const newEntry = {
                  id: 'pp_' + Date.now(),
                  original_text: originalText,
                  updated_at: Date.now(),
                  versions: [{
                    ...response.data,
                    created_at: Date.now(),
                    provider: pp_provider || 'gemini'
                  }]
                };
                chrome.storage.local.set({ pp_prompts: [newEntry, ...prompts].slice(0, 100) });
              });
            } else {
              errorEl.textContent = response?.error || 'Failed to enhance prompt. Please check your API key.';
              errorEl.style.display = 'block';
            }
          });
        }
      );
    });

  // ── Render result ─────────────────────────────────────────────────────

  function renderResult(r, originalText, el) {
    const $ = (id) => el.querySelector(`#${id}`);

    $('__pp_result').style.display = 'flex';

    // Scores
    const scores = [
      {
        id: 'clarity',
        val: r.clarity_score,
        bar: 'clarity-fill',
        num: '__pp_clarity_num',
      },
      {
        id: 'spec',
        val: r.specificity_score,
        bar: 'spec-fill',
        num: '__pp_spec_num',
      },
      {
        id: 'qual',
        val: r.quality_score,
        bar: 'qual-fill',
        num: '__pp_qual_num',
      },
    ];
    scores.forEach((s) => {
      const pct = Math.min(100, Math.max(0, s.val || 0));
      el.querySelector(`#__pp_${s.id}_bar`).style.width = pct + '%';
      $(s.num).textContent = pct;
    });

    // Domain badge
    $('__pp_domain_badge').textContent = r.domain_detected || 'General';
    $('__pp_insight_text').textContent = r.transformation_insight || '';

    // Enhanced prompt — typing effect
    const enhanced = r.enhanced_prompt || '';
    const textEl = $('__pp_enhanced_text');
    textEl.textContent = '';
    let i = 0;
    const tick = setInterval(() => {
      i += 16;
      textEl.textContent = enhanced.slice(0, i);
      if (i >= enhanced.length) {
        textEl.textContent = enhanced;
        clearInterval(tick);
      }
    }, 16);

    // Diff view
    const diffEl = $('__pp_diff_body');
    diffEl.innerHTML = buildDiff(originalText, enhanced);

    // Tags — missing requirements
    const tagsEl = $('__pp_tags_row');
    tagsEl.innerHTML =
      '<div class="pp-tags-label">Requirements added:</div>' +
      (r.missing_requirements || [])
        .map((t) => `<span class="pp-tag-yellow">+ ${esc(t)}</span>`)
        .join('');

    // Ambiguities resolved
    const ambigEl = $('__pp_ambig_row');
    if (r.ambiguities_resolved?.length) {
      ambigEl.innerHTML =
        '<div class="pp-tags-label">Ambiguities resolved:</div>' +
        r.ambiguities_resolved
          .map((t) => `<span class="pp-tag-blue">✓ ${esc(t)}</span>`)
          .join('');
    }

    // Download button
    const actionsDiv = $('__pp_actions');
    const downloadBtn = document.createElement('button');
    downloadBtn.id = '__pp_download_btn';
    downloadBtn.className = 'pp-btn-ghost';
    downloadBtn.textContent = 'Download Prompt';
    actionsDiv.insertBefore(downloadBtn, actionsDiv.firstChild);

    downloadBtn.addEventListener('click', () => {
      const payload = {
        format: 'promptpilot.prompt',
        version: 1,
        exported_at: Date.now(),
        prompt: {
          enhanced_prompt: r.enhanced_prompt,
          clarity_score: r.clarity_score,
          specificity_score: r.specificity_score,
          quality_score: r.quality_score,
          domain_detected: r.domain_detected,
          missing_requirements: r.missing_requirements,
          transformation_insight: r.transformation_insight,
          ambiguities_resolved: r.ambiguities_resolved,
          provider: r.provider,
          model: r.model,
        },
      };
      const stamp = new Date().toISOString().slice(0, 10);
      downloadJson(payload, `promptpilot-prompt-${stamp}.json`);
      showToast('Prompt exported successfully.', 'success');
    });

    $('__pp_copy_enhanced').addEventListener('click', () => {
      const text = document.getElementById('__pp_enhanced_text')?.textContent || '';
      copyText(text);
      $('__pp_copy_enhanced').textContent = '✓ Copied!';
      setTimeout(() => {
        $('__pp_copy_enhanced').textContent = 'Copy';
      }, 2000);
    });

    $('__pp_copy_btn').addEventListener('click', () => {
      const text = document.getElementById('__pp_enhanced_text')?.textContent || '';
      copyText(text);
      showToast('✓ Copied to clipboard!', 'success');
      closeOverlay();
    });

    $('__pp_cancel_btn').addEventListener('click', closeOverlay);

    $('__pp_replace_btn').addEventListener('click', () => {
      const text = document.getElementById('__pp_enhanced_text')?.textContent || '';
      replaceText(text, originalText);
    });
  }

  // ── Text replacement ──────────────────────────────────────────────────

  function replaceText(enhanced, original) {
    let replaced = false;

    if (activeField && (activeField.tagName === 'TEXTAREA' || activeField.tagName === 'INPUT')) {
      const el = activeField;
      const val = el.value;
      const idx = val.indexOf(original);
      if (idx !== -1) {
        const newVal = val.slice(0, idx) + enhanced + val.slice(idx + original.length);
        el.value = newVal;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        replaced = true;
      }
    }

    if (!replaced && selRange) {
      try {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(selRange);
        document.execCommand('insertText', false, enhanced);
        replaced = true;
      } catch (_) {}
    }

    if (!replaced && selRange) {
      try {
        selRange.deleteContents();
        selRange.insertNode(document.createTextNode(enhanced));
        replaced = true;
      } catch (_) {}
    }

    if (replaced) {
      showToast('✓ Prompt replaced successfully!', 'success');
    } else {
      copyText(enhanced);
      showToast('⚠ Could not replace — copied to clipboard instead.', 'warning');
    }

    closeOverlay();
  }

  // ── Diff builder ──────────────────────────────────────────────────────

  function buildDiff(original, enhanced) {
    const oldWords = original.split(/(\s+)/);
    const newWords = enhanced.split(/(\s+)/);

    const m = oldWords.length, n = newWords.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        dp[i][j] = oldWords[i] === newWords[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }

    let html = '';
    let i = 0, j = 0;
    while (i < m || j < n) {
      if (i < m && j < n && oldWords[i] === newWords[j]) {
        html += `<span class="pp-diff-same">${esc(oldWords[i])}</span>`;
        i++;
        j++;
      } else if (j < n && (i >= m || dp[i + 1]?.[j] <= dp[i]?.[j + 1])) {
        if (newWords[j].trim()) html += `<span class="pp-diff-add">${esc(newWords[j])}</span>`;
        else html += esc(newWords[j]);
        j++;
      } else {
        if (oldWords[i].trim()) html += `<span class="pp-diff-rem">${esc(oldWords[i])}</span>`;
        else html += esc(oldWords[i]);
        i++;
      }
    }
    return html;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TOAST NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════

  function showToast(msg, type = 'success') {
    initShadow();
    if (!toastRoot) {
      toastRoot = document.createElement('div');
      toastRoot.id = '__pp_toasts';
      shadowRoot().appendChild(toastRoot);
    }

    const toast = document.createElement('div');
    toast.className = `pp-toast pp-toast-${type}`;
    toast.textContent = msg;
    toastRoot.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('pp-toast-show'));

    setTimeout(() => {
      toast.classList.remove('pp-toast-show');
      toast.classList.add('pp-toast-hide');
      setTimeout(() => toast.remove(), 350);
    }, 3000);
  }

  // ── Utilities ─────────────────────────────────────────────────────────

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function copyText(text) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  function storageSet(obj) {
    return new Promise((resolve) => chrome.storage.local.set(obj, resolve));
  }

  function downloadJson(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function normalizeKey(value) {
    return String(value || '').trim().toLowerCase();
  }

  function mergeImportedData(existing, incoming, mode) {
    const outPrompts = Array.isArray(existing.pp_prompts) ? [...existing.pp_prompts] : [];
    const outHistory = Array.isArray(existing.pp_history) ? [...existing.pp_history] : [];
    const promptsIn = Array.isArray(incoming.prompts) ? incoming.prompts : [];
    const historyIn = Array.isArray(incoming.legacy_history) ? incoming.legacy_history : [];
    const scoreIn = Array.isArray(incoming.score_history) ? incoming.score_history : [];
    const outScores = Array.isArray(existing.pp_score_history) ? [...existing.pp_score_history] : [];

    const promptIndexByKey = new Map();
    outPrompts.forEach((p, idx) => { promptIndexByKey.set(normalizeKey(p?.original_text), idx); });

    const historyIndexByKey = new Map();
    outHistory.forEach((h, idx) => { historyIndexByKey.set(normalizeKey(h?.original), idx); });

    let added = 0;
    let replaced = 0;
    let skipped = 0;

    promptsIn.forEach((prompt) => {
      const key = normalizeKey(prompt?.original_text);
      if (!key) { skipped += 1; return; }
      if (!promptIndexByKey.has(key)) {
        outPrompts.push(prompt);
        promptIndexByKey.set(key, outPrompts.length - 1);
        added += 1;
        return;
      }
      if (mode === 'overwrite') {
        outPrompts[promptIndexByKey.get(key)] = prompt;
        replaced += 1;
      } else {
        skipped += 1;
      }
    });

    historyIn.forEach((entry) => {
      const key = normalizeKey(entry?.original);
      if (!key) return;
      if (!historyIndexByKey.has(key)) {
        outHistory.push(entry);
        historyIndexByKey.set(key, outHistory.length - 1);
        return;
      }
      if (mode === 'overwrite') {
        outHistory[historyIndexByKey.get(key)] = entry;
      }
    });

    outPrompts.sort((a, b) => Number(b?.updated_at || 0) - Number(a?.updated_at || 0));
    outHistory.sort((a, b) => Number(b?.ts || 0) - Number(a?.ts || 0));
    outScores.unshift(...scoreIn);
    outScores.sort((a, b) => Number(b?.timestamp || 0) - Number(a?.timestamp || 0));

    return {
      prompts: outPrompts.slice(0, 100),
      legacyHistory: outHistory.slice(0, 50),
      scoreHistory: outScores.slice(0, 100),
      added,
      replaced,
      skipped,
    };
  }

  async function persistEnhancedEntry({ originalText, mode, domain, provider, result }) {
    const data = await storageGet(['pp_prompts', 'pp_history', 'pp_score_history']);
    const prompts = Array.isArray(data.pp_prompts) ? [...data.pp_prompts] : [];
    const now = Date.now();

    const promptKey = normalizeKey(originalText);
    const promptIndex = prompts.findIndex((p) => normalizeKey(p?.original_text) === promptKey);
    const version = {
      version_number: 1,
      enhanced_prompt: result?.enhanced_prompt || '',
      clarity_score: Number(result?.clarity_score || 0),
      specificity_score: Number(result?.specificity_score || 0),
      quality_score: Number(result?.quality_score || 0),
      domain_detected: result?.domain_detected || '',
      missing_requirements: Array.isArray(result?.missing_requirements) ? result.missing_requirements : [],
      transformation_insight: result?.transformation_insight || '',
      ambiguities_resolved: Array.isArray(result?.ambiguities_resolved) ? result.ambiguities_resolved : [],
    };
    // Future expansion logic here if needed
  }
})();
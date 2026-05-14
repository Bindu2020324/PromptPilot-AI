// ═══════════════════════════════════════════════════════════════════════
// PromptPilot AI — Content Script (Grammarly-style)
// ═══════════════════════════════════════════════════════════════════════
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
  // Using Shadow DOM isolates our CSS completely from the host page
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

    // Inject all styles into shadow root
    const styleEl = document.createElement('style');
    styleEl.textContent = SHADOW_CSS;
    shadow.appendChild(styleEl);

    // Container for pill + overlay
    const root = document.createElement('div');
    root.id = '__pp_container';
    shadow.appendChild(root);
  }

  function shadowRoot() {
    initShadow();
    return shadow.getElementById('__pp_container');
  }

  // ── Pill button ───────────────────────────────────────────────────────

  function showPill(x, y) {
    if (!pillEl) {
      pillEl = document.createElement('button');
      pillEl.id = '__pp_pill';
      pillEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" stroke="white" stroke-width="0.5"/>
      </svg>`;
      pillEl.title = 'Enhance with PromptPilot (Ctrl+Shift+E)';
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

    // Clamp to viewport
    const VW = window.innerWidth,
      VH = window.innerHeight;
    const px = Math.min(Math.max(x, 12), VW - 52);
    const py = Math.min(Math.max(y - 52, 8), VH - 52);

    pillEl.style.left = px + 'px';
    pillEl.style.top = py + 'px';
    pillEl.style.opacity = '1';
    pillEl.style.transform = 'scale(1)';
    pillEl.style.pointerEvents = 'all';
    shadowHost.style.pointerEvents = 'none';
    pillEl.style.pointerEvents = 'all';
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
        // Store range for later replacement
        try {
          selRange = sel.getRangeAt(0).cloneRange();
        } catch (_) {
          selRange = null;
        }
        // Also track which element owns the selection
        activeField = document.activeElement;
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        showPill(
          e.clientX,
          rect.top < 60
            ? rect.bottom + window.scrollY
            : rect.top + window.scrollY - 8
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
    // Ctrl/Cmd + Shift + E
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

    // Position overlay smartly near selection
    positionOverlay();
    window.addEventListener('resize', positionOverlay);

    wireOverlay(text);
  }

  function positionOverlay() {
    if (!overlayEl) return;
    const box = overlayEl.querySelector('#__pp_box');
    if (!box) return;
    // Try to position near selection, fallback to center
    let top = '50%',
      left = '50%',
      transform = 'translate(-50%,-50%)';
    if (selRange) {
      const rect = selRange.getBoundingClientRect();
      const VW = window.innerWidth,
        VH = window.innerHeight;
      const bh = 580,
        bw = 540;
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

  // ── Build overlay HTML ────────────────────────────────────────────────

  function buildOverlayHTML(text) {
    const preview = esc(text.slice(0, 180)) + (text.length > 180 ? '…' : '');
    return `
<div id="__pp_backdrop"></div>
<div id="__pp_box" role="dialog" aria-label="PromptPilot AI">

  <!-- Header -->
  <div id="__pp_header">
    <div id="__pp_logo">
      <div id="__pp_logomark">P</div>
      <span id="__pp_logotext">PromptPilot AI</span>
      <span id="__pp_badge">Copilot</span>
    </div>
    <button id="__pp_close" title="Close (Esc)">✕</button>
  </div>

  <!-- Body -->
  <div id="__pp_body">

    <!-- No key warning -->
    <div id="__pp_nokey" style="display:none">
      ⚠ No API key — click the PromptPilot icon in your toolbar → ⚙ Settings to add one.
    </div>

    <!-- Original -->
    <div class="pp-section">
      <div class="pp-label">Original Prompt</div>
      <div id="__pp_original" class="pp-original-box">${preview}</div>
    </div>

    <!-- Domain + Mode row -->
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

    <!-- Enhance button -->
    <button id="__pp_forge_btn" class="pp-btn-primary">
      <span id="__pp_btn_text">✦ Enhance Prompt</span>
    </button>

    <!-- Error -->
    <div id="__pp_error" class="pp-error" style="display:none"></div>

    <!-- Loading -->
    <div id="__pp_loading" style="display:none" class="pp-loading">
      <div class="pp-spinner"></div>
      <span>Analyzing intent · Injecting expertise…</span>
    </div>

    <!-- Result (hidden until API returns) -->
    <div id="__pp_result" style="display:none">

      <!-- Score bar -->
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

      <!-- Domain badge -->
      <div class="pp-domain-row">
        <span class="pp-domain-badge" id="__pp_domain_badge">—</span>
        <span class="pp-insight" id="__pp_insight_text"></span>
      </div>

      <!-- Tab switcher: Enhanced / Diff -->
      <div id="__pp_tabs" class="pp-tabs">
        <button class="pp-tab pp-tab-active" data-tab="enhanced">Enhanced</button>
        <button class="pp-tab" data-tab="diff">Compare Changes</button>
        <button class="pp-tab" data-tab="added">What Was Added</button>
      </div>

      <!-- Enhanced prompt -->
      <div id="__pp_tab_enhanced" class="pp-tab-panel">
        <div class="pp-prompt-box">
          <div class="pp-prompt-header">
            <span class="pp-prompt-label">
              <span class="pp-green-dot"></span> Enhanced Prompt
            </span>
            <button id="__pp_copy_enhanced" class="pp-btn-ghost">Copy</button>
          </div>
          <div id="__pp_enhanced_text" class="pp-prompt-body"></div>
        </div>
      </div>

      <!-- Diff view -->
      <div id="__pp_tab_diff" class="pp-tab-panel" style="display:none">
        <div class="pp-diff-legend">
          <span class="pp-diff-rem-badge">Removed</span>
          <span class="pp-diff-add-badge">Added</span>
        </div>
        <div id="__pp_diff_body" class="pp-prompt-body pp-diff-body"></div>
      </div>

      <!-- What was added -->
      <div id="__pp_tab_added" class="pp-tab-panel" style="display:none">
        <div id="__pp_tags_row" class="pp-tags-row"></div>
        <div id="__pp_ambig_row" class="pp-tags-row" style="margin-top:8px"></div>
      </div>

      <!-- Actions -->
      <div id="__pp_actions" class="pp-actions">
        <button id="__pp_replace_btn" class="pp-btn-primary pp-btn-green">
          ✓ Replace Original
        </button>
        <button id="__pp_copy_btn" class="pp-btn-ghost">
          Copy Enhanced
        </button>
        <button id="__pp_cancel_btn" class="pp-btn-ghost pp-btn-dim">
          Cancel
        </button>
      </div>

    </div><!-- /result -->

  </div><!-- /body -->
</div><!-- /box -->
`;
  }

  // ── Wire overlay interactions ─────────────────────────────────────────

  function wireOverlay(originalText) {
    const $ = (id) => overlayEl.querySelector(`#${id}`);

    // Close / backdrop
    $('__pp_close').addEventListener('click', closeOverlay);
    $('__pp_backdrop').addEventListener('click', closeOverlay);

    // Tab switching
    overlayEl.querySelectorAll('.pp-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        overlayEl
          .querySelectorAll('.pp-tab')
          .forEach((t) => t.classList.remove('pp-tab-active'));
        tab.classList.add('pp-tab-active');
        const target = tab.dataset.tab;
        overlayEl
          .querySelectorAll('.pp-tab-panel')
          .forEach((p) => (p.style.display = 'none'));
        $(`__pp_tab_${target}`).style.display = 'block';
      });
    });

    // Check API key
    chrome.storage.local.get(['pp_key'], ({ pp_key }) => {
      if (!pp_key) $('__pp_nokey').style.display = 'flex';
    });

    // Enhance button
    $('__pp_forge_btn').addEventListener('click', () => {
      chrome.storage.local.get(
        ['pp_key', 'pp_provider'],
        async ({ pp_key, pp_provider }) => {
          if (!pp_key) {
            $('__pp_nokey').style.display = 'flex';
            return;
          }
          const domain = $('__pp_domain').value;
          const mode = $('__pp_mode').value;

          $('__pp_error').style.display = 'none';
          $('__pp_loading').style.display = 'flex';
          $('__pp_forge_btn').disabled = true;
          $('__pp_btn_text').textContent = '⟳ Enhancing…';

          chrome.runtime.sendMessage(
            {
              type: 'PP_API',
              prompt: originalText,
              domain,
              mode,
              provider: pp_provider || 'gemini',
              apiKey: pp_key,
            },
            (res) => {
              $('__pp_loading').style.display = 'none';
              $('__pp_forge_btn').disabled = false;
              $('__pp_btn_text').textContent = '✦ Re-enhance';

              if (!res || !res.ok) {
                const err = $('__pp_error');
                err.textContent =
                  '⚠ ' + (res?.error || 'Something went wrong.');
                err.style.display = 'block';
                return;
              }

              renderResult(res.data, originalText, overlayEl);
            }
          );
        }
      );
    });
  }

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

    // Copy enhanced button
    $('__pp_copy_enhanced').addEventListener('click', () => {
      copyText(enhanced);
      $('__pp_copy_enhanced').textContent = '✓ Copied!';
      setTimeout(() => {
        $('__pp_copy_enhanced').textContent = 'Copy';
      }, 2000);
    });

    // Copy button in actions
    $('__pp_copy_btn').addEventListener('click', () => {
      copyText(enhanced);
      showToast('✓ Copied to clipboard!', 'success');
      closeOverlay();
    });

    // Cancel button
    $('__pp_cancel_btn').addEventListener('click', closeOverlay);

    // Replace button — with confirmation
    $('__pp_replace_btn').addEventListener('click', () => {
      replaceText(enhanced, originalText);
    });
  }

  // ── Text replacement ──────────────────────────────────────────────────

  function replaceText(enhanced, original) {
    let replaced = false;

    // Strategy 1: Replace in focused textarea
    if (
      activeField &&
      (activeField.tagName === 'TEXTAREA' || activeField.tagName === 'INPUT')
    ) {
      const el = activeField;
      const val = el.value;
      const idx = val.indexOf(original);
      if (idx !== -1) {
        const newVal =
          val.slice(0, idx) + enhanced + val.slice(idx + original.length);
        el.value = newVal;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        replaced = true;
      }
    }

    // Strategy 2: Replace via execCommand in contenteditable
    if (!replaced && selRange) {
      try {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(selRange);
        document.execCommand('insertText', false, enhanced);
        replaced = true;
      } catch (_) {}
    }

    // Strategy 3: Range replacement
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
      // Fallback: copy to clipboard
      copyText(enhanced);
      showToast(
        '⚠ Could not replace — copied to clipboard instead.',
        'warning'
      );
    }

    closeOverlay();
  }

  // ── Diff builder ──────────────────────────────────────────────────────
  // Word-level diff: removed words shown in red, added words shown in green

  function buildDiff(original, enhanced) {
    const oldWords = original.split(/(\s+)/);
    const newWords = enhanced.split(/(\s+)/);

    // Simple LCS-based diff (good enough for prompts)
    const m = oldWords.length,
      n = newWords.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--)
      for (let j = n - 1; j >= 0; j--)
        dp[i][j] =
          oldWords[i] === newWords[j]
            ? dp[i + 1][j + 1] + 1
            : Math.max(dp[i + 1][j], dp[i][j + 1]);

    let html = '';
    let i = 0,
      j = 0;
    while (i < m || j < n) {
      if (i < m && j < n && oldWords[i] === newWords[j]) {
        html += `<span class="pp-diff-same">${esc(oldWords[i])}</span>`;
        i++;
        j++;
      } else if (j < n && (i >= m || dp[i + 1]?.[j] <= dp[i]?.[j + 1])) {
        if (newWords[j].trim())
          html += `<span class="pp-diff-add">${esc(newWords[j])}</span>`;
        else html += esc(newWords[j]);
        j++;
      } else {
        if (oldWords[i].trim())
          html += `<span class="pp-diff-rem">${esc(oldWords[i])}</span>`;
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

    // Animate in
    requestAnimationFrame(() => toast.classList.add('pp-toast-show'));

    // Remove after 3s
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
      navigator.clipboard.writeText(text).catch(() => fbCopy(text));
    } else {
      fbCopy(text);
    }
  }

  function fbCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
    } catch (_) {}
    document.body.removeChild(ta);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ALL CSS INSIDE SHADOW DOM (fully isolated from host page)
  // ═══════════════════════════════════════════════════════════════════════

  const SHADOW_CSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Pill button ── */
    #__pp_pill {
      position: fixed;
      width: 38px; height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      border: none;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(124,58,237,0.55), 0 0 0 2px rgba(255,255,255,0.15);
      transition: opacity 0.18s cubic-bezier(.4,0,.2,1), transform 0.18s cubic-bezier(.4,0,.2,1);
      opacity: 0; transform: scale(0.5);
      z-index: 2147483647;
    }
    #__pp_pill svg { width: 18px; height: 18px; }
    #__pp_pill:hover {
      transform: scale(1.15) !important;
      box-shadow: 0 6px 28px rgba(124,58,237,0.7);
    }

    /* ── Backdrop ── */
    #__pp_backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(3px);
      z-index: 1;
      animation: ppFadeIn 0.18s ease;
    }

    /* ── Overlay positioner ── */
    #__pp_overlay {
      position: fixed;
      z-index: 2147483646;
      pointer-events: all;
      animation: ppSlideUp 0.22s cubic-bezier(.4,0,.2,1);
    }

    /* ── Main box ── */
    #__pp_box {
      position: relative; z-index: 2;
      width: 540px; max-width: calc(100vw - 32px);
      max-height: calc(100vh - 48px);
      background: #0e0e1a;
      border: 1px solid rgba(124,58,237,0.3);
      border-radius: 18px;
      overflow: hidden;
      display: flex; flex-direction: column;
      box-shadow: 0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #fff;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Header ── */
    #__pp_header {
      padding: 14px 18px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
      background: rgba(124,58,237,0.06);
    }
    #__pp_logo { display: flex; align-items: center; gap: 9px; }
    #__pp_logomark {
      width: 28px; height: 28px; border-radius: 8px;
      background: linear-gradient(135deg,#7c3aed,#4f46e5);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 800; color: white;
      box-shadow: 0 2px 10px rgba(124,58,237,0.5);
    }
    #__pp_logotext { font-size: 14px; font-weight: 700; letter-spacing: -0.01em; color: white; }
    #__pp_badge {
      font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      color: #a78bfa; background: rgba(124,58,237,0.18); border: 1px solid rgba(124,58,237,0.35);
      padding: 2px 7px; border-radius: 20px;
    }
    #__pp_close {
      background: none; border: none; color: rgba(255,255,255,0.4);
      font-size: 18px; cursor: pointer; padding: 3px 7px; border-radius: 7px;
      transition: all 0.15s; line-height: 1;
    }
    #__pp_close:hover { color: white; background: rgba(255,255,255,0.08); }

    /* ── Body ── */
    #__pp_body {
      flex: 1; overflow-y: auto; padding: 16px 18px;
      display: flex; flex-direction: column; gap: 12px;
    }
    #__pp_body::-webkit-scrollbar { width: 3px; }
    #__pp_body::-webkit-scrollbar-track { background: transparent; }
    #__pp_body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }

    /* ── No key warning ── */
    #__pp_nokey {
      background: rgba(251,191,36,0.07); border: 1px solid rgba(251,191,36,0.3);
      border-radius: 10px; padding: 10px 13px;
      font-size: 12px; color: #fcd34d; line-height: 1.5;
      display: flex; gap: 8px; align-items: flex-start;
    }

    /* ── Section / labels ── */
    .pp-section { display: flex; flex-direction: column; gap: 5px; }
    .pp-label { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.3); }
    .pp-original-box {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 10px 12px;
      font-size: 12.5px; color: rgba(255,255,255,0.6); line-height: 1.65;
      max-height: 70px; overflow-y: auto;
    }

    /* ── Row layout ── */
    .pp-row { display: flex; gap: 10px; }

    /* ── Select ── */
    .pp-select {
      width: 100%; padding: 8px 10px; border-radius: 9px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
      color: white; font-size: 12px; outline: none; cursor: pointer;
      font-family: inherit;
      appearance: none; -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(255,255,255,0.3)'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 10px center;
      transition: border-color 0.15s;
    }
    .pp-select:focus { border-color: rgba(124,58,237,0.6); }
    .pp-select option { background: #1a1a2e; color: white; }

    /* ── Primary button ── */
    .pp-btn-primary {
      padding: 11px 16px; border-radius: 10px; border: none;
      background: linear-gradient(135deg,#7c3aed,#4f46e5);
      color: white; font-size: 13px; font-weight: 700; cursor: pointer;
      font-family: inherit;
      box-shadow: 0 4px 18px rgba(124,58,237,0.4);
      transition: opacity 0.2s, transform 0.15s;
      display: flex; align-items: center; justify-content: center; gap: 7px;
    }
    .pp-btn-primary:hover { opacity: 0.9; }
    .pp-btn-primary:active { transform: scale(0.98); }
    .pp-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }
    .pp-btn-green { background: linear-gradient(135deg,#059669,#047857) !important; box-shadow: 0 4px 18px rgba(5,150,105,0.4) !important; }

    /* ── Ghost button ── */
    .pp-btn-ghost {
      padding: 7px 13px; border-radius: 9px; cursor: pointer;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.65);
      font-size: 12px; font-weight: 500; font-family: inherit;
      transition: all 0.15s;
    }
    .pp-btn-ghost:hover { background: rgba(255,255,255,0.1); color: white; }
    .pp-btn-dim { color: rgba(255,255,255,0.3) !important; }

    /* ── Error ── */
    .pp-error {
      background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.3);
      border-radius: 10px; padding: 10px 13px;
      font-size: 12px; color: #fca5a5; line-height: 1.5;
    }

    /* ── Loading ── */
    .pp-loading {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      padding: 10px; font-size: 11.5px; color: rgba(255,255,255,0.35);
    }
    .pp-spinner {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid rgba(124,58,237,0.2);
      border-top-color: #7c3aed;
      animation: ppSpin 0.7s linear infinite; flex-shrink: 0;
    }

    /* ── Result container ── */
    #__pp_result { display: flex; flex-direction: column; gap: 10px; animation: ppFadeIn 0.25s ease; }

    /* ── Scores ── */
    .pp-scores { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 11px; }
    .pp-score-item { display: flex; align-items: center; gap: 8px; }
    .pp-score-label { font-size: 10px; color: rgba(255,255,255,0.35); width: 68px; flex-shrink: 0; }
    .pp-score-bar { flex: 1; height: 5px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; }
    .pp-score-fill { height: 100%; border-radius: 99px; width: 0%; transition: width 0.9s cubic-bezier(.4,0,.2,1); }
    .clarity-fill { background: linear-gradient(90deg,#7c3aed,#a78bfa); }
    .spec-fill    { background: linear-gradient(90deg,#059669,#34d399); }
    .qual-fill    { background: linear-gradient(90deg,#1d4ed8,#60a5fa); }
    .pp-score-num { font-size: 11px; font-weight: 700; width: 24px; text-align: right; }

    /* ── Domain row ── */
    .pp-domain-row { display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
    .pp-domain-badge { font-size: 10.5px; color: #6ee7b7; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.25); padding: 3px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
    .pp-insight { font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.5; }

    /* ── Tabs ── */
    .pp-tabs { display: flex; gap: 3px; background: rgba(255,255,255,0.04); border-radius: 10px; padding: 3px; }
    .pp-tab { flex: 1; padding: 6px 8px; border-radius: 8px; border: none; background: none; color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; }
    .pp-tab-active { background: rgba(124,58,237,0.25) !important; color: #c4b5fd !important; }
    .pp-tab:hover:not(.pp-tab-active) { color: rgba(255,255,255,0.7); }

    /* ── Prompt box ── */
    .pp-prompt-box { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 11px; overflow: hidden; }
    .pp-prompt-header { padding: 9px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; }
    .pp-prompt-label { font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 6px; }
    .pp-green-dot { width: 6px; height: 6px; border-radius: 50%; background: #34d399; box-shadow: 0 0 5px #34d399; display: inline-block; }
    .pp-prompt-body { padding: 12px 13px; font-size: 11.5px; line-height: 1.85; color: rgba(255,255,255,0.8); white-space: pre-wrap; font-family: 'Courier New', Courier, monospace; max-height: 200px; overflow-y: auto; }
    .pp-prompt-body::-webkit-scrollbar { width: 3px; }
    .pp-prompt-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }

    /* ── Diff ── */
    .pp-diff-body { font-family: 'Courier New', Courier, monospace !important; }
    .pp-diff-legend { display: flex; gap: 10px; margin-bottom: 7px; }
    .pp-diff-rem-badge { font-size: 10px; color: #f87171; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); padding: 2px 8px; border-radius: 20px; }
    .pp-diff-add-badge { font-size: 10px; color: #34d399; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.25); padding: 2px 8px; border-radius: 20px; }
    .pp-diff-same { color: rgba(255,255,255,0.55); }
    .pp-diff-rem  { color: #f87171; background: rgba(239,68,68,0.15); border-radius: 3px; padding: 0 2px; text-decoration: line-through; }
    .pp-diff-add  { color: #34d399; background: rgba(52,211,153,0.15); border-radius: 3px; padding: 0 2px; }

    /* ── Tags ── */
    .pp-tags-row { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
    .pp-tags-label { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.28); width: 100%; margin-bottom: 2px; }
    .pp-tag-yellow { font-size: 11px; color: #fcd34d; background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.22); padding: 3px 9px; border-radius: 20px; }
    .pp-tag-blue   { font-size: 11px; color: #93c5fd; background: rgba(96,165,250,0.08); border: 1px solid rgba(96,165,250,0.22); padding: 3px 9px; border-radius: 20px; }

    /* ── Actions ── */
    .pp-actions { display: flex; gap: 8px; padding-top: 2px; flex-wrap: wrap; }
    .pp-actions .pp-btn-primary { flex: 1; min-width: 130px; }

    /* ── Toasts ── */
    #__pp_toasts {
      position: fixed; bottom: 24px; right: 24px;
      display: flex; flex-direction: column; gap: 8px;
      z-index: 2147483647; pointer-events: none;
    }
    .pp-toast {
      padding: 11px 16px; border-radius: 10px; font-size: 13px; font-weight: 500;
      font-family: 'Segoe UI', system-ui, sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      opacity: 0; transform: translateY(8px) scale(0.97);
      transition: all 0.25s cubic-bezier(.4,0,.2,1);
      pointer-events: none;
    }
    .pp-toast-show { opacity: 1 !important; transform: translateY(0) scale(1) !important; }
    .pp-toast-hide { opacity: 0 !important; transform: translateY(-6px) scale(0.97) !important; }
    .pp-toast-success { background: rgba(5,150,105,0.92); color: white; border: 1px solid rgba(52,211,153,0.4); }
    .pp-toast-warning { background: rgba(180,130,0,0.92); color: white; border: 1px solid rgba(251,191,36,0.4); }
    .pp-toast-error   { background: rgba(185,28,28,0.92); color: white; border: 1px solid rgba(239,68,68,0.4); }

    /* ── Animations ── */
    @keyframes ppFadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes ppSlideUp { from{opacity:0;transform:translateY(14px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes ppSpin    { to{transform:rotate(360deg)} }
  `;
})();

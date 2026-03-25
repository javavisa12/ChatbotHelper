/* ── chat.js ─────────────────────────────────────────────────────────
 * Orchestrates a full send → response cycle:
 *   1. Guard checks (busy, backend down, empty input)
 *   2. Render the user bubble
 *   3. Show thinking animation
 *   4. Call api.query()
 *   5. Render the assistant bubble
 *   6. Handle errors
 * ─────────────────────────────────────────────────────────────────── */

import { state }                                              from './state.js';
import { query }                                              from './api.js';
import { fmt }                                                from './formatter.js';
import {
  renderUserMsg,
  renderAssistantMsg,
  renderSysMsg,
  showThinking,
  hideThinking,
  setSendBusy,
  autoResize,
}                                                             from './Ui.js';

export async function sendMessage() {
  if (state.busy || !state.backendUp) return;

  const inp  = document.getElementById('msgInput');
  const text = inp.value.trim();

  // 'analyze' mode can run without a typed question
  if (!text && state.mode !== 'analyze') return;

  // Render user message
  renderUserMsg(text || '(Full Project Analysis)', [...state.attached]);
  inp.value       = '';
  inp.style.height = '';

  // Enter busy state
  state.busy            = true;
  state.requestStartTime = Date.now();
  setSendBusy(true);
  showThinking();

  try {
    const d = await query(state.mode, text, state.selectedModel);
    hideThinking();
    renderAssistantMsg(fmt(d.response));
  } catch (err) {
    hideThinking();
    renderSysMsg('Error: ' + err.message, 'err');
  } finally {
    state.busy = false;
    setSendBusy(false);
  }
}

/** Handle Enter / Shift+Enter in the textarea. */
export function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}


document.addEventListener('click', function (e) {
  if (e.target.classList.contains('code-copy-btn')) {
    
    const btn = e.target;

    // find the code block
    const wrapper = btn.closest('.code-block-wrapper');
    const code = wrapper.querySelector('pre.cb').innerText;

    // copy to clipboard
    navigator.clipboard.writeText(code);

    // feedback
    btn.textContent = 'COPIED ✓';
    btn.classList.add('copied');

    setTimeout(() => {
      btn.textContent = 'COPY';
      btn.classList.remove('copied');
    }, 1500);
  }
});
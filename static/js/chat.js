/* ── chat.js ─────────────────────────────────────────────────────────
 * sendMessage orchestration + session-reset helpers.
 * ─────────────────────────────────────────────────────────────────── */

import { state, SYSTEM_PROMPT }                  from './state.js';
import { query }                                 from './api.js';
import { fmt }                                   from './formatter.js';
import { saveHistory, loadHistory, clearHistory } from './chatHistory.js';
import {
  renderUserMsg,
  renderAssistantMsg,
  renderSysMsg,
  showThinking,
  hideThinking,
  setSendBusy,
} from './Ui.js';

const RAW_KEEP      = 4;  // number of recent messages to keep
const SUMMARY_EVERY = 6;  // trim when non-system messages exceed this

// ── Load persisted history on startup ────────────────────────────────
state.messages = loadHistory();

// ── Session reset ─────────────────────────────────────────────────────
export function resetSession() {
  state.messages = clearHistory();
}

// ── Trim history (keep system prompt + last RAW_KEEP messages) ────────
function trimHistory() {
  const nonSystem = state.messages.filter(m => m.role !== 'system');
  if (nonSystem.length > SUMMARY_EVERY) {
    state.messages = [{ ...SYSTEM_PROMPT }, ...nonSystem.slice(-RAW_KEEP)];
  }
}

// ── Main send ─────────────────────────────────────────────────────────
export async function sendMessage() {
  if (state.busy || !state.backendUp) return;

  const inp  = document.getElementById('msgInput');
  const text = inp.value.trim();
  if (!text && state.mode !== 'analyze') return;

  const userContent = text || 'Full Project Analysis';
  state.messages.push({ role: 'user', content: userContent });

  renderUserMsg(text || '(Full Project Analysis)', [...state.attached]);
  inp.value        = '';
  inp.style.height = '';

  trimHistory();

  state.busy             = true;
  state.requestStartTime = Date.now();
  setSendBusy(true);
  showThinking();

  try {
    const d     = await query(state.mode, text, state.messages);
    hideThinking();

    const reply = fmt(d.response);
    state.messages.push({ role: 'assistant', content: reply });
    saveHistory(state.messages);
    renderAssistantMsg(reply);

  } catch (err) {
    hideThinking();
    renderSysMsg('Error: ' + err.message, 'err');
  } finally {
    state.busy = false;
    setSendBusy(false);
  }
}

export function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

export function newChat() {
  resetSession();
}

// ── Code copy handler ─────────────────────────────────────────────────
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('code-copy-btn')) {
    const btn  = e.target;
    const code = btn.closest('.code-block-wrapper')?.querySelector('pre.cb')?.innerText;
    if (!code) return;

    navigator.clipboard.writeText(code);
    btn.textContent = 'COPIED ✓';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'COPY';
      btn.classList.remove('copied');
    }, 1500);
  }
});

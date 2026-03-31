/* ── main.js ─────────────────────────────────────────────────────────
 * Application entry point.
 *
 * Responsibilities:
 *   1. Import every module (ensures they're executed / registered).
 *   2. Start the health-poll.
 *   3. Expose the small set of functions that the HTML needs to call
 *      via inline onclick / onchange / oninput attributes.
 *
 * Design note: keep this file thin — all real logic lives in the
 * dedicated modules listed below.
 *
 * Module map
 * ──────────────────────────────────────────────────────────────────
 *  config.js    – API base-URL & MODES constant
 *  state.js     – single mutable state object
 *  api.js       – all fetch() calls to the backend
 *  health.js    – /api/status polling
 *  ui.js        – DOM helpers, renderers, sidebar, clear
 *  formatter.js – LLM-text → HTML (code blocks, inline code)
 *  files.js     – file/folder attach, chips, backend sync
 *  chat.js      – sendMessage() orchestration
 * ─────────────────────────────────────────────────────────────────── */

/* ── main.js ─────────────────────────────────────────────────────────
 * Application entry point.
 * ─────────────────────────────────────────────────────────────────── */

import { state }                                              from './state.js';
import { startHealthPoll }                                    from './health.js';
import { applyMode, toggleSidebar, clearChat, fillPrompt, autoResize } from './Ui.js';
import { handleFiles, attachFolder }                          from './files.js';
import { sendMessage, handleKey }                             from './chat.js';
import { downloadCode }                                       from './formatter.js';




/* ── Sun icon (light mode active) ── */
const SUN = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

/* ── Moon icon (dark mode active) ── */
const MOON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

function applyTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  const btn = document.getElementById('themeToggle');
  if (btn) btn.innerHTML = theme === 'light' ? MOON : SUN;
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light');
  const next = isLight ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem('theme', next);
}

/* ── Boot ────────────────────────────────────────────────────────── */
startHealthPoll();

window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
});

/* ── Globals for inline HTML handlers ───────────────────────────── */
window.setMode = (m) => { state.mode = m; applyMode(m); };

window.changeModel = () => {
  state.selectedModel = document.getElementById('modelSelect').value;
  document.getElementById('val-model').textContent = state.selectedModel;
  import('./Ui.js').then(({ renderSysMsg }) =>
    renderSysMsg(`Switched to model: ${state.selectedModel}`, 'ok')
  );
};

window.toggleSidebar = toggleSidebar;
window.clearChat     = clearChat;
window.fillPrompt    = fillPrompt;
window.handleFiles   = handleFiles;
window.attachFolder  = attachFolder;
window.sendMessage   = sendMessage;
window.handleKey     = handleKey;
window.autoResize    = autoResize;
window.downloadCode  = downloadCode;
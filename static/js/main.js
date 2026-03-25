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

import { state }                          from './state.js';
import { MODES }                          from './config.js';
import { startHealthPoll }                from './health.js';
import { applyMode, toggleSidebar, clearChat, fillPrompt, autoResize } from './Ui.js';
import { handleFiles, attachFolder }      from './files.js';
import { sendMessage, handleKey }         from './chat.js';
import { downloadCode }                   from './formatter.js';

/* ── 1. Boot ─────────────────────────────────────────────────────── */
startHealthPoll();

/* ── 2. Globals required by inline HTML handlers ─────────────────── *
 *
 * Functions called from onclick="…" attributes in index.html must be
 * on `window`.  We expose only what's strictly necessary here, keeping
 * the global namespace as small as possible.
 */

/** Switch the active mode. */
window.setMode = (m) => {
  state.mode = m;
  applyMode(m);
};

/** Model dropdown change. */
window.changeModel = () => {
  state.selectedModel = document.getElementById('modelSelect').value;
  document.getElementById('val-model').textContent = state.selectedModel;
  // Lazy import renderSysMsg to avoid a circular dep at the top level
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
// window._removeFile is registered inside files.js
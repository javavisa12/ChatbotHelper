/* ── state.js ───────────────────────────────────────────────────────
 * Single, mutable app-state object.
 * ─────────────────────────────────────────────────────────────────── */

const SYSTEM_PROMPT = { role: 'system', content: 'You are a helpful Python assistant.' };

export const state = {
  mode:             'ask',
  busy:             false,
  backendUp:        false,
  attached:         [],
  requestStartTime: null,
  sidebarCollapsed: false,
  messages:         [{ ...SYSTEM_PROMPT }],
};

export { SYSTEM_PROMPT };
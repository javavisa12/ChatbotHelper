/* ── state.js ────────────────────────────────────────────────────────
 * Single, mutable app-state object.
 * All modules read/write through this object so state is never spread
 * across multiple files as bare `let` variables.
 * ─────────────────────────────────────────────────────────────────── */

export const state = {
  /** Currently active mode key (matches a key in MODES). */
  mode: 'ask',

  /** True while an API request is in-flight. */
  busy: false,

  /** True once /api/status has returned 200. */
  backendUp: false,

  /** Array of { name: string, content: string } objects. */
  attached: [],

  /** performance.now() snapshot taken when a request starts. */
  requestStartTime: null,

  /** Model key chosen in the top-bar select. */
  selectedModel: 'phi3',

  /** Whether the sidebar is currently collapsed. */
  sidebarCollapsed: false,
};
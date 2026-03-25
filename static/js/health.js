/* ── health.js ───────────────────────────────────────────────────────
 * Backend health-polling: pings /api/status every 5 s and keeps
 * state.backendUp and the status-bar indicators in sync.
 * ─────────────────────────────────────────────────────────────────── */

import { state }      from './state.js';
import { fetchStatus } from './api.js';
import { setConn, setProj } from './Ui.js';

async function ping() {
  try {
    const d = await fetchStatus();
    state.backendUp = true;
    setConn(true);
    document.getElementById('val-model').textContent = state.selectedModel;
    if (d.project_loaded) setProj(d.project_path || 'loaded');
  } catch {
    state.backendUp = false;
    setConn(false);
  }
}

/** Start polling immediately and repeat every 5 seconds. */
export function startHealthPoll() {
  ping();
  setInterval(ping, 5_000);
}
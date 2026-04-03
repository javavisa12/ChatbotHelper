/* ── health.js ──────────────────────────────────────────────────────
 * Backend health-polling every 5s.
 * ─────────────────────────────────────────────────────────────────── */

import { state }       from './state.js';
import { fetchStatus } from './api.js';
import { setConn, setProj } from './Ui.js';

async function ping() {
  try {
    const d = await fetchStatus();
    state.backendUp = true;
    setConn(true);

    // llm_loader pool status
    const llmEl  = document.getElementById('val-llm');
    const poolEl = document.getElementById('val-pool');
    const pipLlm = document.getElementById('pip-llm');
    const pipPool = document.getElementById('pip-pool');

    if (llmEl && d.llm_loader) {
      llmEl.textContent   = d.llm_loader;
      pipLlm.className    = d.llm_loader === 'ok' ? 'pip on' : 'pip err';
    }
    if (poolEl && d.pool_idle !== undefined) {
      poolEl.textContent  = `${d.pool_idle}/${d.pool_total}`;
      pipPool.className   = d.pool_idle > 0 ? 'pip on' : 'pip dim';
    }

    if (d.project_loaded) setProj(d.project_path || 'loaded');
  } catch {
    state.backendUp = false;
    setConn(false);
  }
}

export function startHealthPoll() {
  ping();
  setInterval(ping, 5_000);
}
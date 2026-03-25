/* ── api.js ──────────────────────────────────────────────────────────
 * All network calls to the Python backend.
 * Returns parsed JSON or throws an Error with a human-readable message.
 * ─────────────────────────────────────────────────────────────────── */

import { API } from './config.js';

/**
 * GET /api/status
 * @returns {{ project_loaded: boolean, project_path?: string }}
 */
export async function fetchStatus() {
  const r = await fetch(`${API}/status`, { signal: AbortSignal.timeout(2500) });
  return r.json();
}

/**
 * POST /api/load_project
 * @param {string} path
 * @param {string} model
 * @returns {{ files: string[] }}
 */
export async function loadProject(path, model) {
  const r = await fetch(`${API}/load_project`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ path, model }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Load project failed');
  return d;
}

/**
 * POST /api/load_files
 * @param {{ name: string, content: string }[]} files
 * @param {string} model
 */
export async function loadFiles(files, model) {
  await fetch(`${API}/load_files`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ files, model }),
  });
}

/**
 * Generic query dispatcher.
 * @param {string} mode          One of: ask | analyze | review | refactor | pyqa
 * @param {string} text          User message text
 * @param {string} model         Selected model key
 * @returns {{ response: string }}
 */
export async function query(mode, text, model) {
  const endpoint = mode === 'pyqa' ? 'python_qa' : mode;
  const body     = { model };

  if (mode === 'pyqa' || mode === 'ask')  body.question = text;
  if (mode === 'refactor')                body.focus    = text;

  const r = await fetch(`${API}/${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Server error');
  return d;
}
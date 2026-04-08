/* ── api.js ─────────────────────────────────────────────────────────
 * All network calls to the Python backend.
 * ─────────────────────────────────────────────────────────────────── */

import { API } from './config.js';

export async function fetchStatus() {
  const r = await fetch(`${API}/status`, { signal: AbortSignal.timeout(2500) });
  return r.json();
}

export async function loadProject(path) {
  const r = await fetch(`${API}/load_project`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ path }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Load project failed');
  return d;
}

export async function loadFiles(files) {
  await fetch(`${API}/load_files`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ files }),
  });
}

export async function query(mode, text, messages) {
  const endpoint = mode === 'pyqa' ? 'python_qa' : mode;

  const body = { messages };
  if (mode === 'pyqa' || mode === 'ask') body.question = text;
  if (mode === 'refactor')               body.focus    = text;

  const r = await fetch(`${API}/${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Server error');
  return d;
}

/* ── api.js ─────────────────────────────────────────────────────────
 * All network calls to the Python backend.
 * ─────────────────────────────────────────────────────────────────── */

export async function query(mode, text, messages) {
  const endpoint = mode === 'pyqa' ? 'pyqa' : 'ask';

  const body = { messages, question: text };

  const r = await fetch(`${API}/${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Server error');
  return d;
}

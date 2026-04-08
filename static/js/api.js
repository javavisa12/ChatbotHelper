import { API } from './config.js';

export async function query(mode, text, messages) {
  // Use 'ask' for Code Review and 'pyqa' for General Q&A
  const endpoint = mode === 'pyqa' ? 'pyqa' : 'ask';

  const body = { question: text };

  const r = await fetch(`${API}/${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // MUST be here to send session cookies
    body:    JSON.stringify(body),
  });

  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Server error');
  return d;
}

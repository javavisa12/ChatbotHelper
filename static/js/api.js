/* Updated api.js */
import { API } from './config.js';

export async function fetchStatus() {
  const r = await fetch(`${API}/status`, { 
    signal: AbortSignal.timeout(2500),
    credentials: 'include' // Needed for CORS sessions
  });
  return r.json();
}

export async function loadProject(path) {
  const r = await fetch(`${API}/load_project`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:    JSON.stringify({ path }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Load project failed');
  return d;
}

export async function loadFiles(files) {
  // Fixed: added result handling and credentials
  const r = await fetch(`${API}/load_files`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:    JSON.stringify({ files }),
  });
  return r.json();
}

export async function query(mode, text, messages) {
  // Matches your backend route names in ai.py and general.py
  const endpoint = mode === 'pyqa' ? 'pyqa' : 'ask'; 

  const body = { 
    question: text, // Matches request.json.get("question") in Python
    messages: messages 
  };

  const r = await fetch(`${API}/${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Allows Flask to see your session_id
    body:    JSON.stringify(body),
  });

  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Server error');
  return d;
}

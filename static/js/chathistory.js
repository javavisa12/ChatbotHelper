// ── chatHistory.js ──────────────────────────────────────────────────

const STORAGE_KEY = 'chatHistory';
const SYSTEM_PROMPT = { role: "system", content: "You are a helpful Python assistant." };

// ── SAVE ────────────────────────────────────────────────────────────
export function saveHistory(messages) {
  try {
    const serialized = JSON.stringify(messages);
    // JSON.stringify turns this:
    //   [{ role: "user", content: "hello" }]
    // into this string:
    //   '[{"role":"user","content":"hello"}]'

    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.warn('Storage full — trimming history...');
      const trimmed = [messages[0], ...messages.slice(-6)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  }
}

// ── LOAD ────────────────────────────────────────────────────────────
export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // raw is either null (nothing saved) or a JSON string

    if (!raw) return [SYSTEM_PROMPT]; // first ever visit

    const parsed = JSON.parse(raw);
    // JSON.parse turns the string back into a real JS array of objects

    return parsed;
  } catch (err) {
    // JSON.parse throws if the string is corrupted
    console.warn('Corrupted history — resetting.');
    localStorage.removeItem(STORAGE_KEY);
    return [SYSTEM_PROMPT];
  }
}

// ── CLEAR ───────────────────────────────────────────────────────────
export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  return [SYSTEM_PROMPT];
}

// ── INSPECT (debug helper) ──────────────────────────────────────────
export function getStorageSize() {
  const raw = localStorage.getItem(STORAGE_KEY) || '';
  const bytes = new Blob([raw]).size;
  return {
    bytes,
    kb: (bytes / 1024).toFixed(2) + ' KB',
    messages: JSON.parse(raw || '[]').length
  };
}
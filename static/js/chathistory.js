// ── chatHistory.js ──────────────────────────────────────────────────

const STORAGE_KEY   = 'chatHistory';
const SYSTEM_PROMPT = { role: "system", content: "You are a helpful Python assistant." };
const TAIL_SIZE     = 4;

// ── SAVE ─────────────────────────────────────────────────────────────
export function saveHistory(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.warn('Storage full — trimming...');
      const trimmed = [messages[0], ...messages.slice(-TAIL_SIZE)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  }
}

// ── LOAD ─────────────────────────────────────────────────────────────
export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [{ ...SYSTEM_PROMPT }];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Corrupted history — resetting.');
    localStorage.removeItem(STORAGE_KEY);
    return [{ ...SYSTEM_PROMPT }];
  }
}

// ── CLEAR ─────────────────────────────────────────────────────────────
export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  return [{ ...SYSTEM_PROMPT }];
}

// ── DEBUG ─────────────────────────────────────────────────────────────
export function getStorageSize() {
  const raw   = localStorage.getItem(STORAGE_KEY) || '';
  const bytes = new Blob([raw]).size;
  return {  
    bytes,  
    kb:       (bytes / 1024).toFixed(2) + ' KB',  
    messages: JSON.parse(raw || '[]').length, 
  };  
}   

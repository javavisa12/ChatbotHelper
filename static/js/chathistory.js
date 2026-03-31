// ── chatHistory.js ──────────────────────────────────────────────────

const STORAGE_KEY = 'chatHistory';
const SYSTEM_PROMPT = { role: "system", content: "You are a helpful Python assistant." };

// How many messages to keep verbatim at the tail (recent context)
const TAIL_SIZE = 6;
// Only summarize when history exceeds this many messages (excluding system)
const SUMMARIZE_THRESHOLD = 20;

// ── SUMMARIZE ───────────────────────────────────────────────────────
// message, then returns [systemPrompt, summaryMsg, ...tail].
async function summarizeHistory(messages) {
  // Separate system prompt, old messages, and recent tail
  const [system, ...rest] = messages;
  const tail = rest.slice(-TAIL_SIZE);        // keep these verbatim
  const toSummarize = rest.slice(0, -TAIL_SIZE); // compress these

  if (toSummarize.length === 0) return messages; // nothing to compress

  // Format the old messages into a readable transcript for the API
  const transcript = toSummarize
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content:
              'Summarize the following conversation concisely, preserving key facts, ' +
              'decisions, code discussed, and any important context. ' +
              'Write in third person (e.g. "The user asked... The assistant explained...").\n\n' +
              transcript,
          },
        ],
      }),
    });

    const data = await response.json();
    const summaryText = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Reconstruct: [system, synthetic summary message, ...recent tail]
    const summaryMessage = {
      role: 'assistant',
      content: `[Conversation summary]\n${summaryText}`,
    };

    return [system, summaryMessage, ...tail];
  } catch (err) {
    console.warn('Summarization failed — saving unsummarized:', err);
    return messages; // graceful fallback: save as-is
  }
}

// ── SAVE ────────────────────────────────────────────────────────────
export async function saveHistory(messages) {
  try {
    // Summarize if history has grown long (excluding the system prompt)
    const payload =
      messages.length - 1 > SUMMARIZE_THRESHOLD
        ? summarizeHistory(messages)
        : messages;

    const serialized = JSON.stringify(payload);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.warn('Storage full — trimming history...');
      const trimmed = [messages[0], ...messages.slice(-TAIL_SIZE)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  }
}

// ── LOAD ────────────────────────────────────────────────────────────
export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [SYSTEM_PROMPT];
    return JSON.parse(raw);
  } catch (err) {
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
    messages: JSON.parse(raw || '[]').length,
  };
}
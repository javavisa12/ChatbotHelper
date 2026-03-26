import { state }                        from './state.js';
import { query }                        from './api.js';
import { fmt }                          from './formatter.js';
import { saveHistory, loadHistory, clearHistory } from './chatHistory.js';
import {
  renderUserMsg,
  renderAssistantMsg,
  renderSysMsg,
  showThinking,
  hideThinking,
  setSendBusy,
} from './Ui.js';

const SYSTEM_PROMPT = { role: "system", content: "You are a helpful Python assistant." };
const RAW_KEEP      = 4;  // how many recent messages to keep raw (uncompressed)
const SUMMARY_EVERY = 6;  // summarize when history exceeds this many messages

// ── Load history on startup ────────────────────────────────────────
state.messages = loadHistory();

// ── Summarize old messages via the API ────────────────────────────
async function summarizeOldMessages(messages) {
  try {
    const toSummarize = messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const res = await fetch('/api/query', {          // ← your actual endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: state.selectedModel,
        max_tokens: 300,                             // summary should be short
        messages: [
          {
            role: "system",
            content: "Summarize the following conversation concisely in 3-5 sentences. Focus on what was built, what changes were made, and any key decisions. Be brief."
          },
          {
            role: "user",
            content: toSummarize
          }
        ]
      })
    });

    const data = await res.json();
    return data.response || data.content || '';      // adjust to your API shape

  } catch (err) {
    console.warn('Summarization failed, skipping:', err.message);
    return null;
  }
}

// ── Trim + summarize history ───────────────────────────────────────
async function trimHistory() {
  const nonSystem = state.messages.filter(m => m.role !== 'system');

  // Not long enough to need summarizing yet
  if (nonSystem.length <= SUMMARY_EVERY) {
    state.messages = [SYSTEM_PROMPT, ...nonSystem.slice(-RAW_KEEP)];
    return;
  }

  // Split into old (to summarize) and recent (to keep raw)
  const oldMessages    = nonSystem.slice(0, -RAW_KEEP);
  const recentMessages = nonSystem.slice(-RAW_KEEP);

  const summary = await summarizeOldMessages(oldMessages);

  if (summary) {
    // Replace old messages with a single summary injection
    state.messages = [
      SYSTEM_PROMPT,
      {
        role: "system",
        content: `Summary of earlier conversation: ${summary}`
      },
      ...recentMessages
    ];
  } else {
    // Summarization failed — just trim aggressively
    state.messages = [SYSTEM_PROMPT, ...recentMessages];
  }

  saveHistory(state.messages);
}

// ── Main send function ─────────────────────────────────────────────
export async function sendMessage() {
  if (state.busy || !state.backendUp) return;

  const inp  = document.getElementById('msgInput');
  const text = inp.value.trim();

  if (!text && state.mode !== 'analyze') return;

  state.messages.push({
    role: "user",
    content: text || "Full Project Analysis"
  });

  renderUserMsg(text || '(Full Project Analysis)', [...state.attached]);
  inp.value      = '';
  inp.style.height = '';

  // ── Trim/summarize before sending ─────────────────────────────
  await trimHistory();

  state.busy             = true;
  state.requestStartTime = Date.now();
  setSendBusy(true);
  showThinking();

  try {
    const d = await query(state.mode, text, state.selectedModel, state.messages);

    hideThinking();

    const reply = fmt(d.response);

    state.messages.push({ role: "assistant", content: reply });
    saveHistory(state.messages);
    renderAssistantMsg(reply);

  } catch (err) {
    hideThinking();
    renderSysMsg('Error: ' + err.message, 'err');
  } finally {
    state.busy = false;
    setSendBusy(false);
  }
}

export function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

export function newChat() {
  state.messages = clearHistory();
}

document.addEventListener('click', function (e) {
  if (e.target.classList.contains('code-copy-btn')) {
    const btn     = e.target;
    const wrapper = btn.closest('.code-block-wrapper');
    const code    = wrapper.querySelector('pre.cb').innerText;

    navigator.clipboard.writeText(code);
    btn.textContent = 'COPIED ✓';
    btn.classList.add('copied');

    setTimeout(() => {
      btn.textContent = 'COPY';
      btn.classList.remove('copied');
    }, 1500);
  }
});
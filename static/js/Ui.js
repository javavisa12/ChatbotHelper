/* ── ui.js ───────────────────────────────────────────────────────────
 * Pure DOM helpers: status indicators, chat message renderers,
 * thinking animation, sidebar toggle, and misc utilities.
 * No fetch calls; no business logic.
 * ─────────────────────────────────────────────────────────────────── */

import { state } from './state.js';
import { MODES } from './config.js';

/* ── Connection / status indicators ─────────────────────────────── */

export function setConn(ok) {
  const pill = document.getElementById('connPill');
  const cp   = document.getElementById('pip-conn');
  const cv   = document.getElementById('val-conn');
  const txt  = document.getElementById('pill-txt');

  pill.className  = 'conn-pill ' + (ok ? 'ok' : 'err');
  cp.className    = 'pip '      + (ok ? 'on' : 'err');
  cv.textContent  = ok ? 'online' : 'offline';
  txt.textContent = ok ? 'Connected' : 'Disconnected';
}

export function setProj(name) {
  document.getElementById('pip-proj').className = 'pip on';
  document.getElementById('val-proj').textContent =
    name.split(/[/\\]/).pop() || name;
}

/* ── Mode switcher ───────────────────────────────────────────────── */

export function applyMode(m) {
  const cfg = MODES[m];

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-' + m).classList.add('active');

  document.getElementById('crumb-mode').textContent = cfg.title;
  document.getElementById('modeBadge').textContent  = cfg.badge;
  document.getElementById('ctxDesc').textContent    = cfg.desc;

  const strip = document.getElementById('attachStrip');
  const chips = document.getElementById('chipsRow');

  if (m === 'pyqa') {
    strip.classList.add('hidden-row');
    chips.classList.add('hidden-row');
  } else {
    strip.classList.remove('hidden-row');
    chips.classList.remove('hidden-row');
  }
}

/* ── Sidebar toggle ──────────────────────────────────────────────── */

export function toggleSidebar() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  document.querySelector('.shell').classList.toggle('collapsed', state.sidebarCollapsed);
}

/* ── Chat message renderers ──────────────────────────────────────── */

/** Append any raw HTML node to #chat. */
export function append(html) {
  const chat = document.getElementById('chat');
  const div  = document.createElement('div');
  div.innerHTML = html;
  chat.appendChild(div.firstElementChild);
  chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
}

export function removeEmpty() {
  const e = document.getElementById('emptyState');
  if (e) e.remove();
}

/** User bubble with optional attached-file chips. */
export function renderUserMsg(text, files = []) {
  removeEmpty();
  const chips = files.map(f => `<div class="fchip">${f.name}</div>`).join('');
  append(`
    <div class="msg">
      <div class="msg-left"><div class="msg-role you">You</div></div>
      <div class="msg-body">
        ${chips ? `<div class="file-chips">${chips}</div>` : ''}
        ${esc(text)}
      </div>
    </div>`);
}

/** Assistant bubble. */
export function renderAssistantMsg(html) {
  const elapsed = state.requestStartTime
    ? Math.round((Date.now() - state.requestStartTime) / 1000)
    : 0;
  append(`
    <div class="msg">
      <div class="msg-left">
        <div class="msg-role assist">PyAssist</div>
        <div class="msg-time">${elapsed}s</div>
      </div>
      <div class="msg-body">${html}</div>
    </div>`);
}

/** System / status message. */
export function renderSysMsg(text, type /* 'ok' | 'err' */) {
  append(`
    <div class="msg">
      <div class="msg-left"><div class="msg-role sys-${type}">System</div></div>
      <div class="msg-body" style="color:var(--text-dim)">${esc(text)}</div>
    </div>`);
}

/* ── Thinking animation ──────────────────────────────────────────── */

export function showThinking() {
  const chat = document.getElementById('chat');
  const el   = document.createElement('div');
  el.className = 'thinking-row';
  el.id        = 'thinkEl';
  el.innerHTML = `
    <div class="msg-left">
      <div class="thinking-dots"><span></span><span></span><span></span></div>
    </div>
    <div class="thinking-label">Processing</div>`;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

export function hideThinking() {
  const e = document.getElementById('thinkEl');
  if (e) e.remove();
}

/* ── Send-button busy state ──────────────────────────────────────── */

export function setSendBusy(busy) {
  const btn = document.getElementById('sendBtn');
  if (btn) btn.disabled = busy;
}

/* ── File chips ──────────────────────────────────────────────────── */

export function renderChips(attached, onRemove) {
  document.getElementById('chipsRow').innerHTML = attached
    .map((f, i) => `
      <div class="chip-item">
        <span>${f.name}</span>
        <button onclick="${onRemove}(${i})">✕</button>
      </div>`)
    .join('');
}

/* ── Textarea auto-resize ────────────────────────────────────────── */

export function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

/* ── Utility ─────────────────────────────────────────────────────── */

/** HTML-escape a string. */
export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Prefill the textarea (used by quick-action cards). */
export function fillPrompt(text) {
  const inp = document.getElementById('msgInput');
  inp.value = text;
  autoResize(inp);
  inp.focus();
}

/** Clear the chat area and restore the empty state placeholder. */
export function clearChat() {
  const chat = document.getElementById('chat');
  chat.innerHTML = `
    <div class="empty" id="emptyState">
      <div class="empty-heading">Analyse.<br><em>Debug.</em><br>Understand.</div>
      <div class="empty-sub">Attach files to begin.</div>
      <div class="empty-grid">
        <div class="empty-card" onclick="fillPrompt('Summarize what this project does and identify its main components.')">
          <div class="card-tag">Project</div>
          <div class="card-text">Summarize this project</div>
        </div>
        <div class="empty-card" onclick="fillPrompt('Find all potential bugs and edge cases in this code.')">
          <div class="card-tag">Debug</div>
          <div class="card-text">Find potential bugs</div>
        </div>
        <div class="empty-card" onclick="fillPrompt('Review the code quality and suggest specific improvements.')">
          <div class="card-tag">Review</div>
          <div class="card-text">Full code review</div>
        </div>
        <div class="empty-card" onclick="setMode('pyqa'); fillPrompt('Explain Python decorators with examples.')">
          <div class="card-tag">Python Q&amp;A</div>
          <div class="card-text">No files needed</div>
        </div>
      </div>
    </div>`;
}
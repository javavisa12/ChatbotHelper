/* ============================================================
   PYASSIST - COMPLETE UNIFIED JAVASCRIPT
   All modules combined: api, chat, files, formatter, health, state, Ui
   Integrated with: upload button, file attachments, collapsible sidebar
   ============================================================ */

// ======================== CONFIG ========================
const API = 'http://localhost:8504/api';

const MODES = {
  ask: {
    badge: 'Ask',
    title: 'Ask About Files',
    desc: 'Ask a question about your attached files',
    needsProject: true,
  },
  pyqa: {
    badge: 'Q&A',
    title: 'Python Q&A',
    desc: 'Ask any Python question — no files required',
    needsProject: false,
  },
  analyze: {
    badge: 'Analyze',
    title: 'Analyze Project',
    desc: 'Analyze project structure and dependencies',
    needsProject: true,
  },
  review: {
    badge: 'Review',
    title: 'Code Review',
    desc: 'Code review with best practices',
    needsProject: true,
  },
  refactor: {
    badge: 'Refactor',
    title: 'Refactor',
    desc: 'Suggest refactoring improvements',
    needsProject: true,
  },
};

// ======================== STATE ========================
const SYSTEM_PROMPT = { role: 'system', content: 'You are a helpful Python assistant.' };

const state = {
  mode: 'ask',
  busy: false,
  backendUp: false,
  attached: [],
  requestStartTime: null,
  sidebarCollapsed: false,
  messages: [{ ...SYSTEM_PROMPT }],
};

// ======================== UTILITIES ========================
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function autoResize(el) {
  if (el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }
}

// ======================== CHAT HISTORY (localStorage) ========================
const STORAGE_KEY = 'chatHistory';
const TAIL_SIZE = 4;

function saveHistory(messages) {
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

function loadHistory() {
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

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  return [{ ...SYSTEM_PROMPT }];
}

// ======================== API CALLS ========================
async function fetchStatus() {
  const r = await fetch(`${API}/status`, {
    signal: AbortSignal.timeout(2500),
    credentials: 'include'
  });
  return r.json();
}

async function loadProject(path) {
  const r = await fetch(`${API}/load_project`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ path }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Load project failed');
  return d;
}

async function loadFiles(files) {
  const r = await fetch(`${API}/load_files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ files }),
  });
  return r.json();
}

async function query(mode, text, messages) {
  const endpoint = mode === 'pyqa' ? 'pyqa' : 'ask';
  const body = {
    question: text,
    messages: messages
  };

  const r = await fetch(`${API}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Server error');
  return d;
}

// ======================== FORMATTER (code blocks) ========================
let codeCounter = 0;

function fmt(text) {
  text = String(text);

  // Fenced code blocks ```lang\ncode```
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, lang, code) => {
    const id = `code-block-${codeCounter++}`;
    const ext = lang || 'py';
    const escaped = esc(code.trim());

    return `
      <div class="code-block-wrapper">
        <div class="code-header">
          <span class="code-lang">${ext}</span>
          <button class="code-download-btn" onclick="window.downloadCode('${id}', '${ext}')" title="Download">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3v12"/>
              <path d="M7 10l5 5 5-5"/>
              <path d="M5 21h14"/>
            </svg>
          </button>
          <button class="code-copy-btn" title="Copy">COPY</button>
        </div>
        <pre class="cb" id="${id}">${escaped}</pre>
      </div>`;
  });

  // Inline backticks
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  return text;
}

function downloadCode(elementId, extension) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const blob = new Blob([el.textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pyassist_export_${Date.now()}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ======================== UI RENDERERS ========================
function setConn(ok) {
  const connPill = document.getElementById('connPill');
  const pipConn = document.getElementById('pip-conn');
  const valConn = document.getElementById('val-conn');
  const pillTxt = document.getElementById('pill-txt');
  
  if (connPill) connPill.className = 'conn-pill ' + (ok ? 'ok' : 'err');
  if (pipConn) pipConn.className = 'pip ' + (ok ? 'on' : 'err');
  if (valConn) valConn.textContent = ok ? 'online' : 'offline';
  if (pillTxt) pillTxt.textContent = ok ? 'Connected' : 'Disconnected';
}

function setProj(name) {
  const pipProj = document.getElementById('pip-proj');
  const valProj = document.getElementById('val-proj');
  if (pipProj) pipProj.className = 'pip on';
  if (valProj) valProj.textContent = name.split(/[/\\]/).pop() || name;
}

function applyMode(m) {
  const cfg = MODES[m];
  if (!cfg) return;
  
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('btn-' + m);
  if (activeBtn) activeBtn.classList.add('active');
  
  const crumbMode = document.getElementById('crumb-mode');
  const modeBadge = document.getElementById('modeBadge');
  const ctxDesc = document.getElementById('ctxDesc');
  
  if (crumbMode) crumbMode.textContent = cfg.title;
  if (modeBadge) modeBadge.textContent = cfg.badge;
  if (ctxDesc) ctxDesc.textContent = cfg.desc;

  const strip = document.getElementById('attachStrip');
  const chips = document.getElementById('chipsRow');
  if (m === 'pyqa') {
    if (strip) strip.classList.add('hidden-row');
    if (chips) chips.classList.add('hidden-row');
  } else {
    if (strip) strip.classList.remove('hidden-row');
    if (chips) chips.classList.remove('hidden-row');
  }
}

function append(html) {
  const chat = document.getElementById('chat');
  if (!chat) return;
  const div = document.createElement('div');
  div.innerHTML = html;
  const firstChild = div.firstElementChild;
  if (firstChild) chat.appendChild(firstChild);
  chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
}

function removeEmpty() {
  const emptyState = document.getElementById('emptyState');
  if (emptyState) emptyState.remove();
}

function renderUserMsg(text, files = []) {
  removeEmpty();
  const chips = files.map(f => `<div class="fchip">${esc(f.name)}</div>`).join('');
  append(`
    <div class="msg">
      <div class="msg-left">
        <div class="msg-role you">You</div>
        <div class="msg-time">${nowTime()}</div>
      </div>
      <div class="msg-body">
        ${chips ? `<div class="file-chips">${chips}</div>` : ''}
        ${esc(text)}
      </div>
    </div>`);
}

function renderAssistantMsg(html) {
  const elapsed = state.requestStartTime ? Math.round((Date.now() - state.requestStartTime) / 1000) : 0;
  append(`
    <div class="msg">
      <div class="msg-left">
        <div class="msg-role assist">PyAssist</div>
        <div class="msg-time">${nowTime()} · ${elapsed}s</div>
      </div>
      <div class="msg-body">${html}</div>
    </div>`);
}

function renderSysMsg(text, type) {
  append(`
    <div class="msg">
      <div class="msg-left">
        <div class="msg-role sys-${type}">System</div>
        <div class="msg-time">${nowTime()}</div>
      </div>
      <div class="msg-body" style="color:var(--text-dim)">${esc(text)}</div>
    </div>`);
}

function showThinking() {
  const chat = document.getElementById('chat');
  if (!chat) return;
  const el = document.createElement('div');
  el.className = 'thinking-row';
  el.id = 'thinkEl';
  el.innerHTML = `
    <div class="msg-left">
      <div class="thinking-dots"><span></span><span></span><span></span></div>
    </div>
    <div class="thinking-label">Processing</div>`;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

function hideThinking() {
  const thinkEl = document.getElementById('thinkEl');
  if (thinkEl) thinkEl.remove();
}

function setSendBusy(busy) {
  const btn = document.getElementById('sendBtn');
  if (btn) btn.disabled = busy;
}

function fillPrompt(text) {
  const inp = document.getElementById('msgInput');
  if (inp) {
    inp.value = text;
    autoResize(inp);
    inp.focus();
  }
}

// ======================== SIDEBAR TOGGLE ========================
function toggleSidebar() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  const shell = document.querySelector('.shell');
  if (shell) shell.classList.toggle('collapsed', state.sidebarCollapsed);
  localStorage.setItem('pyassist_sidebar_collapsed', state.sidebarCollapsed);
}

function initSidebarToggle() {
  const savedCollapsed = localStorage.getItem('pyassist_sidebar_collapsed') === 'true';
  if (savedCollapsed) {
    const shell = document.querySelector('.shell');
    if (shell) shell.classList.add('collapsed');
    state.sidebarCollapsed = true;
  }
  
  const topbarToggle = document.getElementById('topbarToggleBtn');
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  
  if (topbarToggle) topbarToggle.addEventListener('click', toggleSidebar);
  if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
}

// ======================== FILE HANDLING ========================
function renderFileChips() {
  const chipsRow = document.getElementById('chipsRow');
  if (!chipsRow) return;
  
  chipsRow.innerHTML = state.attached
    .map((f, i) => `
      <div class="chip-item">
        <span>${esc(f.name)}</span>
        <button onclick="window._removeFile(${i})">✕</button>
      </div>`)
    .join('');
}

function renderAttachmentsArea() {
  const container = document.getElementById('attachmentsArea');
  if (!container) return;
  
  container.innerHTML = '';
  state.attached.forEach((file, idx) => {
    const chip = document.createElement('div');
    chip.className = 'file-chip';
    chip.innerHTML = `
      📄 ${file.name.length > 30 ? file.name.slice(0, 27) + '...' : file.name}
      <button class="remove-attach" data-idx="${idx}" title="Remove">✕</button>
    `;
    container.appendChild(chip);
  });
  
  document.querySelectorAll('.remove-attach').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      await removeFile(idx);
    });
  });
}

async function syncFiles() {
  if (!state.backendUp || !state.attached.length) return;
  await loadFiles(state.attached);
  setProj(state.attached.length + ' file(s)');
}

async function handleFiles(e) {
  const toRead = Array.from(e.target.files).filter(
    f => !state.attached.find(a => a.name === f.name)
  );
  if (!toRead.length) return;

  let done = 0;
  for (const file of toRead) {
    const content = await file.text();
    state.attached.push({ name: file.name, content: content });
    done++;
  }
  
  if (done === toRead.length) {
    renderFileChips();
    renderAttachmentsArea();
    resetSession();
    await syncFiles();
    renderSysMsg(`${toRead.length} file(s) attached — session reset.`, 'ok');
  }
  e.target.value = '';
}

async function attachFolder() {
  const path = prompt('Enter full local path to project folder:');
  if (!path) return;
  try {
    const d = await loadProject(path);
    setProj(path);
    resetSession();
    renderSysMsg(`Project loaded: ${d.files.length} files — session reset.`, 'ok');
  } catch (err) {
    renderSysMsg('Folder load failed: ' + err.message, 'err');
  }
}

async function removeFile(index) {
  state.attached.splice(index, 1);
  renderFileChips();
  renderAttachmentsArea();
  await syncFiles();
}

// Upload button handler
function setupFileUpload() {
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput');
  
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => fileInput.click());
  }
}

// ======================== CHAT FUNCTIONS ========================
const RAW_KEEP = 4;
const SUMMARY_EVERY = 6;

function trimHistory() {
  const nonSystem = state.messages.filter(m => m.role !== 'system');
  if (nonSystem.length > SUMMARY_EVERY) {
    state.messages = [{ ...SYSTEM_PROMPT }, ...nonSystem.slice(-RAW_KEEP)];
  }
}

function resetSession() {
  state.messages = clearHistory();
}

async function sendMessage() {
  if (state.busy || !state.backendUp) return;

  const inp = document.getElementById('msgInput');
  const text = inp ? inp.value.trim() : '';
  if (!text && state.mode !== 'analyze' && state.attached.length === 0) return;

  // Build message with file contents if any
  let userContent = text || 'Full Project Analysis';
  if (state.attached.length > 0 && text) {
    userContent = text + '\n\n📎 Attached files:\n' + state.attached.map(f => `--- ${f.name} ---\n${f.content.substring(0, 2000)}`).join('\n\n');
  } else if (state.attached.length > 0 && !text) {
    userContent = '📎 Please analyze these files:\n\n' + state.attached.map(f => `--- ${f.name} ---\n${f.content.substring(0, 2000)}`).join('\n\n');
  }
  
  state.messages.push({ role: 'user', content: userContent });

  renderUserMsg(text || '(Full Project Analysis)', [...state.attached]);
  if (inp) {
    inp.value = '';
    inp.style.height = '';
  }

  trimHistory();

  state.busy = true;
  state.requestStartTime = Date.now();
  setSendBusy(true);
  showThinking();

  try {
    const d = await query(state.mode, text, state.messages);
    hideThinking();

    const reply = fmt(d.response);
    state.messages.push({ role: 'assistant', content: reply });
    saveHistory(state.messages);
    renderAssistantMsg(reply);
    
    // Clear attachments after successful send
    state.attached = [];
    renderFileChips();
    renderAttachmentsArea();

  } catch (err) {
    hideThinking();
    renderSysMsg('Error: ' + err.message, 'err');
  } finally {
    state.busy = false;
    setSendBusy(false);
  }
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ======================== CLEAR CHAT ========================
const EMPTY_HTML = `
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

function clearChat() {
  const chat = document.getElementById('chat');
  if (chat) chat.innerHTML = EMPTY_HTML;
  resetSession();
  state.attached = [];
  renderFileChips();
  renderAttachmentsArea();
}

// ======================== HEALTH POLLING ========================
async function ping() {
  try {
    const d = await fetchStatus();
    state.backendUp = true;
    setConn(true);

    const llmEl = document.getElementById('val-llm');
    const poolEl = document.getElementById('val-pool');
    const pipLlm = document.getElementById('pip-llm');
    const pipPool = document.getElementById('pip-pool');

    if (llmEl && d.llm_loader) {
      llmEl.textContent = d.llm_loader;
      if (pipLlm) pipLlm.className = d.llm_loader === 'ok' ? 'pip on' : 'pip err';
    }
    if (poolEl && d.pool_idle !== undefined) {
      poolEl.textContent = `${d.pool_idle}/${d.pool_total}`;
      if (pipPool) pipPool.className = d.pool_idle > 0 ? 'pip on' : 'pip dim';
    }

    if (d.project_loaded) setProj(d.project_path || 'loaded');
  } catch {
    state.backendUp = false;
    setConn(false);
  }
}

function startHealthPoll() {
  ping();
  setInterval(ping, 5000);
}

// ======================== MODE SETTER ========================
function setMode(m) {
  state.mode = m;
  applyMode(m);
}

// ======================== CODE COPY HANDLER ========================
function setupCodeCopy() {
  document.addEventListener('click', function (e) {
    if (e.target.classList && e.target.classList.contains('code-copy-btn')) {
      const btn = e.target;
      const wrapper = btn.closest('.code-block-wrapper');
      const pre = wrapper ? wrapper.querySelector('pre.cb') : null;
      const code = pre ? pre.innerText : '';
      if (!code) return;

      navigator.clipboard.writeText(code);
      btn.textContent = '✓';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'COPY';
        btn.classList.remove('copied');
      }, 1500);
    }
  });
}

// ======================== THEME TOGGLE (optional) ========================
function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem('theme', newTheme);
}

// ======================== INITIALIZATION ========================
function init() {
  // Load saved messages
  state.messages = loadHistory();
  
  // Start health polling
  startHealthPoll();
  
  // Initialize sidebar toggle
  initSidebarToggle();
  
  // Setup file upload
  setupFileUpload();
  
  // Setup code copy handler
  setupCodeCopy();
  
  // Restore saved theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
  
  // Theme toggle button
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  
  // Set initial mode
  applyMode(state.mode);
  
  // Create attachments area if it doesn't exist
  const inputArea = document.querySelector('.input-area');
  if (inputArea && !document.getElementById('attachmentsArea')) {
    const attachmentsDiv = document.createElement('div');
    attachmentsDiv.id = 'attachmentsArea';
    attachmentsDiv.className = 'attachments-area';
    const attachStrip = document.getElementById('attachStrip');
    if (attachStrip) {
      inputArea.insertBefore(attachmentsDiv, attachStrip);
    } else {
      inputArea.insertBefore(attachmentsDiv, inputArea.firstChild);
    }
  }
  
  // Render empty state if no messages
  if (state.messages.length === 1 && state.messages[0].role === 'system') {
    const chat = document.getElementById('chat');
    if (chat && chat.children.length === 0) {
      chat.innerHTML = EMPTY_HTML;
    }
  }
}

// ======================== EXPOSE GLOBALS ========================
window.setMode = setMode;
window.toggleSidebar = toggleSidebar;
window.clearChat = clearChat;
window.fillPrompt = fillPrompt;
window.handleFiles = handleFiles;
window.attachFolder = attachFolder;
window.sendMessage = sendMessage;
window.handleKey = handleKey;
window.autoResize = autoResize;
window.downloadCode = downloadCode;
window._removeFile = removeFile;

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
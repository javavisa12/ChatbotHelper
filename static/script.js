/* ── Config ─────────────────────────────────────────────────────── */
const API = 'http://localhost:5000/api';

const MODES = {
  ask:      { badge:'Ask',      title:'Ask Question',    desc:'Ask a question about your loaded project or attached files', needsProject: true  },
  analyze:  { badge:'Analyze',  title:'Analyze Project', desc:'Comprehensive breakdown: summary, bugs, quality, improvements', needsProject: true  },
  debug:    { badge:'Debug',    title:'Debug & Run',     desc:'Run a file and auto-debug errors, or describe an issue', needsProject: true  },
  review:   { badge:'Review',   title:'Code Review',     desc:'Structured review of readability, structure, and correctness', needsProject: true  },
  refactor: { badge:'Refactor', title:'Refactor',        desc:'Concrete refactoring with before/after code examples', needsProject: true  },
  pyqa:     { badge:'Python Q&A', title:'Python Q&A',   desc:'Ask any Python question — no project or files required', needsProject: false },
};

/* ── State ──────────────────────────────────────────────────────── */
let mode       = 'ask';
let busy       = false;
let backendUp  = false;
let attached   = []; // {name, content}

/* ── Backend health ─────────────────────────────────────────────── */
async function ping() {
  try {
    const r = await fetch(`${API}/status`, { signal: AbortSignal.timeout(2500) });
    const d = await r.json();
    backendUp = true;
    setConn(true);
    document.getElementById('val-model').textContent = d.model || '—';
    if (d.project_loaded) setProj(d.project_path || 'loaded');
  } catch {
    backendUp = false;
    setConn(false);
  }
}

function setConn(ok) {
  const pill = document.getElementById('connPill');
  const pip  = document.getElementById('pill-pip');
  const txt  = document.getElementById('pill-txt');
  const cp   = document.getElementById('pip-conn');
  const cv   = document.getElementById('val-conn');

  pill.className = 'conn-pill ' + (ok ? 'ok' : 'err');
  pip.className  = 'pip ' + (ok ? 'on' : 'err');
  txt.textContent = ok ? 'Connected' : 'Disconnected';
  cp.className   = 'pip ' + (ok ? 'on' : 'err');
  cv.textContent = ok ? 'online' : 'offline';
}

function setProj(name) {
  document.getElementById('pip-proj').className = 'pip on';
  document.getElementById('val-proj').textContent = name.split(/[/\\]/).pop() || name;
}

ping();
setInterval(ping, 5000);

/* ── Mode ───────────────────────────────────────────────────────── */
function setMode(m) {
  mode = m;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-' + m).classList.add('active');

  const cfg = MODES[m];
  document.getElementById('crumb-mode').textContent = cfg.title;
  document.getElementById('modeBadge').textContent  = cfg.badge;
  document.getElementById('ctxDesc').textContent    = cfg.desc;

  document.getElementById('runRow').style.display     = m === 'debug' ? 'flex' : 'none';
  document.getElementById('attachStrip').style.display = m === 'pyqa' ? 'none' : 'flex';
  document.getElementById('chipsRow').style.display   = m === 'pyqa' ? 'none' : 'flex';

  document.getElementById('msgInput').placeholder =
    m === 'debug'   ? 'Paste a traceback or describe the runtime error…' :
    m === 'analyze' ? 'Press Send to analyze — or specify a focus area…' :
    m === 'pyqa'    ? 'Ask any Python question…' :
    'Enter your query…';
}

/* ── Load folder via backend ────────────────────────────────────── */
async function loadFolder() {
  if (!backendUp) { sys('Backend is offline. Start server.py first.', 'err'); return; }
  const path = document.getElementById('folderPath').value.trim();
  if (!path) { sys('Enter a folder path.', 'warn'); return; }

  const btn = document.getElementById('loadFolderBtn');
  btn.disabled = true; btn.textContent = 'Loading…';

  try {
    const r = await fetch(`${API}/load_project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    const d = await r.json();
    if (!r.ok) { sys('Error: ' + d.error, 'err'); return; }
    setProj(path);
    sys(d.message + '\n\n' + d.files.join('\n'), 'ok');
  } catch (e) {
    sys('Request failed: ' + e.message, 'err');
  } finally {
    btn.disabled = false; btn.textContent = 'Load Folder';
  }
}

/* ── File attach ────────────────────────────────────────────────── */
function handleFiles(e) {
  const toRead = Array.from(e.target.files).filter(f => !attached.find(a => a.name === f.name));
  let done = 0;
  if (!toRead.length) return;
  toRead.forEach(file => {
    const r = new FileReader();
    r.onload = async () => {
      attached.push({ name: file.name, content: r.result });
      done++;
      if (done === toRead.length) {
        renderChips();
        await syncFiles();
      }
    };
    r.readAsText(file);
  });
  e.target.value = '';
}

async function syncFiles() {
  if (!backendUp || !attached.length) return;
  await fetch(`${API}/load_files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: attached })
  });
  setProj(attached.length + ' file(s)');
}

function renderChips() {
  document.getElementById('chipsRow').innerHTML = attached.map((f, i) => `
    <div class="chip-item">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
      ${f.name}
      <button onclick="removeFile(${i})">✕</button>
    </div>`).join('');
}

async function removeFile(i) {
  attached.splice(i, 1);
  renderChips();
  await syncFiles();
  if (!attached.length) {
    document.getElementById('pip-proj').className = 'pip';
    document.getElementById('val-proj').textContent = 'none';
  }
}

/* ── Run file ───────────────────────────────────────────────────── */
async function runFile() {
  if (!backendUp) { sys('Backend offline.', 'err'); return; }
  const f = document.getElementById('runFile').value.trim();
  if (!f) { sys('Specify a filename to execute.', 'warn'); return; }

  user('Execute: ' + f, []);
  setBusy(true);

  try {
    const r = await fetch(`${API}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ main_file: f })
    });
    const d = await r.json();
    unbusy();
    if (!r.ok) { sys('Error: ' + d.error, 'err'); setBusy(false); return; }

    let html = '';
    if (d.stdout) html += `<div class="stdout-b">${esc(d.stdout)}</div>`;
    if (d.stderr) html += `<div class="stderr-b">${esc(d.stderr)}</div>`;
    if (d.analysis) html += '<br>' + fmt(d.analysis);
    if (!d.stdout && !d.stderr) html = '<span style="color:#27ae60">Process exited cleanly with no output.</span>';

    assistant(html);
  } catch (e) {
    unbusy();
    sys('Request failed: ' + e.message, 'err');
  }
  setBusy(false);
}

/* ── Send ───────────────────────────────────────────────────────── */
async function sendMessage() {
  if (busy) return;
  if (!backendUp) { sys('Backend offline. Run: python server.py', 'err'); return; }

  const inp  = document.getElementById('msgInput');
  const text = inp.value.trim();
  if (!text && mode !== 'analyze') return;

  const snap = mode === 'pyqa' ? [] : [...attached];
  inp.value = ''; inp.style.height = '';
  user(text || '(full project analysis)', snap);
  setBusy(true);

  try {
    let endpoint, body;

    if (mode === 'pyqa') {
      endpoint = 'python_qa';
      body = { question: text };
    } else if (mode === 'analyze') {
      endpoint = 'analyze';
      body = {};
    } else if (mode === 'refactor') {
      endpoint = 'refactor';
      body = { focus: text };
    } else if (mode === 'review') {
      endpoint = 'review';
      body = {};
    } else {
      endpoint = 'ask';
      body = { question: text };
    }

    const r = await fetch(`${API}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const d = await r.json();
    unbusy(); setBusy(false);
    if (!r.ok) { sys('Error: ' + d.error, 'err'); return; }
    assistant(fmt(d.response));
  } catch (e) {
    unbusy(); setBusy(false);
    sys('Request failed: ' + e.message, 'err');
  }
}

/* ── Render ─────────────────────────────────────────────────────── */
function ts() { return new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }); }

function removeEmpty() { const e = document.getElementById('emptyState'); if (e) e.remove(); }

function user(text, files) {
  removeEmpty();
  const chips = files.map(f => `<div class="fchip"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>${f.name}</div>`).join('');
  append(`
    <div class="msg">
      <div class="msg-left">
        <div class="msg-role you">You</div>
        <div class="msg-time">${ts()}</div>
      </div>
      <div class="msg-body">
        ${chips ? `<div class="file-chips">${chips}</div>` : ''}
        ${esc(text)}
      </div>
    </div>`);
}

function assistant(html) {
  removeEmpty();
  // create elements so we can animate typing
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="msg">
      <div class="msg-left">
        <div class="msg-role assist">PyAssist</div>
        <div class="msg-time">${ts()}</div>
      </div>
      <div class="msg-body">${html}</div>
    </div>`;
  const msgElement = wrapper.firstElementChild;
  append(msgElement.outerHTML); // append placeholder immediately

  // get the newly appended message body and type it
  const lastMsg = document.getElementById('chat').lastElementChild;
  const body = lastMsg.querySelector('.msg-body');
  typeEffect(body);
}

// gradually reveal text nodes character-by-character
function typeEffect(container) {
  // wrap every character of text nodes in spans set to opacity 0
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(node => {
    const chars = node.textContent.split('');
    const frag = document.createDocumentFragment();
    chars.forEach(ch => {
      const span = document.createElement('span');
      span.textContent = ch;
      span.style.opacity = 0;
      frag.appendChild(span);
    });
    node.parentNode.replaceChild(frag, node);
  });

  const spans = container.querySelectorAll('span');
  let idx = 0;
  function reveal() {
    if (idx < spans.length) {
      spans[idx].style.transition = 'opacity 0.05s';
      spans[idx].style.opacity = 1;
      idx++;
      setTimeout(reveal, 10);
    }
  }
  reveal();
}

function sys(text, type = 'ok') {
  removeEmpty();
  const cls = { ok:'sys-ok', err:'sys-err', warn:'sys-warn' }[type] || 'sys-ok';
  append(`
    <div class="msg">
      <div class="msg-left">
        <div class="msg-role ${cls}">System</div>
        <div class="msg-time">${ts()}</div>
      </div>
      <div class="msg-body" style="color:var(--text-dim)">${esc(text)}</div>
    </div>`);
}

function append(html) {
  const chat = document.getElementById('chat');
  const div = document.createElement('div');
  div.innerHTML = html;
  chat.appendChild(div.firstElementChild);
  chat.scrollTop = chat.scrollHeight;
}

function setBusy(v) {
  busy = v;
  document.getElementById('sendBtn').disabled = v;
  if (v) {
    const chat = document.getElementById('chat');
    const el = document.createElement('div');
    el.className = 'thinking-row'; el.id = 'thinkEl';
    el.innerHTML = `
      <div class="msg-left">
        <div class="thinking-dots"><span></span><span></span><span></span></div>
      </div>
      <div class="thinking-label">Processing</div>`;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
  }
}
function unbusy() { const e = document.getElementById('thinkEl'); if (e) e.remove(); }

/* ── Formatting ─────────────────────────────────────────────────── */
function fmt(text) {
  text = String(text);
  text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, c) =>
    `<pre class="cb">${esc(c.trim())}</pre>`);
  text = text.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  return text;
}
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── Utilities ──────────────────────────────────────────────────── */
function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}
function fillPrompt(t) {
  const i = document.getElementById('msgInput');
  i.value = t; i.focus(); autoResize(i);
}

function clearChat() {
  document.getElementById('chat').innerHTML = `
    <div class="empty" id="emptyState">
      <div class="empty-heading">Analyse.<br><em>Debug.</em><br>Understand.</div>
      <div class="empty-sub">Load a project folder or attach files to begin.</div>
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
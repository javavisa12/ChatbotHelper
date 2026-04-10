/* ============================================================
   PyAssist — app.js
   Modes: Python Q&A (pyqa) | Code Review (review)
   ============================================================ */

// ======================== CONFIG ========================
const API = 'http://localhost:8504/api';

const MODES = {
    pyqa: {
        badge:       'Python Q&A',
        icon:        '💬',
        desc:        'Ask any Python question',
        placeholder: 'Ask a Python question...',
    },
    review: {
        badge:       'Code Review',
        icon:        '🔍',
        desc:        'Paste or attach code for review',
        placeholder: 'Paste your Python code here for review...',
    },
};

// ======================== STATE ========================
const state = {
    mode:              'pyqa',
    busy:              false,
    backendUp:         false,
    attached:          [],
    sessions:          new Map(),
    currentSessionId:  null,
    messages:          [],
    sidebarCollapsed:  false,
};

// Global storage for code blocks (for copy/download)
window.codeBlocks = {};

// ======================== UTILITIES ========================
function esc(s) {
    return String(s)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;');
}

function nowTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function autoResizeTextarea(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 130) + 'px';
}

// ======================== MODE ========================
function setMode(modeKey) {
    if (!MODES[modeKey]) return;
    state.mode = modeKey;

    // Toggle active class on header buttons
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('mode-btn-' + modeKey);
    if (activeBtn) activeBtn.classList.add('active');

    // Update mode banner
    const cfg = MODES[modeKey];
    const bannerIcon  = document.getElementById('mode-banner-icon');
    const bannerLabel = document.getElementById('mode-banner-label');
    const bannerDesc  = document.getElementById('mode-banner-desc');
    if (bannerIcon)  bannerIcon.textContent  = cfg.icon;
    if (bannerLabel) bannerLabel.textContent = cfg.badge;
    if (bannerDesc)  bannerDesc.textContent  = '— ' + cfg.desc;

    // Update textarea placeholder
    const inp = document.getElementById('chat-input');
    if (inp) inp.placeholder = cfg.placeholder;

    localStorage.setItem('pyassist_mode', modeKey);
}

// ======================== SIDEBAR ========================
function toggleSidebar() {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
    localStorage.setItem('pyassist_sidebar_collapsed', state.sidebarCollapsed);
}

function initSidebar() {
    if (localStorage.getItem('pyassist_sidebar_collapsed') === 'true') {
        state.sidebarCollapsed = true;
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('collapsed');
    }
}

function renderSessionList() {
    const list = document.getElementById('session-list');
    if (!list) return;

    if (state.sessions.size === 0) {
        list.innerHTML = '<div class="sidebar-empty">No past sessions</div>';
        return;
    }

    let html = '';
    for (const [id, sess] of state.sessions) {
        const isActive   = id === state.currentSessionId;
        const label      = sess.name.length > 28 ? sess.name.slice(0, 25) + '…' : sess.name;
        const modeTag    = MODES[sess.mode] ? `<span style="font-size:11px;opacity:.6">${MODES[sess.mode].icon}</span> ` : '';
        
        html += `
            <div class="session-item${isActive ? ' active' : ''}" onclick="switchSession('${id}')">
                <div class="session-item-title">${modeTag}${label}</div>
                <button class="delete-session-btn" onclick="deleteSession(event, '${id}')" title="Delete chat" aria-label="Delete chat">✕</button>
            </div>`;
    }
    list.innerHTML = html;
}

function deleteSession(event, sessionId) {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat session?')) return;

    state.sessions.delete(sessionId);
    persistSessions();

    if (state.sessions.size === 0) {
        newChat();
    } else if (state.currentSessionId === sessionId) {
        const firstId = Array.from(state.sessions.keys())[0];
        switchSession(firstId);
    } else {
        renderSessionList();
    }
}

function newChat() {
    const id   = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    const name = `Chat ${nowTime()}`;

    state.sessions.set(id, { name, mode: state.mode, messages: [] });
    state.currentSessionId = id;
    state.messages         = [];
    state.attached         = [];

    persistSessions();
    renderSessionList();
    renderMessages();
    renderAttachments();
}

function switchSession(sessionId) {
    if (!state.sessions.has(sessionId)) return;

    const sess              = state.sessions.get(sessionId);
    state.currentSessionId  = sessionId;
    state.messages          = [...(sess.messages || [])];
    state.attached          = [];

    if (sess.mode && MODES[sess.mode]) setMode(sess.mode);

    renderSessionList();
    renderMessages();
    renderAttachments();
}

function persistSessions() {
    const data = Array.from(state.sessions.entries()).map(([id, s]) => ({
        id, name: s.name, mode: s.mode, messages: s.messages,
    }));
    localStorage.setItem('pyassist_sessions', JSON.stringify(data));
}

function loadSessions() {
    try {
        const raw = localStorage.getItem('pyassist_sessions');
        if (!raw) return;
        const data = JSON.parse(raw);
        state.sessions.clear();
        for (const item of data) {
          // Exclude empty chats from piling up
          if (item.messages && item.messages.length > 0) {
            state.sessions.set(item.id, {
                name:     item.name,
                mode:     item.mode || 'pyqa',
                messages: item.messages || [],
            });
          }
        }
    } catch (err) {
        console.warn('Failed to load sessions:', err);
    }
}

// ======================== MESSAGES ========================
function renderMessages() {
    const container = document.getElementById('messages');
    if (!container) return;

    if (state.messages.length === 0) {
        container.innerHTML = `
            <div class="message assistant">
                <div class="avatar">PyAI</div>
                <div class="bubble-wrapper">
                    <div class="bubble">Hello! I'm PyAssist. Switch between <strong>Python Q&amp;A</strong> for language questions and <strong>Code Review</strong> to get feedback on your code.</div>
                </div>
            </div>`;
        return;
    }

    let html = '';
    for (const msg of state.messages) {
        const isUser  = msg.role === 'user';
        const cls     = isUser ? 'message user' : 'message assistant';
        const avatar  = isUser ? 'You' : 'PyAI';
        const content = formatBubble(msg.content, isUser);

        // Format Timestamp & Response time
        const timeStr = msg.timestamp || '';
        let metaHtml = '';
        
        if (isUser) {
            if (timeStr) metaHtml = `<div class="msg-footer">Sent ${timeStr}</div>`;
        } else {
            const respTimeStr = msg.responseTime ? `${msg.responseTime}s` : '';
            const timeDisplay = [timeStr, respTimeStr].filter(Boolean).join(' • ');
            
            metaHtml = `<div class="msg-footer">
                ${timeDisplay ? `<span>${timeDisplay}</span>` : ''}
                <button class="copy-btn" onclick="copyBubble(this)">Copy</button>
            </div>`;
        }

        html += `
            <div class="${cls}">
                <div class="avatar">${avatar}</div>
                <div class="bubble-wrapper">
                    <div class="bubble">${content}</div>
                    ${metaHtml}
                </div>
            </div>`;
    }

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

/**
 * Enhanced formatter: wrap ```...``` blocks with copy/download buttons
 */
function formatBubble(text, isUser) {
    if (isUser) return esc(text);

    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map(part => {
        if (part.startsWith('```')) {
            const lines = part.split('\n');
            const firstLine = lines[0];
            const language = firstLine.replace('```', '').trim() || 'text';
            
            lines.shift();
            lines.pop();
            const code = lines.join('\n');
            
            const blockId = 'code_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            window.codeBlocks[blockId] = { code, language };
            
            return `
                <div class="code-block-wrapper">
                    <div class="code-block-header">
                        <span class="code-language">${esc(language)}</span>
                        <div class="code-block-actions">
                            <button class="code-btn copy-code-btn" onclick="copyCodeBlock('${blockId}')" title="Copy code">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                <span>Copy</span>
                            </button>
                            <button class="code-btn download-code-btn" onclick="downloadCodeBlock('${blockId}')" title="Download code">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                <span>Download</span>
                            </button>
                        </div>
                    </div>
                    <pre><code class="language-${esc(language)}">${esc(code)}</code></pre>
                </div>
            `;
        }
        return esc(part).replace(/`([^`]+)`/g, '<code>$1</code>');
    }).join('');
}

function copyCodeBlock(blockId) {
    const block = window.codeBlocks && window.codeBlocks[blockId];
    if (!block) return;
    
    navigator.clipboard.writeText(block.code).then(() => {
        const btn = document.querySelector(`[onclick="copyCodeBlock('${blockId}')"]`);
        if (btn) {
            const span = btn.querySelector('span');
            const originalText = span.textContent;
            span.textContent = 'Copied!';
            setTimeout(() => {
                span.textContent = originalText;
            }, 1500);
        }
    }).catch(err => console.error('Failed to copy:', err));
}

function downloadCodeBlock(blockId) {
    const block = window.codeBlocks && window.codeBlocks[blockId];
    if (!block) return;
    
    const extMap = {
        'python': '.py', 'py': '.py',
        'javascript': '.js', 'js': '.js',
        'typescript': '.ts', 'ts': '.ts',
        'html': '.html', 'css': '.css',
        'json': '.json', 'yaml': '.yml', 'yml': '.yml',
        'markdown': '.md', 'md': '.md',
        'sql': '.sql', 'shell': '.sh', 'bash': '.sh', 'sh': '.sh',
        'text': '.txt', 'txt': '.txt'
    };
    
    const ext = extMap[block.language.toLowerCase()] || '.txt';
    const filename = `code_snippet${ext}`;
    
    const blob = new Blob([block.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    const btn = document.querySelector(`[onclick="downloadCodeBlock('${blockId}')"]`);
    if (btn) {
        const span = btn.querySelector('span');
        const originalText = span.textContent;
        span.textContent = 'Downloaded!';
        setTimeout(() => { span.textContent = originalText; }, 1500);
    }
}

function appendThinkingBubble() {
    const container = document.getElementById('messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'message assistant';
    div.id = 'thinking-msg';
    div.innerHTML = `
        <div class="avatar">PyAI</div>
        <div class="bubble-wrapper">
            <div class="bubble"><span class="status-indicator active">Thinking<span class="cursor"></span></span></div>
        </div>`;
    container.appendChild(div);
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
}

function removeThinkingBubble() {
    const el = document.getElementById('thinking-msg');
    if (el) el.remove();
}

function copyBubble(btn) {
    const wrapper = btn.closest('.bubble-wrapper');
    const bubble = wrapper.querySelector('.bubble');
    if (!bubble) return;
    
    const clone = bubble.cloneNode(true);
    clone.querySelectorAll('.code-block-header, .code-btn').forEach(el => el.remove());
    
    navigator.clipboard.writeText(clone.innerText || clone.textContent).then(() => {
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = originalText; }, 1500);
    });
}

// ======================== ATTACHMENTS ========================
function renderAttachments() {
    const area = document.getElementById('attachments-area');
    if (!area) return;

    area.innerHTML = '';
    state.attached.forEach((file, idx) => {
        const label = file.name.length > 34 ? file.name.slice(0, 31) + '…' : file.name;
        const chip  = document.createElement('div');
        chip.className = 'file-chip';
        chip.title = file.name;
        chip.innerHTML = `📄 ${label} <button onclick="removeAttachment(${idx})" aria-label="Remove ${file.name}">✕</button>`;
        area.appendChild(chip);
    });
}

async function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    for (const file of files) {
        if (state.attached.find(f => f.name === file.name)) continue;
        try {
            const content = await file.text();
            state.attached.push({ name: file.name, content });
        } catch (err) {
            console.error('Failed to read file:', err);
        }
    }
    renderAttachments();
    e.target.value = '';
}

function removeAttachment(idx) {
    state.attached.splice(idx, 1);
    renderAttachments();
}

// ======================== SEND ========================
function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

async function sendMessage() {
    const inp  = document.getElementById('chat-input');
    const text = inp ? inp.value.trim() : '';

    if (!text && state.attached.length === 0) return;
    if (state.busy) return;
    if (!state.backendUp) {
        showOfflineWarning();
        return;
    }

    let userContent = text;
    if (state.attached.length > 0) {
        state.attached.forEach(f => {
            userContent += `\n\n📎 ${f.name}:\n\`\`\`\n${f.content}\n\`\`\``;
        });
    }

    // 1. Capture User Timestamp
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    state.messages.push({ role: 'user', content: userContent, timestamp: userTime });
    renderMessages();

    // Clear
    if (inp) { inp.value = ''; inp.style.height = ''; }

    appendThinkingBubble();
    state.busy = true;
    setBusyState(true);

    // 2. Start timer for AI response
    const startTime = Date.now();

    try {
        const endpoint = state.mode === 'pyqa' ? '/pyqa' : '/ask';
        const payload = buildPayload(userContent);
        
        const response = await fetch(`${API}${endpoint}`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
            signal:  AbortSignal.timeout(60000),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Server error ${response.status}: ${err}`);
        }

        const data  = await response.json();
        const reply = data.answer || data.response || data.message || 'No response from server.';

        // 3. Stop timer, calculate duration, and get AI timestamp
        const endTime = Date.now();
        const responseTimeSec = ((endTime - startTime) / 1000).toFixed(1);
        const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        state.messages.push({ 
            role: 'assistant', 
            content: reply,
            timestamp: aiTime,
            responseTime: responseTimeSec
        });

        // Persist session
        if (state.currentSessionId && state.sessions.has(state.currentSessionId)) {
            const sess       = state.sessions.get(state.currentSessionId);
            sess.messages    = [...state.messages];
            sess.mode        = state.mode;
            if (sess.messages.filter(m => m.role === 'user').length === 1) {
                sess.name = (text || 'Attachment').slice(0, 36);
            }
        }
        persistSessions();
        state.attached = [];

    } catch (err) {
        console.error('Send error:', err);
        state.messages.push({ role: 'assistant', content: `⚠️ Error: ${err.message}` });
    } finally {
        removeThinkingBubble();
        state.busy = false;
        setBusyState(false);
        renderMessages();
        renderAttachments();
        renderSessionList();
    }
}

function buildPayload(userContent) {
    const history = state.messages.slice(0, -1).map(m => ({
        role:    m.role,
        content: m.content,
    }));

    if (state.mode === 'pyqa') {
        return {
            messages: history.concat([{ role: 'user', content: userContent }]),
            question: userContent,
        };
    } else {
        return {
            question: userContent,
        };
    }
}

function setBusyState(busy) {
    const btn = document.getElementById('send-btn');
    if (btn) {
        btn.disabled    = busy;
        btn.textContent = busy ? 'Sending…' : 'Send';
    }
    const inp = document.getElementById('chat-input');
    if (inp) inp.disabled = busy;
}

function showOfflineWarning() {
    const container = document.getElementById('messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'message assistant';
    div.innerHTML = `
        <div class="avatar">PyAI</div>
        <div class="bubble-wrapper">
            <div class="bubble" style="color:#b91c1c">⚠️ Backend is offline. Please start the server and try again.</div>
        </div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// ======================== HEALTH ========================
async function ping() {
    try {
        const res = await fetch(`${API}/status`, { signal: AbortSignal.timeout(2500) });
        if (!res.ok) throw new Error('not ok');
        state.backendUp = true;
        updateStatusBadge(true);
    } catch {
        state.backendUp = false;
        updateStatusBadge(false);
    }
}

function updateStatusBadge(online) {
    const dot  = document.querySelector('.status-dot');
    const text = document.getElementById('status-text');
    if (dot)  dot.classList.toggle('offline', !online);
    if (text) text.textContent = online ? 'Connected' : 'Offline';
}

function startHealthPoll() {
    ping();
    setInterval(ping, 5000);
}

// ======================== AUTH (stub) ========================
function doLogout() {
    window.location.href = '/logout';
}

// ======================== INIT ========================
function init() {
    loadSessions();

    const savedMode = localStorage.getItem('pyassist_mode');
    if (savedMode && MODES[savedMode]) {
        setMode(savedMode);
    } else {
        setMode('pyqa');
    }

    newChat();

    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.addEventListener('change', handleFileUpload);

    initSidebar();
    startHealthPoll();
}

// ======================== GLOBALS ========================
window.toggleSidebar      = toggleSidebar;
window.newChat            = newChat;
window.switchSession      = switchSession;
window.deleteSession      = deleteSession;
window.sendMessage        = sendMessage;
window.handleKeyPress     = handleKeyPress;
window.autoResizeTextarea = autoResizeTextarea;
window.removeAttachment   = removeAttachment;
window.setMode            = setMode;
window.copyBubble         = copyBubble;
window.copyCodeBlock      = copyCodeBlock;
window.downloadCodeBlock  = downloadCodeBlock;

// Boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

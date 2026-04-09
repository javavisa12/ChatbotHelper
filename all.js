/* ============================================================
   PYASSIST - JavaScript (Following PBAI Design)
   ============================================================ */

// ======================== CONFIG ========================
const API = 'http://localhost:8504/api';

const MODES = {
    ask: { badge: 'Ask', title: 'Ask About Code', desc: 'Analyze your code' },
    pyqa: { badge: 'Q&A', title: 'Python Q&A', desc: 'Ask Python questions' },
    analyze: { badge: 'Analyze', title: 'Analyze Code', desc: 'Deep analysis' },
    review: { badge: 'Review', title: 'Code Review', desc: 'Get feedback' },
};

// ======================== STATE ========================
const state = {
    mode: 'ask',
    busy: false,
    backendUp: false,
    attached: [],
    sessions: new Map(),
    currentSessionId: null,
    messages: [],
    sidebarCollapsed: false,
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

function autoResizeTextarea(el) {
    if (el) {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 130) + 'px';
    }
}

// ======================== SIDEBAR ========================
function toggleSidebar() {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
    }
    localStorage.setItem('pyassist_sidebar_collapsed', state.sidebarCollapsed);
}

function initSidebar() {
    const saved = localStorage.getItem('pyassist_sidebar_collapsed') === 'true';
    if (saved) {
        state.sidebarCollapsed = true;
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('collapsed');
    }
}

function renderSessionList() {
    const sessionList = document.getElementById('session-list');
    if (!sessionList) return;

    if (state.sessions.size === 0) {
        sessionList.innerHTML = '<div class="sidebar-empty">No past sessions</div>';
        return;
    }

    let html = '';
    for (const [id, sess] of state.sessions) {
        const isActive = id === state.currentSessionId;
        const displayName = sess.name.length > 28 ? sess.name.slice(0, 25) + '...' : sess.name;
        html += `<div class="session-item ${isActive ? 'active' : ''}" onclick="switchSession('${id}')">${displayName}</div>`;
    }
    sessionList.innerHTML = html;
}

function newChat() {
    const now = new Date();
    const friendlyTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    const newName = `Chat ${friendlyTime}`;

    state.sessions.set(newId, { name: newName, messages: [] });
    state.currentSessionId = newId;
    state.messages = [];
    state.attached = [];

    persistSessions();
    renderSessionList();
    renderMessages();
    renderAttachments();
}

function switchSession(sessionId) {
    if (!state.sessions.has(sessionId)) return;

    state.currentSessionId = sessionId;
    state.messages = [...(state.sessions.get(sessionId)?.messages || [])];
    state.attached = [];

    renderSessionList();
    renderMessages();
    renderAttachments();
}

function persistSessions() {
    const data = Array.from(state.sessions.entries()).map(([id, sess]) => ({
        id,
        name: sess.name,
        messages: sess.messages,
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
            state.sessions.set(item.id, { name: item.name, messages: item.messages || [] });
        }
        if (state.sessions.size > 0) {
            const firstId = Array.from(state.sessions.keys())[0];
            state.currentSessionId = firstId;
            state.messages = [...(state.sessions.get(firstId)?.messages || [])];
        }
    } catch (err) {
        console.warn('Failed to load sessions:', err);
    }
}

// ======================== MESSAGES ========================
function renderMessages() {
    const messagesDiv = document.getElementById('messages');
    if (!messagesDiv) return;

    if (state.messages.length === 0) {
        messagesDiv.innerHTML = `
            <div class="message assistant">
                <div class="avatar">AI</div>
                <div class="bubble-wrapper">
                    <div class="bubble">Hello! I'm PyAssist, your Python expert. Ask me about Python, code reviews, best practices, or upload files for analysis.</div>
                </div>
            </div>`;
        return;
    }

    let html = '';
    for (const msg of state.messages) {
        const role = msg.role === 'user' ? 'user' : 'assistant';
        const avatar = role === 'user' ? 'You' : 'AI';
        const bubbleClass = role === 'user' ? 'message user' : 'message assistant';

        html += `
            <div class="${bubbleClass}">
                <div class="avatar">${avatar}</div>
                <div class="bubble-wrapper">
                    <div class="bubble">${esc(msg.content)}</div>
                </div>
            </div>`;
    }

    messagesDiv.innerHTML = html;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ======================== ATTACHMENTS ========================
function renderAttachments() {
    const container = document.getElementById('attachments-area');
    if (!container) return;

    container.innerHTML = '';
    state.attached.forEach((file, idx) => {
        const chip = document.createElement('div');
        chip.className = 'file-chip';
        chip.innerHTML = `
            📄 ${file.name.length > 30 ? file.name.slice(0, 27) + '...' : file.name}
            <button onclick="removeAttachment(${idx})">✕</button>
        `;
        container.appendChild(chip);
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

// ======================== SEND MESSAGE ========================
function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

async function sendMessage() {
    const inp = document.getElementById('chat-input');
    const text = inp ? inp.value.trim() : '';

    if (!text && state.attached.length === 0) return;
    if (state.busy || !state.backendUp) return;

    // Build message content
    let userContent = text;
    if (state.attached.length > 0) {
        userContent += '\n\n📎 Attached files:\n';
        userContent += state.attached
            .map(f => `${f.name} (${f.content.length} chars)`)
            .join('\n');
    }

    // Add to messages
    state.messages.push({ role: 'user', content: userContent });
    renderMessages();

    // Clear input
    if (inp) {
        inp.value = '';
        inp.style.height = '';
    }

    // Show thinking
    const messagesDiv = document.getElementById('messages');
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'message assistant';
    thinkingDiv.id = 'thinking-msg';
    thinkingDiv.innerHTML = `
        <div class="avatar">AI</div>
        <div class="bubble-wrapper">
            <div class="bubble"><span class="status-indicator active">Processing...</span></div>
        </div>`;
    messagesDiv?.appendChild(thinkingDiv);
    messagesDiv?.scrollTo({ top: messagesDiv.scrollHeight, behavior: 'smooth' });

    state.busy = true;
    setBusyState(true);

    try {
        // Simulate API call
        await new Promise(r => setTimeout(r, 1500));

        const reply = 'I received your message. In a real setup, I would analyze your code and provide feedback. ' +
            (state.attached.length > 0 ? `I see you uploaded ${state.attached.length} file(s).` : '');

        state.messages.push({ role: 'assistant', content: reply });

        // Update session
        if (state.currentSessionId && state.sessions.has(state.currentSessionId)) {
            state.sessions.get(state.currentSessionId).messages = [...state.messages];
            persistSessions();
        }

        // Clear attachments
        state.attached = [];

        renderMessages();
        renderAttachments();
    } catch (err) {
        console.error('Error:', err);
        state.messages.push({ role: 'assistant', content: 'Error: ' + err.message });
        renderMessages();
    } finally {
        state.busy = false;
        setBusyState(false);
    }
}

function setBusyState(busy) {
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.disabled = busy;
        sendBtn.textContent = busy ? 'Sending...' : 'Send';
    }
}

// ======================== TABS ========================
function switchTab(tabName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.setAttribute('aria-hidden', 'true');
        v.hidden = true;
    });

    // Deactivate all tabs
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });

    // Show selected view
    const view = document.getElementById(tabName + '-view');
    if (view) {
        view.classList.add('active');
        view.removeAttribute('aria-hidden');
        view.hidden = false;
    }

    // Activate tab
    const tab = document.getElementById('tab-' + tabName);
    if (tab) {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
    }
}

// ======================== HEALTH / STATUS ========================
async function ping() {
    try {
        const response = await fetch(API + '/status', {
            signal: AbortSignal.timeout(2500),
        });
        const data = await response.json();
        state.backendUp = true;
        updateStatusBadge(true);
    } catch {
        state.backendUp = false;
        updateStatusBadge(false);
    }
}

function updateStatusBadge(online) {
    const badge = document.getElementById('conn-status');
    const dot = badge?.querySelector('.status-dot');
    const text = badge?.querySelector('#status-text');

    if (dot) {
        dot.classList.toggle('offline', !online);
    }
    if (text) {
        text.textContent = online ? 'Connected' : 'Offline';
    }
}

function startHealthPoll() {
    ping();
    setInterval(ping, 5000);
}

// ======================== UPLOAD VIEW (placeholder) ========================
function loadDocuments() {
    console.log('Loading documents...');
}

function renderUploadDocs() {
    console.log('Rendering upload docs...');
}

function setUploadSort(value) {
    console.log('Sort by:', value);
}

function toggleUploadSelectAll(checkbox) {
    console.log('Select all:', checkbox.checked);
}

function saveAllUpload() {
    console.log('Saving all uploads...');
}

// ======================== INIT ========================
function init() {
    // Load sessions
    loadSessions();

    // If no session, create one
    if (state.sessions.size === 0) {
        newChat();
    }

    // Render UI
    renderSessionList();
    renderMessages();
    renderAttachments();

    // Setup event listeners
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    // Initialize sidebar
    initSidebar();

    // Start health polling
    startHealthPoll();
}

// ======================== EXPOSE GLOBALS ========================
window.toggleSidebar = toggleSidebar;
window.newChat = newChat;
window.switchSession = switchSession;
window.sendMessage = sendMessage;
window.handleKeyPress = handleKeyPress;
window.autoResizeTextarea = autoResizeTextarea;
window.removeAttachment = removeAttachment;
window.switchTab = switchTab;
window.loadDocuments = loadDocuments;
window.renderUploadDocs = renderUploadDocs;
window.setUploadSort = setUploadSort;
window.toggleUploadSelectAll = toggleUploadSelectAll;
window.saveAllUpload = saveAllUpload;

// Start when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

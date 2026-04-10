// ======================== SIDEBAR ========================
// ... (keep toggleSidebar and initSidebar as they are) ...

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
        
        // Updated HTML injection to include the title wrapper and delete button
        html += `
            <div class="session-item${isActive ? ' active' : ''}" onclick="switchSession('${id}')">
                <div class="session-item-title">${modeTag}${label}</div>
                <button class="delete-session-btn" onclick="deleteSession(event, '${id}')" title="Delete chat" aria-label="Delete chat">✕</button>
            </div>`;
    }
    list.innerHTML = html;
}

// NEW: Function to handle session deletion
function deleteSession(event, sessionId) {
    // Prevent the click from bubbling up and triggering switchSession
    event.stopPropagation();

    // Optional confirmation dialog
    if (!confirm('Are you sure you want to delete this chat session?')) return;

    // Remove from state
    state.sessions.delete(sessionId);
    persistSessions();

    if (state.sessions.size === 0) {
        // If no sessions are left, create a new empty chat
        newChat();
    } else if (state.currentSessionId === sessionId) {
        // If we deleted the currently active chat, switch to the most recent one
        const firstId = Array.from(state.sessions.keys())[0];
        switchSession(firstId);
    } else {
        // If we deleted a background chat, just re-render the sidebar
        renderSessionList();
    }
}

async function sendMessage() {
    const inp = document.getElementById('chat-input');
    const text = inp ? inp.value.trim() : '';

    if (!text && state.attached.length === 0) return;
    if (state.busy) return;
    if (!state.backendUp) {
        showOfflineWarning();
        return;
    }

    // --- Build the display content (no file content) ---
    let displayContent = text;
    if (state.attached.length > 0) {
        const fileNames = state.attached.map(f => f.name).join(', ');
        displayContent += `\n\n📎 Attached: ${fileNames}`;
    }

    // --- Store user message (with attachments metadata) ---
    const userMessage = {
        role: 'user',
        text: text,
        attachments: [...state.attached], // copy current attachments
        displayContent: displayContent
    };
    state.messages.push(userMessage);

    // Clear input and attachments UI
    if (inp) { inp.value = ''; inp.style.height = ''; }
    renderMessages();

    appendThinkingBubble();
    state.busy = true;
    setBusyState(true);

    try {
        // Build the full content for the API (including file contents)
        const fullUserContent = buildFullUserContent(text, state.attached);
        const payload = buildPayloadForApi(fullUserContent);

        const endpoint = state.mode === 'pyqa' ? '/pyqa' : '/ask';
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

        const data = await response.json();
        const reply = data.answer || data.response || data.message || 'No response from server.';

        state.messages.push({ role: 'assistant', content: reply });

        // Persist session
        if (state.currentSessionId && state.sessions.has(state.currentSessionId)) {
            const sess = state.sessions.get(state.currentSessionId);
            sess.messages = [...state.messages];
            sess.mode = state.mode;
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

// Helper: build the full user input string including file contents for the API
function buildFullUserContent(text, attachments) {
    let full = text;
    if (attachments.length > 0) {
        attachments.forEach(f => {
            full += `\n\n📎 ${f.name}:\n\`\`\`\n${f.content}\n\`\`\``;
        });
    }
    return full;
}

// Helper: build the payload for the API using the full user content and conversation history
function buildPayloadForApi(fullUserContent) {
    // Reconstruct conversation history (for assistant messages we keep content as is;
    // for user messages we need to rebuild their full content from stored attachments)
    const history = state.messages.slice(0, -1).map(msg => {
        if (msg.role === 'user') {
            // Rebuild full content for previous user messages
            const prevText = msg.text || '';
            const prevAttachments = msg.attachments || [];
            const prevFull = buildFullUserContent(prevText, prevAttachments);
            return { role: 'user', content: prevFull };
        } else {
            return { role: 'assistant', content: msg.content };
        }
    });

    if (state.mode === 'pyqa') {
        return {
            messages: history.concat([{ role: 'user', content: fullUserContent }]),
            question: fullUserContent,
        };
    } else {
        return {
            question: fullUserContent,
        };
    }
}

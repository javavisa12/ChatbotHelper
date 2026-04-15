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
        const isUser = msg.role === 'user';
        const cls = isUser ? 'message user' : 'message assistant';
        const avatar = isUser ? 'You' : 'PyAI';

        if (isUser) {
            // --- User message: separate bubble (text) + attachments below ---
            const userText = msg.text || '';           // typed message
            const attachments = msg.attachments || []; // array of { name, content }

            // Bubble: only show if there is text
            const bubbleHtml = userText.trim() 
                ? `<div class="bubble">${esc(userText)}</div>` 
                : '';

            // Attachments list (if any)
            let attachmentsHtml = '';
            if (attachments.length > 0) {
                const chips = attachments.map(att => 
                    `<div class="file-chip">📄 ${esc(att.name)}</div>`
                ).join('');
                attachmentsHtml = `<div class="user-attachments">${chips}</div>`;
            }

            html += `
                <div class="${cls}">
                    <div class="avatar">${avatar}</div>
                    <div class="bubble-wrapper">
                        ${bubbleHtml}
                        ${attachmentsHtml}
                    </div>
                </div>`;
        } else {
            // Assistant message: unchanged, uses formatBubble for code blocks
            const contentHtml = formatBubble(msg.content, false);
            html += `
                <div class="${cls}">
                    <div class="avatar">${avatar}</div>
                    <div class="bubble-wrapper">
                        <div class="bubble">${contentHtml}</div>
                        <button class="copy-btn" onclick="copyBubble(this)">Copy</button>
                    </div>
                </div>`;
        }
    }

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

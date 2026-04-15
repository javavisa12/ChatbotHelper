function renderMessages() {
    const container = document.getElementById('messages');
    if (!container) return;

    if (state.messages.length === 0) {
        container.innerHTML = `...`; // keep the welcome message unchanged
        return;
    }

    let html = '';
    for (const msg of state.messages) {
        const isUser = msg.role === 'user';
        const cls = isUser ? 'message user' : 'message assistant';
        const avatar = isUser ? 'You' : 'PyAI';

        let contentHtml;
        if (isUser) {
            // Use displayContent (already escaped, no code blocks)
            contentHtml = esc(msg.displayContent);
        } else {
            // Assistant messages use the existing formatBubble (with code blocks)
            contentHtml = formatBubble(msg.content, false);
        }

        html += `
            <div class="${cls}">
                <div class="avatar">${avatar}</div>
                <div class="bubble-wrapper">
                    <div class="bubble">${contentHtml}</div>
                    ${!isUser ? '<button class="copy-btn" onclick="copyBubble(this)">Copy</button>' : ''}
                </div>
            </div>`;
    }

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

// ... (inside renderMessages()) ...

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
            
            // Put the timestamp and the copy button in the footer area
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

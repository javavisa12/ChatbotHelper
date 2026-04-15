function loadSessions() {
    try {
        const raw = localStorage.getItem('pyassist_sessions');
        if (!raw) return;
        const data = JSON.parse(raw);
        state.sessions.clear();
        for (const item of data) {
            // Migrate old user messages to the new structure
            const migratedMessages = (item.messages || []).map(msg => {
                if (msg.role === 'user' && msg.content && !msg.displayContent) {
                    // Old format: content contains text + file content
                    // We cannot recover the original text easily, but we can strip code blocks
                    // for display. Simpler: show a generic "[previous attachment]"
                    let display = msg.content.replace(/```[\s\S]*?```/g, '[file content hidden]');
                    return {
                        role: 'user',
                        text: msg.content.split('\n')[0], // first line as approximate text
                        attachments: [],
                        displayContent: display
                    };
                }
                return msg;
            });
            state.sessions.set(item.id, {
                name: item.name,
                mode: item.mode || 'pyqa',
                messages: migratedMessages,
            });
        }
    } catch (err) {
        console.warn('Failed to load sessions:', err);
    }
}

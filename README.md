/* ============================================================
   PyAssist — style.css (UPDATED - FIXED MESSAGE SPACING)
   ============================================================ */

/* ── Design tokens ────────────────────────────────────────── */
:root {
    --primary: #f30e19;
    --primary-dark: #e92929;
    --primary-light: #e8effe;

    --surface: #ffffff;
    --bg: #f7f8fa;
    --hover: #f0f2f5;
    --border: #e2e5ea;

    --text: #1a1f2e;
    --text-muted: #6b7280;

    --avatar-ai: #e8effe;

    --shadow-sm: 0 1px 4px rgba(0,0,0,.08);

    --radius: 10px;
    --radius-sm: 6px;
    --radius-pill: 999px;

    --fs-base: 14px;
}

/* ── Reset ─────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: var(--fs-base);
    color: var(--text);
    background: var(--bg);
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* ── Layout ─────────────────────────────────────────── */
.chat-layout {
    display: flex;
    flex: 1;
    overflow: hidden;
}

/* ── Chat main ────────────────────────────────────────────── */
#chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* ============================================================
   ✅ FIXED MESSAGES SECTION
   ============================================================ */

#messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

/* Message row */
.message {
    display: flex;
    gap: 6px;
    max-width: 820px;
    align-items: flex-end; /* KEY FIX */
}

.message.user {
    align-self: flex-end;
    flex-direction: row-reverse;
}

.message.assistant {
    align-self: flex-start;
}

/* Avatar */
.avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;

    align-self: flex-end; /* FIX */
}

.message.user .avatar {
    background: var(--primary);
    color: #fff;
}

.message.assistant .avatar {
    background: var(--avatar-ai);
    color: #444;
}

/* REMOVE vertical spacing issue */
.bubble-wrapper {
    display: contents;
}

/* Bubble */
.bubble {
    padding: 10px 14px;
    border-radius: var(--radius);
    font-size: 14px;
    line-height: 1.45;
    max-width: 680px;
    white-space: pre-wrap;
    word-break: break-word;
    display: inline-block;
}

.message.user .bubble {
    background: var(--primary);
    color: #fff;
    border-radius: var(--radius) 2px var(--radius) var(--radius);
}

.message.assistant .bubble {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 2px var(--radius) var(--radius) var(--radius);
}

/* INLINE footer (no extra height) */
.msg-footer {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: 8px;
}

.message.user .msg-footer {
    justify-content: flex-end;
}

/* Timestamp */
.msg-time {
    font-size: 11px;
    color: var(--text-muted);
    opacity: 0.7;
}

/* Copy button */
.copy-btn {
    background: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    font-size: 11px;
    padding: 2px 8px;
    cursor: pointer;
}

.copy-btn:hover {
    background: var(--hover);
    color: var(--text);
}

/* ── Input area ───────────────────────────────────────────── */
.input-area {
    padding: 12px 20px;
    background: var(--surface);
    border-top: 1px solid var(--border);
}

.input-row {
    display: flex;
    gap: 10px;
}

#chat-input {
    flex: 1;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
}

/* ── Scrollbar ───────────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }

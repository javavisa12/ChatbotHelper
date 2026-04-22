/* ── Messages ─────────────────────────────────────────────── */
#messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 6px; /* tighter spacing */
}

/* Message layout */
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

    align-self: flex-end; /* FIX alignment */
    margin-top: 0;
}

.message.user .avatar {
    background: var(--primary);
    color: #fff;
}

.message.assistant .avatar {
    background: var(--avatar-ai);
    color: #444;
}

/* REMOVE wrapper spacing effect */
.bubble-wrapper {
    display: contents;
}

/* Bubble */
.bubble {
    padding: 10px 14px;
    border-radius: var(--radius);
    font-size: 14px;
    line-height: 1.45; /* tighter text */
    width: fit-content;
    max-width: 680px;
    white-space: pre-wrap;
    word-break: break-word;
    display: inline-block;
}

/* Bubble colors */
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

/* Footer INLINE (no vertical space) */
.msg-footer {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: 8px;
}

/* User footer alignment */
.message.user .msg-footer {
    justify-content: flex-end;
}

/* Timestamp */
.msg-time {
    font-size: 11px;
    color: var(--text-muted);
    opacity: 0.7;
    white-space: nowrap;
}

/* Duration badge */
.msg-duration {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 11px;
    font-weight: 500;
    color: #2563eb;
    background: rgba(37, 99, 235, 0.08);
    border: 1px solid rgba(37, 99, 235, 0.15);
    border-radius: var(--radius-pill);
    padding: 1px 7px;
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
    font-family: inherit;
    line-height: 1.4;
}

.copy-btn:hover {
    background: var(--hover);
    color: var(--text);
}

/* User bubble copy styling */
.message.user .copy-btn {
    border-color: var(--text-muted);
    color: var(--text-muted);
}

.message.user .copy-btn:hover {
    background: var(--hover);
    color: var(--text);
}

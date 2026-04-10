/* ── Message Timestamps ───────────────────────────────────── */
.bubble-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 100%;
}

.msg-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: var(--text-muted);
    opacity: 0.8;
    padding: 0 4px;
}

.message.user .msg-footer {
    justify-content: flex-end;
}

/* Adjust copy button since it is now inside the flex footer */
.msg-footer .copy-btn {
    margin-top: 0; 
}

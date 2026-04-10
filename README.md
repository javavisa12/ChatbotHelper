/* ── Sidebar (Updated) ────────────────────────────────────── */
.session-item {
    padding: 9px 14px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text);
    border-left: 3px solid transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}
.session-item:hover { background: var(--hover); }
.session-item.active {
    border-left-color: var(--primary);
    background: var(--hover);
    font-weight: 500;
}

/* Wrapper to keep the text truncating properly */
.session-item-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
}

/* Delete button styles */
.delete-session-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 14px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    opacity: 0; /* Hidden until hovered */
    transition: opacity 0.2s, background 0.2s, color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    flex-shrink: 0;
}
.session-item:hover .delete-session-btn {
    opacity: 1;
}
.delete-session-btn:hover {
    background: rgba(243, 14, 25, 0.1);
    color: var(--primary);
}

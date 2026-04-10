// ... (inside sendMessage, right after building userContent) ...

    // 1. Capture User Timestamp
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    state.messages.push({ role: 'user', content: userContent, timestamp: userTime });
    renderMessages();

    // Clear
    if (inp) { inp.value = ''; inp.style.height = ''; }

    appendThinkingBubble();
    state.busy = true;
    setBusyState(true);

    // 2. Start timer for AI response
    const startTime = Date.now();

    try {
        // Choose endpoint based on mode
        const endpoint = state.mode === 'pyqa' ? '/pyqa' : '/ask';
        const payload = buildPayload(userContent);
        
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

        const data  = await response.json();
        const reply = data.answer || data.response || data.message || 'No response from server.';

        // 3. Stop timer, calculate duration, and get AI timestamp
        const endTime = Date.now();
        const responseTimeSec = ((endTime - startTime) / 1000).toFixed(1);
        const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        state.messages.push({ 
            role: 'assistant', 
            content: reply,
            timestamp: aiTime,
            responseTime: responseTimeSec // Save the duration
        });

        // ... (keep the rest of the function the same: persist session, catch blocks, etc.)

function copyBubble(btn) {
    // Traverse up to the wrapper, then find the bubble
    const wrapper = btn.closest('.bubble-wrapper');
    const bubble = wrapper.querySelector('.bubble');
    if (!bubble) return;
    
    // Get text content without the copy/download buttons text
    const clone = bubble.cloneNode(true);
    clone.querySelectorAll('.code-block-header, .code-btn').forEach(el => el.remove());
    
    navigator.clipboard.writeText(clone.innerText || clone.textContent).then(() => {
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = originalText; }, 1500);
    });
}

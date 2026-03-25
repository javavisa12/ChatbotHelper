/* ── formatter.js ────────────────────────────────────────────────────
 * Converts raw LLM response text into safe HTML.
 * Also provides the code-block download helper.
 * ─────────────────────────────────────────────────────────────────── */

import { esc } from './Ui.js';

let codeCounter = 0;

/**
 * Transform fenced code blocks and inline backticks into HTML.
 * @param {string} text  Raw response text from the API.
 * @returns {string}     HTML-safe string ready to be set as innerHTML.
 */
export function fmt(text) {
  text = String(text);

  // Fenced code blocks  ```lang\ncode```
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, lang, code) => {
    const id        = `code-block-${codeCounter++}`;
    const ext       = lang || 'py';
    const escaped   = esc(code.trim());

    return `
      <div class="code-block-wrapper">
        <div class="code-header">
          <span class="code-lang">${ext}</span>
          <button 
  class="code-download-btn" 
  onclick="downloadCode('${id}', '${ext}')" 
  title="Download"
>
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 3v12"/>
    <path d="M7 10l5 5 5-5"/>
    <path d="M5 21h14"/>
  </svg>
          <button class="code-copy-btn" title="Copy"></button>
        </div>
        <pre class="cb" id="${id}">${escaped}</pre>
      </div>`;
  });

  // Inline backticks
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  return text;
}

/**
 * Download the text content of a <pre> code block as a file.
 * Called directly from inline onclick attributes rendered by fmt().
 * @param {string} elementId   The id attribute of the <pre> element.
 * @param {string} extension   File extension (e.g. "py", "js").
 */
export function downloadCode(elementId, extension) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const blob = new Blob([el.textContent], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `pyassist_export_${Date.now()}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
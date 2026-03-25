/* ── files.js ────────────────────────────────────────────────────────
 * Handles all file/folder attachment logic:
 *   – reading files from <input> elements
 *   – syncing to the backend via api.loadFiles
 *   – keeping state.attached in sync
 *   – re-rendering the chips row in the UI
 * ─────────────────────────────────────────────────────────────────── */

import { state }       from './state.js';
import { loadProject, loadFiles } from './api.js';
import { setProj, renderSysMsg } from './Ui.js';

/* ── Chips (attached file labels) ───────────────────────────────── */

export function renderChips() {
  document.getElementById('chipsRow').innerHTML = state.attached
    .map((f, i) => `
      <div class="chip-item">
        <span>${f.name}</span>
        <button onclick="window._removeFile(${i})">✕</button>
      </div>`)
    .join('');
}

/* ── Sync state.attached → backend ──────────────────────────────── */

async function syncFiles() {
  if (!state.backendUp || !state.attached.length) return;
  await loadFiles(state.attached, state.selectedModel);
  setProj(state.attached.length + ' file(s)');
}

/* ── Public: called from onclick in HTML ─────────────────────────── */

/**
 * Handle files chosen via <input type="file">.
 * @param {Event} e  The change event from the file input.
 */
export function handleFiles(e) {
  const toRead = Array.from(e.target.files).filter(
    f => !state.attached.find(a => a.name === f.name)
  );
  if (!toRead.length) return;

  let done = 0;
  toRead.forEach(file => {
    const reader = new FileReader();
    reader.onload = async () => {
      state.attached.push({ name: file.name, content: reader.result });
      done++;
      if (done === toRead.length) {
        renderChips();
        await syncFiles();
      }
    };
    reader.readAsText(file);
  });

  // Reset input so the same file can be re-attached after removal
  e.target.value = '';
}

/**
 * Prompt for a folder path and load it via the backend API.
 */
export async function attachFolder() {
  const path = prompt('Enter full local path to project folder:');
  if (!path) return;

  try {
    const d = await loadProject(path, state.selectedModel);
    setProj(path);
    renderSysMsg(`Project loaded: ${d.files.length} files found.`, 'ok');
  } catch (err) {
    renderSysMsg('Folder load failed: ' + err.message, 'err');
  }
}

/**
 * Remove a file by index and re-sync.
 * Exposed on window so inline onclick strings can reach it.
 * @param {number} index
 */
export async function removeFile(index) {
  state.attached.splice(index, 1);
  renderChips();
  await syncFiles();
}

// Expose removeFile globally so the chips' onclick="window._removeFile(i)" works.
window._removeFile = removeFile;
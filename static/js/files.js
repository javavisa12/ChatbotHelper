/* ── files.js ────────────────────────────────────────────────────────
 * Handles all file/folder attachment logic:
 *   – reading files from <input> elements
 *   – syncing to the backend via api.loadFiles
 *   – keeping state.attached in sync
 *   – re-rendering the chips row in the UI

 * File/folder attachment + backend sync.
 * Resets chat session whenever a new project is loaded.
 * ─────────────────────────────────────────────────────────────────── */

import { state }                    from './state.js';
import { loadProject, loadFiles }   from './api.js';
import { setProj, renderSysMsg }    from './Ui.js';
import { resetSession }             from './chat.js';

/* ── Chips ───────────────────────────────────────────────────────── */
export function renderChips() {
  document.getElementById('chipsRow').innerHTML = state.attached
    .map((f, i) => `
      <div class="chip-item">
        <span>${f.name}</span>
        <button onclick="window._removeFile(${i})">✕</button>
      </div>`)
    .join('');
}

/* ── Sync to backend ─────────────────────────────────────────────── */
async function syncFiles() {
  if (!state.backendUp || !state.attached.length) return;
  await loadFiles(state.attached, state.selectedModel);
  setProj(state.attached.length + ' file(s)');
}

/* ── Handle file input ───────────────────────────────────────────── */
export function handleFiles(e) {
  const toRead = Array.from(e.target.files).filter(
    f => !state.attached.find(a => a.name === f.name)
  );
  if (!toRead.length) return;

  let done = 0;
  toRead.forEach(file => {
    const reader    = new FileReader();
    reader.onload   = async () => {
      state.attached.push({ name: file.name, content: reader.result });
      done++;
      if (done === toRead.length) {
        renderChips();
        // Reset session — new files = new context
        resetSession();
        await syncFiles();
        renderSysMsg(`${toRead.length} file(s) attached — session reset.`, 'ok');
      }
    };
    reader.readAsText(file);
  });

  e.target.value = '';
}

/* ── Attach folder ───────────────────────────────────────────────── */
export async function attachFolder() {
  const path = prompt('Enter full local path to project folder:');
  if (!path) return;

  try {
    const d = await loadProject(path, state.selectedModel);
    setProj(path);
    // Reset session — new project = fresh context
    resetSession();
    renderSysMsg(`Project loaded: ${d.files.length} files — session reset.`, 'ok');
  } catch (err) {
    renderSysMsg('Folder load failed: ' + err.message, 'err');
  }
}

/* ── Remove file ─────────────────────────────────────────────────── */
export async function removeFile(index) {
  state.attached.splice(index, 1);
  renderChips();
  await syncFiles();
}

window._removeFile = removeFile;
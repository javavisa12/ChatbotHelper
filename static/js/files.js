/* ── files.js ───────────────────────────────────────────────────────
 * File/folder attachment + backend sync.
 * ─────────────────────────────────────────────────────────────────── */

import { state }                  from './state.js';
import { loadProject, loadFiles } from './api.js';
import { setProj, renderSysMsg }  from './Ui.js';
import { resetSession }           from './chat.js';

export function renderChips() {
  document.getElementById('chipsRow').innerHTML = state.attached
    .map((f, i) => `
      <div class="chip-item">
        <span>${f.name}</span>
        <button onclick="window._removeFile(${i})">✕</button>
      </div>`)
    .join('');
}

async function syncFiles() {
  if (!state.backendUp || !state.attached.length) return;
  await loadFiles(state.attached);       // ← no model
  setProj(state.attached.length + ' file(s)');
}

export function handleFiles(e) {
  const toRead = Array.from(e.target.files).filter(
    f => !state.attached.find(a => a.name === f.name)
  );
  if (!toRead.length) return;

  let done = 0;
  toRead.forEach(file => {
    const reader  = new FileReader();
    reader.onload = async () => {
      state.attached.push({ name: file.name, content: reader.result });
      done++;
      if (done === toRead.length) {
        renderChips();
        resetSession();
        await syncFiles();
        renderSysMsg(`${toRead.length} file(s) attached — session reset.`, 'ok');
      }
    };
    reader.readAsText(file);
  });
  e.target.value = '';
}

export async function attachFolder() {
  const path = prompt('Enter full local path to project folder:');
  if (!path) return;
  try {
    const d = await loadProject(path);   // ← no model
    setProj(path);
    resetSession();
    renderSysMsg(`Project loaded: ${d.files.length} files — session reset.`, 'ok');
  } catch (err) {
    renderSysMsg('Folder load failed: ' + err.message, 'err');
  }
}

export async function removeFile(index) {
  state.attached.splice(index, 1);
  renderChips();
  await syncFiles();
}

window._removeFile = removeFile;
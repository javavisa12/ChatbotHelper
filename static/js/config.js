/* ── config.js ───────────────────────────────────────────────────────
 * Central constants & mode definitions.
 * Import this first — all other modules depend on it.
 * ─────────────────────────────────────────────────────────────────── */

export const API = 'http://localhost:5000/api';

export const MODES = {
  ask: {
    badge: 'Ask',
    title: 'Ask Question',
    desc: 'Ask a question about your loaded project or attached files',
    needsProject: true,
  },
  analyze: {
    badge: 'Analyze',
    title: 'Analyze Project',
    desc: 'Comprehensive breakdown: summary, bugs, quality, improvements',
    needsProject: true,
  },
  review: {
    badge: 'Review',
    title: 'Code Review',
    desc: 'Structured review of readability, structure, and correctness',
    needsProject: true,
  },
  refactor: {
    badge: 'Refactor',
    title: 'Refactor',
    desc: 'Concrete refactoring with before/after code examples',
    needsProject: true,
  },
  pyqa: {
    badge: 'Python Q&A',
    title: 'Python Q&A',
    desc: 'Ask any Python question — no project or files required',
    needsProject: false,
  },
};
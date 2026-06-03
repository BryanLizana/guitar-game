// ── Application state ──────────────────────────────────────────────────
const S = {
  slides: [{id:1, title:'Slide 1', comps:[]}],
  cur: 0, sel: null, multiSel: new Set(),
  nid: 1, nsid: 2, scale: 1, sketch: true, clip: null,
};

const cc = () => S.slides[S.cur].comps;

// ── History (undo/redo) ────────────────────────────────────────────────
const HIST = [];
let histIdx = -1;

function snapshot() {
  HIST.splice(histIdx + 1);
  HIST.push(JSON.parse(JSON.stringify({slides:S.slides, cur:S.cur, nid:S.nid, nsid:S.nsid})));
  if (HIST.length > 60) HIST.shift(); else histIdx++;
  syncUndoRedo();
}

function undo() { if (histIdx <= 0) return; histIdx--; applyHist(); }
function redo() { if (histIdx >= HIST.length - 1) return; histIdx++; applyHist(); }

function applyHist() {
  const h = HIST[histIdx];
  S.slides = JSON.parse(JSON.stringify(h.slides));
  S.cur = Math.min(h.cur, S.slides.length - 1);
  S.nid = h.nid; S.nsid = h.nsid;
  S.sel = null; S.multiSel.clear();
  renderAll(); renderProps(); renderSlidePanel(); status(); syncUndoRedo();
}

function syncUndoRedo() {
  document.getElementById('btn-undo').disabled = histIdx <= 0;
  document.getElementById('btn-redo').disabled = histIdx >= HIST.length - 1;
}

// Debounced snapshot for property changes
let propSnapT = null;
function dSnap() { clearTimeout(propSnapT); propSnapT = setTimeout(snapshot, 700); }

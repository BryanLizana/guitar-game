// ── Init ──────────────────────────────────────────────────────────────
// Load embedded state if this is an exported HTML presentation
if (window.__WF_INIT__) {
  const d = window.__WF_INIT__;
  S.slides = d.slides || S.slides;
  S.nid   = d.nid   || S.nid;
  S.nsid  = d.nsid  || S.nsid;
}

renderAll();
renderSlidePanel();
snapshot();

// Sketch mode active by default
document.body.classList.add('sketch');
document.getElementById('sketch-btn').classList.add('active');

// ── Zoom ──────────────────────────────────────────────────────────────
function zoom(delta) {
  S.scale = Math.min(2, Math.max(0.25, S.scale + delta));
  $cv.style.transform = `scale(${S.scale})`;
  document.getElementById('zoom-val').textContent = Math.round(S.scale * 100) + '%';
}

// ── Sketch mode ───────────────────────────────────────────────────────
function toggleSketch() {
  S.sketch = !S.sketch;
  document.body.classList.toggle('sketch', S.sketch);
  document.getElementById('sketch-btn').classList.toggle('active', S.sketch);
}

// ── Persist (localStorage) ────────────────────────────────────────────
function saveLS() {
  localStorage.setItem('wf', JSON.stringify({slides:S.slides, nid:S.nid, nsid:S.nsid}));
  const b = event.target;
  b.textContent = '✓ Guardado';
  setTimeout(() => b.textContent = '💾 Guardar', 1500);
}

function loadLS() {
  const raw = localStorage.getItem('wf');
  if (!raw) { alert('No hay diseño guardado.'); return; }
  const d = JSON.parse(raw);
  S.slides = d.slides || [{id:1, title:'Slide 1', comps:[]}];
  S.nid = d.nid || 1; S.nsid = d.nsid || 2;
  S.cur = 0; S.sel = null; S.multiSel.clear();
  renderAll(); renderProps(); renderSlidePanel(); status(); snapshot();
}

// ── Status bar ────────────────────────────────────────────────────────
function status() {
  $sn.innerHTML = `Slide <b>${S.cur + 1}/${S.slides.length}</b> · <b>${cc().length}</b> elementos`;
  if (S.multiSel.size > 1) {
    $ssel.innerHTML = `<b>${S.multiSel.size}</b> seleccionados`;
  } else if (S.sel) {
    const c = cc().find(x => x.id === S.sel);
    $ssel.innerHTML = c ? `<b>${TN[c.type]||c.type}</b> (${Math.round(c.x)},${Math.round(c.y)}) ${Math.round(c.width)}×${Math.round(c.height)}` : 'Nada';
  } else {
    $ssel.textContent = 'Nada seleccionado';
  }
}

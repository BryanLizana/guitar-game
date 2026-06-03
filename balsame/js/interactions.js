// ── Inline text editing ────────────────────────────────────────────────
function startInlineEdit(el, comp) {
  const key = INLINE_PROP[comp.type]; if (!key) return;
  const ov = document.createElement('div'); ov.className = 'inline-edit-ov';
  const inp = document.createElement('input'); inp.type = 'text'; inp.value = comp[key] || '';
  ov.appendChild(inp); el.appendChild(ov); inp.focus(); inp.select();
  const commit = () => { snapshot(); comp[key] = inp.value; ov.remove(); patch(comp); renderProps(); };
  inp.addEventListener('blur', commit);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') ov.remove();
    e.stopPropagation();
  });
}

// ── Selection ──────────────────────────────────────────────────────────
function sel(id) {
  S.sel = id; S.multiSel.clear();
  if (id) S.multiSel.add(id);
  updVis(); renderProps(); status();
}

function desel() { S.sel = null; S.multiSel.clear(); updVis(); renderProps(); status(); }

$cv.addEventListener('mousedown', e => {
  if (e.target === $cv || e.target === $sr) { desel(); startDragSel(e); }
});

// ── Drag-select box ────────────────────────────────────────────────────
let ds = null;
function startDragSel(e) {
  const r = $cv.getBoundingClientRect();
  const sx = (e.clientX - r.left) / S.scale, sy = (e.clientY - r.top) / S.scale;
  ds = {sx, sy};
  const mv = e2 => {
    const ex = (e2.clientX - $cv.getBoundingClientRect().left) / S.scale;
    const ey = (e2.clientY - $cv.getBoundingClientRect().top) / S.scale;
    const x = Math.min(sx, ex), y = Math.min(sy, ey), w = Math.abs(ex - sx), h = Math.abs(ey - sy);
    $sr.style.cssText = `display:block;left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
    ds = {sx, sy, ex, ey};
  };
  const up = () => {
    $sr.style.display = 'none';
    if (ds && ds.ex !== undefined) {
      const x = Math.min(ds.sx, ds.ex), y = Math.min(ds.sy, ds.ey);
      const x2 = Math.max(ds.sx, ds.ex), y2 = Math.max(ds.sy, ds.ey);
      if (x2 - x > 5 || y2 - y > 5) {
        const found = cc().filter(c => c.x < x2 && c.x + c.width > x && c.y < y2 && c.y + c.height > y);
        if (found.length) {
          S.multiSel = new Set(found.map(c => c.id));
          S.sel = found[found.length - 1].id;
          updVis(); renderProps(); status();
        }
      }
    }
    ds = null;
    document.removeEventListener('mousemove', mv);
    document.removeEventListener('mouseup', up);
  };
  document.addEventListener('mousemove', mv);
  document.addEventListener('mouseup', up);
}

// ── Drag from palette ──────────────────────────────────────────────────
let dragT = null;
document.querySelectorAll('.pi').forEach(el => {
  el.addEventListener('dragstart', e => { dragT = el.dataset.t; e.dataTransfer.effectAllowed = 'copy'; });
  el.addEventListener('dragend', () => dragT = null);
  el.addEventListener('dblclick', () => {
    const wrap = document.getElementById('cwrap');
    const r = $cv.getBoundingClientRect();
    addC(el.dataset.t,
      (wrap.scrollLeft + wrap.clientWidth / 2 - r.left) / S.scale - 60,
      (wrap.scrollTop + wrap.clientHeight / 3 - r.top) / S.scale - 16
    );
  });
});
$cv.addEventListener('dragover', e => { e.preventDefault(); $cv.classList.add('drop-over'); });
$cv.addEventListener('dragleave', e => { if (!$cv.contains(e.relatedTarget)) $cv.classList.remove('drop-over'); });
$cv.addEventListener('drop', e => {
  e.preventDefault(); $cv.classList.remove('drop-over'); if (!dragT) return;
  const r = $cv.getBoundingClientRect();
  addC(dragT, (e.clientX - r.left) / S.scale - 60, (e.clientY - r.top) / S.scale - 16);
});

function addC(type, x, y) {
  snapshot();
  const c = mk(type, x, y); cc().push(c);
  $cv.appendChild(mkEl(c));
  S.sel = c.id; S.multiSel.clear(); S.multiSel.add(c.id);
  updVis(); renderProps(); updateCurThumb(); status();
}

// ── Move ──────────────────────────────────────────────────────────────
function onCompDown(e) {
  if (e.target.classList.contains('rh')) return;
  e.stopPropagation();
  const id = parseInt(e.currentTarget.dataset.id);
  if (e.shiftKey) {
    if (S.multiSel.has(id)) S.multiSel.delete(id); else S.multiSel.add(id);
    S.sel = S.multiSel.size > 0 ? [...S.multiSel].at(-1) : null;
    updVis(); renderProps(); status(); return;
  }
  if (!S.multiSel.has(id)) { S.sel = id; S.multiSel.clear(); S.multiSel.add(id); updVis(); renderProps(); status(); }
  else { S.sel = id; renderProps(); }

  const comp = cc().find(x => x.id === id);
  if (comp) {
    const maxZ = Math.max(...cc().map(x => x.z || 1));
    if (comp.z < maxZ) { comp.z = maxZ + 1; const el = $cv.querySelector(`[data-id="${id}"]`); if (el) el.style.zIndex = comp.z; }
  }

  snapshot();
  const startPos = {};
  S.multiSel.forEach(sid => { const c2 = cc().find(x => x.id === sid); if (c2) startPos[sid] = {x:c2.x, y:c2.y}; });
  const sx = e.clientX / S.scale, sy = e.clientY / S.scale;
  const snapping = () => document.getElementById('gridChk').checked;
  let moved = false;
  const mv = e2 => {
    let dx = e2.clientX / S.scale - sx, dy = e2.clientY / S.scale - sy;
    if (snapping()) { dx = Math.round(dx / 20) * 20; dy = Math.round(dy / 20) * 20; }
    S.multiSel.forEach(sid => {
      const c2 = cc().find(x => x.id === sid); if (!c2 || !startPos[sid]) return;
      c2.x = Math.max(0, startPos[sid].x + dx); c2.y = Math.max(0, startPos[sid].y + dy);
      const el = $cv.querySelector(`[data-id="${sid}"]`);
      if (el) { el.style.left = c2.x + 'px'; el.style.top = c2.y + 'px'; }
    });
    const primary = cc().find(x => x.id === S.sel);
    if (primary) {
      const px = document.getElementById('pp-x'), py = document.getElementById('pp-y');
      if (px) px.value = Math.round(primary.x);
      if (py) py.value = Math.round(primary.y);
    }
    moved = true; status();
  };
  const up = () => {
    document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up);
    if (moved) { snapshot(); updateCurThumb(); }
  };
  document.addEventListener('mousemove', mv);
  document.addEventListener('mouseup', up);
}

// ── Resize ────────────────────────────────────────────────────────────
function onResDown(e, id) {
  e.preventDefault(); e.stopPropagation();
  const c = cc().find(x => x.id === id);
  const el = $cv.querySelector(`[data-id="${id}"]`);
  const sx = e.clientX, sy = e.clientY, sw = c.width, sh = c.height;
  snapshot();
  const mv = e2 => {
    c.width  = Math.max(40, sw + (e2.clientX - sx) / S.scale);
    c.height = Math.max(20, sh + (e2.clientY - sy) / S.scale);
    el.style.width = c.width + 'px'; el.style.height = c.height + 'px';
    el.innerHTML = html(c) + '<div class="rh"></div>';
    el.querySelector('.rh').addEventListener('mousedown', ev => onResDown(ev, id));
    const pw = document.getElementById('pp-w'), ph = document.getElementById('pp-h');
    if (pw) pw.value = Math.round(c.width); if (ph) ph.value = Math.round(c.height);
  };
  const up = () => {
    document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up);
    snapshot(); updateCurThumb();
  };
  document.addEventListener('mousemove', mv);
  document.addEventListener('mouseup', up);
}

// ── Component actions ──────────────────────────────────────────────────
function delComp() {
  snapshot();
  const sl = S.slides[S.cur]; sl.comps = sl.comps.filter(c => c.id !== S.sel);
  S.sel = null; S.multiSel.clear();
  renderAll(); renderProps(); updateCurThumb();
}

function delMulti() {
  snapshot();
  const ids = new Set(S.multiSel);
  S.slides[S.cur].comps = cc().filter(c => !ids.has(c.id));
  S.sel = null; S.multiSel.clear();
  renderAll(); renderProps(); updateCurThumb();
}

function dupComp() {
  const c = cc().find(x => x.id === S.sel); if (!c) return;
  snapshot();
  const copy = JSON.parse(JSON.stringify(c));
  copy.id = S.nid++; copy.x += 20; copy.y += 20; copy.z = cc().length + 1;
  cc().push(copy); $cv.appendChild(mkEl(copy)); sel(copy.id); updateCurThumb(); status();
}

function dupMulti() {
  snapshot(); const copies = [];
  getSelComps().forEach(c => {
    const cp = JSON.parse(JSON.stringify(c));
    cp.id = S.nid++; cp.x += 20; cp.y += 20; cp.z = cc().length + 1;
    cc().push(cp); copies.push(cp); $cv.appendChild(mkEl(cp));
  });
  S.multiSel = new Set(copies.map(c => c.id));
  S.sel = copies.at(-1)?.id || null;
  updVis(); renderProps(); updateCurThumb(); status();
}

function front() {
  const c = cc().find(x => x.id === S.sel); if (!c) return;
  c.z = Math.max(...cc().map(x => x.z || 1), 0) + 1;
  const el = $cv.querySelector(`[data-id="${c.id}"]`);
  if (el) el.style.zIndex = c.z;
}

function copyComp() {
  const c = cc().find(x => x.id === S.sel); if (!c) return;
  S.clip = JSON.parse(JSON.stringify(c));
}

function pasteComp() {
  if (!S.clip) return; snapshot();
  const copy = JSON.parse(JSON.stringify(S.clip));
  copy.id = S.nid++; copy.x += 20; copy.y += 20;
  S.clip = JSON.parse(JSON.stringify(copy));
  cc().push(copy); $cv.appendChild(mkEl(copy)); sel(copy.id); updateCurThumb(); status();
}

// ── Alignment ─────────────────────────────────────────────────────────
function getSelComps() { return [...S.multiSel].map(id => cc().find(c => c.id === id)).filter(Boolean); }

function alignComps(type) {
  const comps = getSelComps(); if (comps.length < 2) return; snapshot();
  if (type === 'left')   { const v = Math.min(...comps.map(c => c.x)); comps.forEach(c => { c.x = v; patch(c); }); }
  if (type === 'right')  { const v = Math.max(...comps.map(c => c.x + c.width)); comps.forEach(c => { c.x = v - c.width; patch(c); }); }
  if (type === 'cH')     { const v = comps.reduce((s,c) => s + c.x + c.width/2, 0) / comps.length; comps.forEach(c => { c.x = v - c.width/2; patch(c); }); }
  if (type === 'top')    { const v = Math.min(...comps.map(c => c.y)); comps.forEach(c => { c.y = v; patch(c); }); }
  if (type === 'bottom') { const v = Math.max(...comps.map(c => c.y + c.height)); comps.forEach(c => { c.y = v - c.height; patch(c); }); }
  if (type === 'cV')     { const v = comps.reduce((s,c) => s + c.y + c.height/2, 0) / comps.length; comps.forEach(c => { c.y = v - c.height/2; patch(c); }); }
  updateCurThumb();
}

function distrib(dir) {
  const comps = getSelComps(); if (comps.length < 3) return; snapshot();
  if (dir === 'h') {
    comps.sort((a,b) => a.x - b.x);
    const space = comps.at(-1).x - (comps[0].x + comps[0].width);
    const gap = space / (comps.length - 1);
    let x = comps[0].x + comps[0].width;
    comps.slice(1,-1).forEach(c => { c.x = x + gap; x = c.x + c.width; patch(c); });
  } else {
    comps.sort((a,b) => a.y - b.y);
    const space = comps.at(-1).y - (comps[0].y + comps[0].height);
    const gap = space / (comps.length - 1);
    let y = comps[0].y + comps[0].height;
    comps.slice(1,-1).forEach(c => { c.y = y + gap; y = c.y + c.height; patch(c); });
  }
  updateCurThumb();
}

// ── Grid toggle ───────────────────────────────────────────────────────
document.getElementById('gridChk').addEventListener('change', e => {
  document.getElementById('cwrap').classList.toggle('grid', e.target.checked);
});

// ── Keyboard shortcuts ─────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key === 'z')                       { e.preventDefault(); undo(); return; }
  if (ctrl && (e.key === 'y' || e.key === 'Z'))    { e.preventDefault(); redo(); return; }
  if (ctrl && e.key === 'c')                       { if (S.sel) copyComp(); return; }
  if (ctrl && e.key === 'v')                       { e.preventDefault(); pasteComp(); return; }
  if (ctrl && e.key === 'd')                       { e.preventDefault(); if (S.multiSel.size > 1) dupMulti(); else if (S.sel) dupComp(); return; }
  if (ctrl && e.key === 'a')                       { e.preventDefault(); S.multiSel = new Set(cc().map(c => c.id)); S.sel = cc().length ? cc().at(-1).id : null; updVis(); renderProps(); status(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { if (S.multiSel.size > 1) delMulti(); else if (S.sel) delComp(); return; }
  if (e.key === 'Escape')   { desel(); return; }
  if (e.key === 'PageDown') { e.preventDefault(); nextSlide(); return; }
  if (e.key === 'PageUp')   { e.preventDefault(); prevSlide(); return; }
  if ((S.sel || S.multiSel.size) && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1; snapshot();
    getSelComps().forEach(c => {
      if (e.key === 'ArrowLeft')  c.x = Math.max(0, c.x - step);
      if (e.key === 'ArrowRight') c.x += step;
      if (e.key === 'ArrowUp')    c.y = Math.max(0, c.y - step);
      if (e.key === 'ArrowDown')  c.y += step;
      patch(c);
    });
    status();
  }
});

// ── Slide management ───────────────────────────────────────────────────
function goToSlide(idx) {
  idx = Math.max(0, Math.min(S.slides.length - 1, idx));
  S.cur = idx; S.sel = null; S.multiSel.clear();
  renderAll(); renderProps(); renderSlidePanel(); status();
}

function prevSlide() { goToSlide(S.cur - 1); }
function nextSlide() { goToSlide(S.cur + 1); }

function addSlide() {
  snapshot();
  S.slides.push({id:S.nsid++, title:`Slide ${S.slides.length + 1}`, comps:[]});
  goToSlide(S.slides.length - 1);
}

function dupSlide() {
  snapshot();
  const src = S.slides[S.cur];
  const cp = JSON.parse(JSON.stringify(src));
  cp.id = S.nsid++; cp.title += ' (copia)';
  cp.comps.forEach(c => c.id = S.nid++);
  S.slides.splice(S.cur + 1, 0, cp);
  goToSlide(S.cur + 1);
}

function delSlide() {
  if (S.slides.length <= 1) { alert('No puedes eliminar el único slide.'); return; }
  snapshot();
  S.slides.splice(S.cur, 1);
  S.sel = null; S.multiSel.clear();
  S.cur = Math.min(S.cur, S.slides.length - 1);
  renderAll(); renderProps(); renderSlidePanel(); status();
}

function moveSlide(dir) {
  const newIdx = S.cur + dir;
  if (newIdx < 0 || newIdx >= S.slides.length) return;
  snapshot();
  const slide = S.slides.splice(S.cur, 1)[0];
  S.slides.splice(newIdx, 0, slide);
  S.cur = newIdx;
  renderSlidePanel();
}

function clearSlide() {
  if (!cc().length) return;
  if (!confirm('¿Limpiar este slide?')) return;
  snapshot();
  S.slides[S.cur].comps = [];
  S.sel = null; S.multiSel.clear();
  renderAll(); renderProps(); renderSlidePanel(); status();
}

// ── Slide panel (thumbnails) ───────────────────────────────────────────
function thumbColor(c) { return TCLR[c.type] || '#c0c4cc'; }

function renderSlidePanel() {
  const el = document.getElementById('slide-thumbs');
  document.getElementById('sp-counter').textContent = `${S.cur + 1} / ${S.slides.length}`;
  const lbl = document.getElementById('cv-slide-lbl');
  if (lbl) lbl.textContent = S.slides[S.cur].title || `Slide ${S.cur + 1}`;
  el.innerHTML = '';
  S.slides.forEach((slide, idx) => {
    const th = document.createElement('div');
    th.className = 'sthumb' + (idx === S.cur ? ' on' : '');
    th.dataset.idx = idx;
    const mini = document.createElement('div');
    mini.className = 'sthumb-mini';
    slide.comps.forEach(c => {
      const b = document.createElement('div');
      b.className = 'sthumb-blk';
      b.style.cssText = `left:${c.x*sc}px;top:${c.y*sc}px;width:${Math.max(3,c.width*sc)}px;height:${Math.max(2,c.height*sc)}px;background:${thumbColor(c)};opacity:0.75;`;
      mini.appendChild(b);
    });
    if (!slide.comps.length) {
      const e = document.createElement('div');
      e.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:#ccc;';
      e.textContent = 'vacío';
      mini.appendChild(e);
    }
    const num = document.createElement('span'); num.className = 'sthumb-num'; num.textContent = idx + 1;
    const bar = document.createElement('span'); bar.className = 'sthumb-bar'; bar.textContent = slide.title || `Slide ${idx + 1}`;
    th.appendChild(mini); th.appendChild(num); th.appendChild(bar);
    th.addEventListener('click', () => goToSlide(idx));
    th.addEventListener('dblclick', e => {
      e.preventDefault();
      const v = prompt('Nombre del slide:', slide.title || `Slide ${idx + 1}`);
      if (v !== null) { slide.title = v.trim() || `Slide ${idx + 1}`; renderSlidePanel(); }
    });
    el.appendChild(th);
  });
  const active = el.querySelector('.sthumb.on');
  if (active) active.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
}

function updateCurThumb() {
  const el = document.querySelector(`.sthumb[data-idx="${S.cur}"]`); if (!el) return;
  const mini = el.querySelector('.sthumb-mini'); if (!mini) return;
  mini.innerHTML = '';
  cc().forEach(c => {
    const b = document.createElement('div');
    b.className = 'sthumb-blk';
    b.style.cssText = `left:${c.x*sc}px;top:${c.y*sc}px;width:${Math.max(3,c.width*sc)}px;height:${Math.max(2,c.height*sc)}px;background:${thumbColor(c)};opacity:0.75;`;
    mini.appendChild(b);
  });
  if (!cc().length) {
    const e = document.createElement('div');
    e.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:#ccc;';
    e.textContent = 'vacío';
    mini.appendChild(e);
  }
}

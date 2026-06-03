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

// ── Export HTML (self-contained: inlines CSS + JS + state) ────────────
async function exportHTML() {
  const state = JSON.stringify({slides: S.slides, nid: S.nid, nsid: S.nsid});

  let css, jsTexts;
  try {
    [css, ...jsTexts] = await Promise.all([
      fetch('css/main.css').then(r => r.text()),
      fetch('js/config.js').then(r => r.text()),
      fetch('js/state.js').then(r => r.text()),
      fetch('js/renderer.js').then(r => r.text()),
      fetch('js/props.js').then(r => r.text()),
      fetch('js/slides.js').then(r => r.text()),
      fetch('js/interactions.js').then(r => r.text()),
      fetch('js/controls.js').then(r => r.text()),
      fetch('js/app.js').then(r => r.text()),
    ]);
  } catch {
    alert('Error al leer los archivos.\nAbre la app desde un servidor local (ej: VS Code Live Server) para poder exportar.');
    return;
  }

  const js = jsTexts.join('\n\n');

  const bodyHTML = `
<div id="hdr">
  <span class="logo">⬡ WireForms</span>
  <div class="vsep"></div>
  <button class="hbtn" id="btn-undo" onclick="undo()" disabled title="Deshacer Ctrl+Z">↩ Deshacer</button>
  <button class="hbtn" id="btn-redo" onclick="redo()" disabled title="Rehacer Ctrl+Y">↪ Rehacer</button>
  <div class="vsep"></div>
  <button class="hbtn" onclick="saveLS()">💾 Guardar</button>
  <button class="hbtn" onclick="loadLS()">📂 Cargar</button>
  <label class="grid-lbl"><input type="checkbox" id="gridChk"> Grilla</label>
  <button class="hbtn" id="sketch-btn" onclick="toggleSketch()" title="Modo boceto">✏ Sketch</button>
  <div class="vsep"></div>
  <button class="hbtn" onclick="zoom(-0.1)">−</button>
  <span id="zoom-val">100%</span>
  <button class="hbtn" onclick="zoom(+0.1)">+</button>
  <div class="spacer"></div>
  <button class="hbtn pri" onclick="window.print()">Exportar PDF</button>
</div>
<div id="main">
  <div id="pal">
    <div class="pal-sec">Formularios</div>
    <div class="pi" draggable="true" data-t="lbl"><i class="pi-icon">T</i>Etiqueta</div>
    <div class="pi" draggable="true" data-t="h1"><i class="pi-icon">H₁</i>Título</div>
    <div class="pi" draggable="true" data-t="inp"><i class="pi-icon">▭</i>Texto</div>
    <div class="pi" draggable="true" data-t="num"><i class="pi-icon">#</i>Número</div>
    <div class="pi" draggable="true" data-t="ta"><i class="pi-icon">≡</i>Área texto</div>
    <div class="pi" draggable="true" data-t="sel"><i class="pi-icon">▾</i>Desplegable</div>
    <div class="pi" draggable="true" data-t="chk"><i class="pi-icon">☑</i>Checkbox</div>
    <div class="pi" draggable="true" data-t="rad"><i class="pi-icon">◉</i>Radio</div>
    <div class="pi" draggable="true" data-t="date"><i class="pi-icon">📅</i>Fecha</div>
    <div class="pi" draggable="true" data-t="slide"><i class="pi-icon">⊟</i>Slider</div>
    <div class="pi" draggable="true" data-t="search"><i class="pi-icon">🔍</i>Búsqueda</div>
    <div class="pal-sec">Acciones</div>
    <div class="pi" draggable="true" data-t="btn"><i class="pi-icon">▶</i>Botón</div>
    <div class="pi" draggable="true" data-t="badge"><i class="pi-icon">◉</i>Badge</div>
    <div class="pi" draggable="true" data-t="alert"><i class="pi-icon">⚠</i>Alerta</div>
    <div class="pal-sec">Reportes</div>
    <div class="pi" draggable="true" data-t="tbl"><i class="pi-icon">⊞</i>Tabla</div>
    <div class="pi" draggable="true" data-t="prog"><i class="pi-icon">▬</i>Progreso</div>
    <div class="pi" draggable="true" data-t="pgn"><i class="pi-icon">⋯</i>Paginación</div>
    <div class="pi" draggable="true" data-t="card"><i class="pi-icon">▣</i>Card</div>
    <div class="pal-sec">Anotaciones</div>
    <div class="pi" draggable="true" data-t="arr"><i class="pi-icon">→</i>Flecha</div>
    <div class="pi" draggable="true" data-t="icon"><i class="pi-icon">★</i>Ícono</div>
    <div class="pal-sec">Layout</div>
    <div class="pi" draggable="true" data-t="nav"><i class="pi-icon">☰</i>Nav Bar</div>
    <div class="pi" draggable="true" data-t="imgph"><i class="pi-icon">🖼</i>Imagen</div>
    <div class="pi" draggable="true" data-t="box"><i class="pi-icon">□</i>Zona</div>
    <div class="pi" draggable="true" data-t="sep"><i class="pi-icon">─</i>Separador</div>
  </div>
  <div id="cwrap">
    <div id="cv-bar"><span id="cv-slide-lbl">Slide 1</span></div>
    <div id="cv"><div id="sel-rect"></div></div>
  </div>
  <div id="props">
    <h3>Propiedades</h3>
    <div id="pb"><p class="empty">Selecciona un elemento<br>para editar sus propiedades</p></div>
  </div>
</div>
<div id="spanel">
  <div id="sp-ctrl">
    <div class="sp-row">
      <button class="spbtn" onclick="addSlide()">＋ Slide</button>
      <button class="spbtn" onclick="dupSlide()">⧉</button>
      <button class="spbtn danger" onclick="delSlide()">✕</button>
    </div>
    <div class="sp-row" style="justify-content:center;">
      <button class="spbtn" onclick="prevSlide()">◀</button>
      <span id="sp-counter">1 / 1</span>
      <button class="spbtn" onclick="nextSlide()">▶</button>
    </div>
  </div>
  <div id="slide-thumbs"></div>
</div>
<div id="sb">
  <span id="sb-sel">Nada seleccionado</span>
  <span id="sb-n">Slide 1/1 · 0 elementos</span>
  <span>960 × 680 px · Shift+clic = multi · ↩↪ = undo/redo</span>
</div>`;

  const doc = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>WireForms</title>
  <style>${css}<\/style>
</head>
<body>
${bodyHTML}
<script>
window.__WF_INIT__ = ${state};
${js}
<\/script>
</body>
</html>`;

  const blob = new Blob([doc], {type: 'text/html;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'wireframes-presentacion.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
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

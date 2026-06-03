// ── Properties panel ───────────────────────────────────────────────────
function renderProps() {
  if (S.multiSel.size > 1) { renderMultiProps(); return; }
  if (!S.sel) {
    $pb.innerHTML = '<p class="empty">Selecciona un elemento<br>para editar sus propiedades</p>';
    return;
  }
  const c = cc().find(x => x.id === S.sel); if (!c) return;
  let h = `<div style="font-size:10px;color:var(--muted);margin-bottom:10px;">${TN[c.type]||c.type} · id ${c.id}</div>`;
  h += `<div class="pr"><div class="prop"><label>X</label><input type="number" id="pp-x" value="${Math.round(c.x)}" oninput="p('x',+this.value,1)"></div><div class="prop"><label>Y</label><input type="number" id="pp-y" value="${Math.round(c.y)}" oninput="p('y',+this.value,1)"></div></div>`;
  h += `<div class="pr"><div class="prop"><label>Ancho</label><input type="number" id="pp-w" value="${Math.round(c.width)}" oninput="p('width',+this.value,1)"></div><div class="prop"><label>Alto</label><input type="number" id="pp-h" value="${Math.round(c.height)}" oninput="p('height',+this.value,1)"></div></div>`;

  if (['lbl','h1','btn','chk','badge','box','card','alert','nav'].includes(c.type))
    h += `<div class="prop"><label>Texto / Etiqueta</label><input type="text" value="${c.label||''}" oninput="p('label',this.value)"></div>`;
  if (c.type === 'card')
    h += `<div class="prop"><label>Contenido</label><textarea oninput="p('body',this.value)">${c.body||''}</textarea></div>`;
  if (['inp','num','ta','date'].includes(c.type))
    h += `<div class="prop"><label>Placeholder</label><input type="text" value="${c.ph||''}" oninput="p('ph',this.value)"></div>`;

  if (c.type === 'search') {
    h += `<div class="prop"><label>Placeholder</label><input type="text" value="${c.ph||''}" oninput="p('ph',this.value)"></div>`;
    h += `<div class="prop"><label>Texto botón</label><input type="text" value="${c.btnlabel||'Buscar'}" oninput="p('btnlabel',this.value)"></div>`;
    h += `<div class="prop"><label>Color botón</label><div class="pc"><input type="color" value="${c.btnbg||'#4a7af7'}" oninput="p('btnbg',this.value)"><input type="color" value="${c.btnc||'#ffffff'}" oninput="p('btnc',this.value)"><span style="font-size:10px;color:#666">texto</span></div></div>`;
  }
  if (c.type === 'sel') {
    h += `<div class="prop"><label>Opciones (una por línea)</label><textarea oninput="p('opts',this.value)">${c.opts||''}</textarea></div>`;
    h += `<div class="prop"><label>Índice visible</label><input type="number" min="0" value="${c.si||0}" oninput="p('si',+this.value)"></div>`;
    h += `<div class="prop"><label>Color flecha</label><div class="pc"><input type="color" value="${c.arrbg||'#e8eaee'}" oninput="p('arrbg',this.value)"></div></div>`;
  }
  if (c.type === 'rad') {
    h += `<div class="prop"><label>Opciones (una por línea)</label><textarea oninput="p('opts',this.value)">${c.opts||''}</textarea></div>`;
    h += `<div class="prop"><label>Opción seleccionada</label><input type="number" min="0" value="${c.si||0}" oninput="p('si',+this.value)"></div>`;
  }
  if (c.type === 'chk')
    h += `<div class="prop"><label><input type="checkbox" ${c.checked?'checked':''} onchange="p('checked',this.checked)"> Marcado</label></div>`;
  if (c.type === 'alert')
    h += `<div class="prop"><label>Tipo</label><select onchange="p('variant',this.value);p('bg','');p('bc','');p('tc','')"><option ${(c.variant||'info')==='info'?'selected':''} value="info">ℹ Info</option><option ${c.variant==='success'?'selected':''} value="success">✓ Éxito</option><option ${c.variant==='warning'?'selected':''} value="warning">⚠ Aviso</option><option ${c.variant==='error'?'selected':''} value="error">✕ Error</option></select></div>`;

  if (c.type === 'slide') {
    h += `<div class="prop"><label>Etiqueta</label><input type="text" value="${c.label||''}" oninput="p('label',this.value)"></div>`;
    h += `<div class="pr"><div class="prop"><label>Mín</label><input type="number" value="${c.min}" oninput="p('min',+this.value)"></div><div class="prop"><label>Máx</label><input type="number" value="${c.max}" oninput="p('max',+this.value)"></div></div>`;
    h += `<div class="prop"><label>Valor</label><input type="number" value="${c.val}" oninput="p('val',+this.value)"></div>`;
    h += `<div class="prop"><label>Color relleno</label><div class="pc"><input type="color" value="${c.ac||'#7c6af7'}" oninput="p('ac',this.value)"></div></div>`;
    h += `<div class="prop"><label>Color pista</label><div class="pc"><input type="color" value="${c.trackbg||'#e0e0e0'}" oninput="p('trackbg',this.value)"></div></div>`;
    h += `<div class="prop"><label><input type="checkbox" ${c.showlimits!==false?'checked':''} onchange="p('showlimits',this.checked)"> Mostrar mín/máx</label></div>`;
  }
  if (c.type === 'prog') {
    h += `<div class="prop"><label>Etiqueta</label><input type="text" value="${c.label||''}" oninput="p('label',this.value)"></div>`;
    h += `<div class="prop"><label>Valor (0–100)</label><input type="number" min="0" max="100" value="${c.val||0}" oninput="p('val',+this.value)"></div>`;
    h += `<div class="prop"><label>Color relleno</label><div class="pc"><input type="color" value="${c.ac||'#4a7af7'}" oninput="p('ac',this.value)"></div></div>`;
    h += `<div class="prop"><label>Color pista</label><div class="pc"><input type="color" value="${c.trackbg||'#e5e7eb'}" oninput="p('trackbg',this.value)"></div></div>`;
    h += `<div class="prop"><label><input type="checkbox" ${c.showval!==false?'checked':''} onchange="p('showval',this.checked)"> Mostrar porcentaje</label></div>`;
  }
  if (c.type === 'pgn') {
    h += `<div class="pr"><div class="prop"><label>Total páginas</label><input type="number" min="1" max="20" value="${c.total||5}" oninput="p('total',+this.value)"></div><div class="prop"><label>Página actual</label><input type="number" min="1" value="${c.si||1}" oninput="p('si',+this.value)"></div></div>`;
    h += `<div class="prop"><label>Color activo</label><div class="pc"><input type="color" value="${c.ac||'#4a7af7'}" oninput="p('ac',this.value)"></div></div>`;
  }
  if (c.type === 'nav') {
    h += `<div class="prop"><label>Logo</label><input type="text" value="${c.logo||'Logo'}" oninput="p('logo',this.value)"></div>`;
    h += `<div class="prop"><label>Items (uno por línea)</label><textarea oninput="p('items',this.value)">${c.items||''}</textarea></div>`;
    h += `<div class="prop"><label>Item activo (0=primero)</label><input type="number" min="0" value="${c.si||0}" oninput="p('si',+this.value)"></div>`;
    h += `<div class="prop"><label>Color activo</label><div class="pc"><input type="color" value="${c.ac||'#4a7af7'}" oninput="p('ac',this.value)"></div></div>`;
    h += `<div class="prop"><label>Color logo</label><div class="pc"><input type="color" value="${c.lc||'#1a1a2e'}" oninput="p('lc',this.value)"></div></div>`;
  }
  if (c.type === 'btn') {
    h += `<div class="prop"><label>Tamaño fuente</label><input type="number" min="8" max="36" value="${c.fs||13}" oninput="p('fs',+this.value)"></div>`;
    h += `<div class="prop"><label>Borde redondeado</label><input type="number" min="0" max="50" value="${c.br||4}" oninput="p('br',+this.value)"></div>`;
  }
  if (['lbl','h1','badge'].includes(c.type))
    h += `<div class="prop"><label>Tamaño fuente</label><input type="number" min="8" max="60" value="${c.fs||13}" oninput="p('fs',+this.value)"></div>`;

  if (c.type === 'tbl') {
    h += `<div class="pr"><div class="prop"><label>Columnas</label><input type="number" min="1" max="10" value="${c.cols||3}" oninput="p('cols',Math.max(1,+this.value))"></div><div class="prop"><label>Filas</label><input type="number" min="1" max="30" value="${c.rows||4}" oninput="p('rows',Math.max(1,+this.value))"></div></div>`;
    h += `<div class="prop"><label>Encabezados (uno/línea)</label><textarea oninput="p('hdrs',this.value)">${c.hdrs||''}</textarea></div>`;
    h += `<div class="prop"><label>Color encabezado</label><div class="pc"><input type="color" value="${c.hbg||'#e8eaf0'}" oninput="p('hbg',this.value)"><input type="color" value="${c.hc||'#333333'}" oninput="p('hc',this.value)"><span style="font-size:10px;color:#666">texto</span></div></div>`;
    h += `<div class="prop"><label>Color borde</label><div class="pc"><input type="color" value="${c.bcolor||'#cccccc'}" oninput="p('bcolor',this.value)"></div></div>`;
    h += `<div class="prop"><label>Alineación</label><select onchange="p('balign',this.value)"><option value="left" ${(c.balign||'left')==='left'?'selected':''}>← Izquierda</option><option value="center" ${c.balign==='center'?'selected':''}>↔ Centro</option><option value="right" ${c.balign==='right'?'selected':''}>→ Derecha</option></select></div>`;
    h += `<div class="prop"><label>Densidad</label><select onchange="p('density',this.value)"><option value="compact" ${c.density==='compact'?'selected':''}>Compacta</option><option value="normal" ${c.density==='normal'?'selected':''}>Normal</option><option value="spacious" ${(c.density||'spacious')==='spacious'?'selected':''}>Espaciada</option></select></div>`;
    h += `<div class="prop"><label>Tamaño fuente</label><input type="number" min="9" max="18" value="${c.fsize||12}" oninput="p('fsize',+this.value)"></div>`;
    h += `<div class="prop"><label><input type="checkbox" ${c.striped?'checked':''} onchange="p('striped',this.checked)"> Filas alternas</label></div>`;
    if (c.striped) h += `<div class="prop"><label>Color alterna</label><div class="pc"><input type="color" value="${c.sbg||'#f5f6fa'}" oninput="p('sbg',this.value)"></div></div>`;
    h += `<div class="prop"><label><input type="checkbox" ${c.shownums?'checked':''} onchange="p('shownums',this.checked)"> Columna # nums</label></div>`;
    h += `<div class="prop"><label><input type="checkbox" ${c.showtotal?'checked':''} onchange="p('showtotal',this.checked)"> Fila de totales</label></div>`;
    if (c.showtotal) {
      h += `<div class="prop"><label>Etiqueta total</label><input type="text" value="${c.totalrow||'Total'}" oninput="p('totalrow',this.value)"></div>`;
      h += `<div class="prop"><label>Color fila total</label><div class="pc"><input type="color" value="${c.totalbg||'#fffbe6'}" oninput="p('totalbg',this.value)"></div></div>`;
    }
  }
  if (c.type === 'card')
    h += `<div class="prop"><label>Color cabecera</label><div class="pc"><input type="color" value="${c.hbg||'#f5f6fa'}" oninput="p('hbg',this.value)"></div></div>`;
  if (c.type === 'box') {
    h += `<div class="prop"><label>Color borde</label><div class="pc"><input type="color" value="${c.bc||'#b0bfdf'}" oninput="p('bc',this.value)"></div></div>`;
    h += `<div class="prop"><label>Estilo borde</label><select onchange="p('bs',this.value)"><option ${c.bs==='dashed'?'selected':''}>dashed</option><option ${c.bs==='solid'?'selected':''}>solid</option><option ${c.bs==='dotted'?'selected':''}>dotted</option></select></div>`;
    h += `<div class="prop"><label>Grosor</label><input type="number" min="1" max="8" value="${c.bw||2}" oninput="p('bw',+this.value)"></div>`;
  }
  if (c.type === 'sep') {
    h += `<div class="prop"><label>Color</label><div class="pc"><input type="color" value="${c.lc||'#dddddd'}" oninput="p('lc',this.value)"></div></div>`;
    h += `<div class="prop"><label>Estilo</label><select onchange="p('ls',this.value)"><option ${c.ls==='solid'?'selected':''}>solid</option><option ${c.ls==='dashed'?'selected':''}>dashed</option><option ${c.ls==='dotted'?'selected':''}>dotted</option></select></div>`;
    h += `<div class="prop"><label>Grosor</label><input type="number" min="1" max="8" value="${c.lw||2}" oninput="p('lw',+this.value)"></div>`;
  }
  if (c.type === 'icon') {
    h += `<div class="prop"><label>Ícono</label><div class="icon-grid">${ICONS.map(ic => `<div class="icon-opt ${c.icon===ic?'on':''}" onclick="p('icon','${ic}')" title="${ic}">${ic}</div>`).join('')}</div></div>`;
    h += `<div class="prop"><label>Tamaño</label><input type="number" min="12" max="96" value="${c.fs||24}" oninput="p('fs',+this.value)"></div>`;
    h += `<div class="prop"><label>Color</label><div class="pc"><input type="color" value="${c.tc||'#555555'}" oninput="p('tc',this.value)"></div></div>`;
    const bgV2 = c.bg === 'transparent' ? '#ffffff' : (c.bg || '#ffffff');
    h += `<div class="prop"><label>Fondo</label><div class="pc"><input type="color" id="pp-bg" value="${bgV2}" oninput="p('bg',this.value)"><label><input type="checkbox" ${c.bg==='transparent'?'checked':''} onchange="p('bg',this.checked?'transparent':document.getElementById('pp-bg').value)"> Transp.</label></div></div>`;
  }
  if (c.type === 'imgph') {
    h += `<div class="prop"><label>Color fondo</label><div class="pc"><input type="color" value="${c.bg||'#f0f0f0'}" oninput="p('bg',this.value)"></div></div>`;
    h += `<div class="prop"><label>Color borde</label><div class="pc"><input type="color" value="${c.bc||'#cccccc'}" oninput="p('bc',this.value)"></div></div>`;
    h += `<div class="prop"><label>Color líneas X</label><div class="pc"><input type="color" value="${c.lc||'#cccccc'}" oninput="p('lc',this.value)"></div></div>`;
  }
  if (c.type === 'arr') {
    h += `<div class="prop"><label>Etiqueta</label><input type="text" value="${c.label||''}" oninput="p('label',this.value)"></div>`;
    h += `<div class="prop"><label>Dirección</label><div class="dir-grid">${[['nw','↖'],['up','↑'],['ne','↗'],['left','←'],['','·'],['right','→'],['sw','↙'],['down','↓'],['se','↘']].map(([d,s]) => d ? `<button class="dir-btn ${(c.dir||'right')===d?'on':''}" onclick="p('dir','${d}')">${s}</button>` : `<div class="dir-dot">·</div>`).join('')}</div></div>`;
    h += `<div class="prop"><label>Color</label><div class="pc"><input type="color" value="${c.ac||'#e94560'}" oninput="p('ac',this.value)"></div></div>`;
    h += `<div class="prop"><label>Grosor</label><input type="number" min="1" max="10" value="${c.lw||2}" oninput="p('lw',+this.value)"></div>`;
    h += `<div class="prop"><label><input type="checkbox" ${c.dashed?'checked':''} onchange="p('dashed',this.checked)"> Discontinua</label></div>`;
    h += `<div class="prop"><label><input type="checkbox" ${c.bidir?'checked':''} onchange="p('bidir',this.checked)"> Bidireccional</label></div>`;
  }
  if (!['sep','arr','imgph','alert','icon'].includes(c.type)) {
    const bgV = c.bg === 'transparent' ? '#ffffff' : (c.bg || '#ffffff');
    h += `<div class="prop"><label>Color fondo</label><div class="pc"><input type="color" id="pp-bg" value="${bgV}" oninput="p('bg',this.value)"><label><input type="checkbox" ${c.bg==='transparent'?'checked':''} onchange="p('bg',this.checked?'transparent':document.getElementById('pp-bg').value)"> Transp.</label></div></div>`;
    h += `<div class="prop"><label>Color texto</label><div class="pc"><input type="color" value="${c.tc||'#333333'}" oninput="p('tc',this.value)"></div></div>`;
  }
  h += `<hr class="pdiv">`;
  h += `<div class="prop"><label>Capa</label><input type="number" min="1" value="${c.z||1}" oninput="p('z',+this.value,1)"></div>`;
  h += `<div class="prop"><label><input type="checkbox" ${c.locked?'checked':''} onchange="p('locked',this.checked)"> 📌 Anclar capa (no sube al frente)</label></div>`;
  h += `<hr class="pdiv"><button class="pbtn sec" onclick="copyComp()">⎘ Copiar (Ctrl+C)</button><button class="pbtn sec" onclick="dupComp()">⧉ Duplicar</button><button class="pbtn sec" onclick="front()">↑ Al frente</button><button class="pbtn del" onclick="delComp()">✕ Eliminar</button>`;
  $pb.innerHTML = h;
}

function renderMultiProps() {
  const n = S.multiSel.size;
  let h = `<div style="font-size:11px;color:#aaa;margin-bottom:12px;"><b style="color:#ccc;">${n} elementos</b> seleccionados<br><span style="font-size:10px;color:#555;">Shift+clic para añadir/quitar</span></div>`;
  h += `<div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;">Alinear horizontal</div>`;
  h += `<div class="align-grid"><button class="align-btn" onclick="alignComps('left')" title="Alinear borde izquierdo">⇤ Izq.</button><button class="align-btn" onclick="alignComps('cH')" title="Centrar eje horizontal">↔ Cen.</button><button class="align-btn" onclick="alignComps('right')" title="Alinear borde derecho">⇥ Der.</button></div>`;
  h += `<div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;margin-top:8px;">Alinear vertical</div>`;
  h += `<div class="align-grid"><button class="align-btn" onclick="alignComps('top')" title="Alinear borde superior">↑ Top</button><button class="align-btn" onclick="alignComps('cV')" title="Centrar eje vertical">↕ Med.</button><button class="align-btn" onclick="alignComps('bottom')" title="Alinear borde inferior">↓ Bot.</button></div>`;
  if (n >= 3) {
    h += `<div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;margin-top:8px;">Distribuir</div>`;
    h += `<div class="pr"><div class="prop"><button class="align-btn" onclick="distrib('h')" style="width:100%">↔ Horizontal</button></div><div class="prop"><button class="align-btn" onclick="distrib('v')" style="width:100%">↕ Vertical</button></div></div>`;
  }
  h += `<hr class="pdiv"><button class="pbtn sec" onclick="dupMulti()">⧉ Duplicar selección</button><button class="pbtn del" onclick="delMulti()">✕ Eliminar selección</button>`;
  $pb.innerHTML = h;
}

function p(key, val, isPos) {
  const c = cc().find(x => x.id === S.sel); if (!c) return;
  if (isPos) val = parseFloat(val) || 0;

  // Table: auto-resize component when adding columns or rows
  if (c.type === 'tbl') {
    if (key === 'cols') {
      const delta = val - (c.cols || 3);
      c.width = Math.max(120, c.width + delta * 90);
      const pw = document.getElementById('pp-w'); if (pw) pw.value = Math.round(c.width);
    }
    if (key === 'rows') {
      const delta = val - (c.rows || 4);
      c.height = Math.max(40, c.height + delta * 34);
      const ph = document.getElementById('pp-h'); if (ph) ph.value = Math.round(c.height);
    }
  }

  c[key] = val; patch(c); dSnap();
}

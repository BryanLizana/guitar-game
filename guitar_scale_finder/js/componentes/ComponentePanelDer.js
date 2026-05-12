// S: única responsabilidad — renderizado del panel derecho (detector y mapa de escala)
(function () {
  const { NOTAS, COLORES_GRADO } = window.GuitarScaleFinder.Constantes;
  const { SUFMAP } = window.GuitarScaleFinder.Acordes;

  // ── Highlight y banner ────────────────────────────────────────────────────

  function aplicarHighlight(acordeSet) {
    document.querySelectorAll('#panel-contenido .nota-pto').forEach(pto => {
      const celda = pto.closest('[data-ni]');
      if (!celda) return;
      const ni = +celda.dataset.ni;
      pto.classList.toggle('dim', !!acordeSet && !acordeSet.has(ni));
    });
  }

  function eliminarBanner() {
    const b = document.getElementById('acorde-banner-el');
    if (b) b.remove();
  }

  function actualizarBanner(nombre, notasIdx, color, segundos) {
    let banner = document.getElementById('acorde-banner-el');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'acorde-banner-el';
      banner.className = 'acorde-banner';
      const mastil = document.querySelector('#panel-contenido .mastil-wrap');
      if (mastil) mastil.after(banner);
      else document.getElementById('panel-contenido').appendChild(banner);
    }
    const notas = [...notasIdx].map(i => NOTAS[i]);
    banner.innerHTML = `
      <span class="acorde-banner-nom" style="color:${color}">${nombre}</span>
      <div class="acorde-notas-row">${notas.map(n => `<span class="nota-badge" style="border-color:${color}">${n}</span>`).join('')}</div>
      <span class="banner-timer">${segundos}s</span>`;
  }

  function sincronizarSwitch() {
    const sw = document.getElementById('sw-mastil');
    if (!sw) return;
    const { mostrarEnMastil } = window.GuitarScaleFinder.EstadoApp;
    sw.style.background = mostrarEnMastil ? 'var(--acento2)' : 'var(--borde)';
    const thumb = sw.querySelector('.sw-thumb');
    if (thumb) thumb.style.left = mostrarEnMastil ? '18px' : '3px';
  }

  function limpiarHighlight() {
    const estado = window.GuitarScaleFinder.EstadoApp;
    clearTimeout(estado.acorDeHighlightTimer);
    clearInterval(estado.hlCountdownInterval);
    estado.hlAcordeIdx = null;
    estado.acordeDiatSel = null;
    estado.acordeDiatColor = null;
    aplicarHighlight(null);
    eliminarBanner();
    document.querySelectorAll('#panel-contenido .diat-item').forEach(el => el.classList.remove('activo'));
  }

  // ── Vista Detector ────────────────────────────────────────────────────────

  function generarHtmlResultados(notasSet, posSelec) {
    const { identificarAcordeDesdeNotas, sugerirAcordeCercano } = window.GuitarScaleFinder.ServicioTeoria;
    const acordes = identificarAcordeDesdeNotas(notasSet);
    let h = '';
    if (!notasSet.size) return h;
    h += `<div class="panel-res"><p class="res-notas">Notas: ${[...notasSet].map(i => NOTAS[i]).join(' · ')}</p>`;
    if (posSelec.size < 3) {
      h += '<p class="res-sin">Selecciona al menos 3 cuerdas.</p>';
    } else if (acordes.length) {
      h += '<p class="res-tit">Acordes identificados:</p><div class="acordes-det">';
      acordes.slice(0, 6).forEach(ac => {
        h += `<div class="ac-card ${ac.esExacto ? 'exacto' : 'parcial'}">
          <div class="ac-fila-top">
            <span class="ac-nom">${ac.nombre}</span>
            <span class="ac-tipo">${ac.esExacto ? '✓ exacto' : '~ parcial'}</span>
            <button class="btn-ag-det" data-acorde="${ac.nombre}">+ Lista</button>
          </div>
          <div class="ac-notas-det">${ac.notasAcorde.join(' · ')}</div>
        </div>`;
      });
      h += '</div>';
    } else {
      const sugeridos = sugerirAcordeCercano(notasSet);
      if (sugeridos.length) {
        h += '<p class="res-tit">¿Quisiste decir...?</p><div class="acordes-det">';
        sugeridos.forEach(s => {
          h += `<div class="ac-card sugerencia">
            <div class="ac-fila-top">
              <span class="ac-nom">${s.nombre}</span>
              <span class="ac-tipo sug-falta">falta: <b>${s.faltantes.join(', ')}</b></span>
            </div>
            <div class="ac-notas-det">${s.notasAcorde.join(' · ')}</div>
          </div>`;
        });
        h += '</div>';
      } else {
        h += '<p class="res-sin">Combinación no estándar.</p>';
      }
    }
    return h + '</div>';
  }

  function vincularEventosDetector(contenedor) {
    const { ServicioAudio, EstadoApp } = window.GuitarScaleFinder;
    const { generarHtmlMastil } = window.GuitarScaleFinder.ComponenteMastil;

    contenedor.querySelector('.btn-sec').addEventListener('click', () => {
      window.GuitarScaleFinder.ControladorApp.limpiarMastil();
    });

    contenedor.querySelector('.mastil-body').addEventListener('click', e => {
      const celda = e.target.closest('[data-c]');
      if (!celda) return;
      const c = celda.dataset.c;
      const t = +celda.dataset.t;
      const ni = +celda.dataset.ni;
      const key = `${c}-${t}`;
      if (EstadoApp.posSelec.has(key)) {
        EstadoApp.posSelec.delete(key);
      } else {
        for (const k of [...EstadoApp.posSelec.keys()]) {
          if (k.startsWith(`${c}-`)) EstadoApp.posSelec.delete(k);
        }
        EstadoApp.posSelec.set(key, { notaIdx: ni });
        const pto = celda.querySelector('.nota-pto');
        if (pto) {
          const ripple = document.createElement('div');
          ripple.className = 'sound-ripple';
          ripple.style.background = '#ffd700';
          celda.appendChild(ripple);
          setTimeout(() => ripple.remove(), 500);
        }
        ServicioAudio.reproducirNota(+c, t);
      }
      renderizarDetector(contenedor);
    });

    contenedor.addEventListener('click', e => {
      const btn = e.target.closest('.btn-ag-det');
      if (btn) window.GuitarScaleFinder.ControladorApp.agregarDetectado(btn.dataset.acorde);
    });
  }

  function renderizarDetector(contenedor) {
    const { EstadoApp } = window.GuitarScaleFinder;
    const { generarHtmlMastil } = window.GuitarScaleFinder.ComponenteMastil;
    const notasSet = new Set();
    EstadoApp.posSelec.forEach(({ notaIdx }) => notasSet.add(notaIdx));

    let h = `<div class="det-barra">
      <p class="det-instr">Toca el mástil · una nota por cuerda</p>
      <button class="btn-sec">Limpiar</button>
    </div>`;
    h += generarHtmlMastil(EstadoApp.posSelec, [], true);
    h += generarHtmlResultados(notasSet, EstadoApp.posSelec);

    contenedor.innerHTML = h;
    vincularEventosDetector(contenedor);
  }

  // ── Vista Mapa ────────────────────────────────────────────────────────────

  function generarHtmlControlesMapa(tonica, tipoEsc) {
    const { TIPOS_ESCALA } = window.GuitarScaleFinder.Escalas;
    return `<div class="mapa-ctrl">
      <div class="ctrl-grp">
        <label class="ctrl-lab">Tónica</label>
        <select class="ctrl-sel" id="sel-ton">${NOTAS.map(n => `<option${n === tonica ? ' selected' : ''}>${n}</option>`).join('')}</select>
      </div>
      <div class="ctrl-grp">
        <label class="ctrl-lab">Escala</label>
        <select class="ctrl-sel" id="sel-esc">${Object.entries(TIPOS_ESCALA).map(([k, e]) => `<option value="${k}"${k === tipoEsc ? ' selected' : ''}>${e.nombre}</option>`).join('')}</select>
      </div>
      <button class="btn-play" id="btn-play-scale">▶ Escuchar escala</button>
      <label class="sw-label">
        <span>Ver en mástil</span>
        <span id="sw-mastil" class="sw-track" style="background:var(--borde)">
          <span class="sw-thumb" style="left:3px"></span>
        </span>
      </label>
    </div>`;
  }

  function generarHtmlAcordesDiatonicos(escala, ti) {
    if (!escala.acordesDiat) return '';
    let h = `<div class="diat-box"><p class="diat-tit">Acordes diatónicos <span style="color:var(--txt2);font-size:10px">— toca para escuchar</span></p><div class="diat-lista" id="diat-lista">`;
    escala.intervalos.forEach((intervalo, i) => {
      const ri = (ti + intervalo) % 12;
      const suf = SUFMAP[escala.acordesDiat[i]] ?? '';
      const nombre = `${NOTAS[ri]}${suf}`;
      h += `<div class="diat-item" style="border-color:${COLORES_GRADO[i]}" data-acorde="${nombre}" data-color="${COLORES_GRADO[i]}">
        <span class="diat-grado" style="color:${COLORES_GRADO[i]}">${escala.grados[i]}</span>
        <span class="diat-nom">${nombre}</span>
      </div>`;
    });
    return h + '</div></div>';
  }

  function generarHtmlProgresiones(escala, ti, tonicaNombre) {
    const { TIPOS_ESCALA } = window.GuitarScaleFinder.Escalas;
    const { PROGS_REGIONALES } = window.GuitarScaleFinder.Progresiones;
    const { obtenerAcordesDesdeGrados } = window.GuitarScaleFinder.ServicioMapa;
    let contenido = '';

    if (escala.progresiones && escala.progresiones.length) {
      contenido += `<p class="prog-grupo-tit">🎵 ${escala.nombre}</p>`;
      escala.progresiones.forEach(p => {
        let acordesReales;
        if (p.manual) {
          acordesReales = p.acordes;
        } else {
          acordesReales = p.grados.map(g => {
            const idx = ((g % escala.intervalos.length) + escala.intervalos.length) % escala.intervalos.length;
            const ri = (ti + escala.intervalos[idx]) % 12;
            return `${NOTAS[ri]}${SUFMAP[escala.acordesDiat[idx]] ?? ''}`;
          });
        }
        contenido += `<div class="prog-item" data-acordes="${acordesReales.join(',')}">
          <div class="prog-nombre">${p.nombre}</div>
          <div class="prog-grados">${p.txt}</div>
          <div class="prog-ejemplo">▶ ${acordesReales.join(' – ')}</div>
        </div>`;
      });
    }

    Object.values(PROGS_REGIONALES).forEach(region => {
      contenido += `<p class="prog-grupo-tit">${region.label}</p>`;
      region.progs.forEach(p => {
        const acordesReales = obtenerAcordesDesdeGrados(p.grados, ti);
        contenido += `<div class="prog-item" data-acordes="${acordesReales.join(',')}">
          <div class="prog-nombre">${p.nombre}</div>
          <div class="prog-grados">${p.txt}</div>
          <div class="prog-ejemplo">▶ ${acordesReales.join(' – ')}</div>
        </div>`;
      });
    });

    if (!contenido) return '';
    return `<div class="prog-box"><p class="prog-tit">🌍 Progresiones en ${tonicaNombre}</p>${contenido}</div>`;
  }

  function vincularEventosMapa(contenedor, posicionesDestacadas) {
    const { ServicioAudio, EstadoApp } = window.GuitarScaleFinder;
    const { obtenerNotasAcorde } = window.GuitarScaleFinder.ServicioTeoria;

    document.getElementById('sel-ton').addEventListener('change', e => {
      EstadoApp.tonica = e.target.value;
      renderizarMapa(contenedor);
    });
    document.getElementById('sel-esc').addEventListener('change', e => {
      EstadoApp.tipoEsc = e.target.value;
      renderizarMapa(contenedor);
    });
    document.getElementById('btn-play-scale').addEventListener('click', function () {
      ServicioAudio.reproducirEscala(posicionesDestacadas, this);
    });
    document.getElementById('sw-mastil').addEventListener('click', () => {
      EstadoApp.mostrarEnMastil = !EstadoApp.mostrarEnMastil;
      if (!EstadoApp.mostrarEnMastil) limpiarHighlight();
      sincronizarSwitch();
    });

    contenedor.querySelector('.mastil-body').addEventListener('click', e => {
      const celda = e.target.closest('[data-c]');
      if (!celda) return;
      const pto = celda.querySelector('.nota-pto');
      if (!pto) return;
      const ripple = document.createElement('div');
      ripple.className = 'sound-ripple';
      ripple.style.background = pto.style.background || '#fff';
      celda.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
      ServicioAudio.reproducirNota(+celda.dataset.c, +celda.dataset.t);
    });

    const listaDiat = contenedor.querySelector('#diat-lista');
    if (listaDiat) {
      listaDiat.addEventListener('click', e => {
        const item = e.target.closest('[data-acorde]');
        if (!item) return;
        const nombre = item.dataset.acorde;
        const color = item.dataset.color;
        limpiarHighlight();
        const notasIdx = obtenerNotasAcorde(nombre);
        ServicioAudio.reproducirAcorde(notasIdx);
        if (EstadoApp.mostrarEnMastil) {
          EstadoApp.acordeDiatSel = nombre;
          EstadoApp.acordeDiatColor = color;
          EstadoApp.hlAcordeIdx = notasIdx;
          item.classList.add('activo');
          aplicarHighlight(EstadoApp.hlAcordeIdx);
          let seg = 35;
          actualizarBanner(nombre, EstadoApp.hlAcordeIdx, color, seg);
          EstadoApp.hlCountdownInterval = setInterval(() => {
            seg--;
            actualizarBanner(nombre, EstadoApp.hlAcordeIdx, color, seg);
          }, 1000);
          EstadoApp.acorDeHighlightTimer = setTimeout(() => limpiarHighlight(), 5000);
        }
      });
    }

    contenedor.querySelectorAll('.prog-item').forEach(el => {
      el.addEventListener('click', () => {
        if (el.classList.contains('tocando')) { ServicioAudio.detenerProgresion(); return; }
        ServicioAudio.reproducirProgresion(el.dataset.acordes.split(','), el);
      });
    });
  }

  function renderizarMapa(contenedor) {
    limpiarHighlight();
    const { EstadoApp } = window.GuitarScaleFinder;
    const { TIPOS_ESCALA } = window.GuitarScaleFinder.Escalas;
    const { generarHtmlMastil } = window.GuitarScaleFinder.ComponenteMastil;
    const { generarMapa } = window.GuitarScaleFinder.ServicioMapa;

    const escala = TIPOS_ESCALA[EstadoApp.tipoEsc];
    const ti = NOTAS.indexOf(EstadoApp.tonica);
    const posicionesDestacadas = generarMapa(EstadoApp.tonica, EstadoApp.tipoEsc);

    let h = generarHtmlControlesMapa(EstadoApp.tonica, EstadoApp.tipoEsc);
    h += generarHtmlMastil(new Map(), posicionesDestacadas, true);

    h += '<div class="leyenda">';
    escala.grados.forEach((g, i) => {
      h += `<div class="ley-item"><div class="ley-col" style="background:${COLORES_GRADO[i]}"></div><span class="ley-txt">${g}${i === 0 ? ' (' + EstadoApp.tonica + ')' : ''}</span></div>`;
    });
    h += '</div>';

    h += generarHtmlAcordesDiatonicos(escala, ti);
    h += generarHtmlProgresiones(escala, ti, EstadoApp.tonica);

    contenedor.innerHTML = h;
    sincronizarSwitch();
    vincularEventosMapa(contenedor, posicionesDestacadas);
  }

  // ── Panel derecho ─────────────────────────────────────────────────────────

  function renderizarPanelDerecho() {
    const { EstadoApp } = window.GuitarScaleFinder;
    document.getElementById('tab-det').classList.toggle('tab-on', EstadoApp.modo === 'detector');
    document.getElementById('tab-map').classList.toggle('tab-on', EstadoApp.modo === 'mapa');
    const contenedor = document.getElementById('panel-contenido');
    if (EstadoApp.modo === 'detector') renderizarDetector(contenedor);
    else renderizarMapa(contenedor);
  }

  window.GuitarScaleFinder.ComponentePanelDer = {
    renderizarPanelDerecho,
    renderizarDetector,
    renderizarMapa,
    limpiarHighlight,
  };
})();

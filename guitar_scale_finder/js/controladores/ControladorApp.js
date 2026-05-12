// S: única responsabilidad — acciones del usuario y enlace de eventos estáticos
// D: depende de abstracciones de componentes y servicios, no de DOM directamente
(function () {

  // ── Acciones ──────────────────────────────────────────────────────────────

  function agregarAcorde(texto) {
    const { EstadoApp } = window.GuitarScaleFinder;
    const { parsearAcorde } = window.GuitarScaleFinder.ServicioTeoria;
    const partes = texto.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    const invalidos = [];
    let agregados = 0;
    partes.forEach(p => {
      const pa = parsearAcorde(p);
      if (pa) {
        if (!EstadoApp.listaAcordes.includes(pa.nombre)) EstadoApp.listaAcordes.push(pa.nombre);
        agregados++;
      } else {
        invalidos.push(p);
      }
    });
    const err = document.getElementById('err-msg');
    if (invalidos.length) {
      err.textContent = `No válido: ${invalidos.map(v => `"${v}"`).join(', ')}`;
      err.hidden = false;
    } else {
      err.hidden = true;
    }
    if (agregados) document.getElementById('inp-acorde').value = '';
    window.GuitarScaleFinder.ComponentePanelIzq.renderizarPanelIzquierdo();
  }

  function eliminarAcorde(nombre) {
    const { EstadoApp } = window.GuitarScaleFinder;
    EstadoApp.listaAcordes = EstadoApp.listaAcordes.filter(x => x !== nombre);
    window.GuitarScaleFinder.ComponentePanelIzq.renderizarPanelIzquierdo();
  }

  function limpiarMastil() {
    window.GuitarScaleFinder.EstadoApp.posSelec.clear();
    window.GuitarScaleFinder.ComponentePanelDer.renderizarPanelDerecho();
  }

  function agregarDetectado(nombre) {
    const { EstadoApp } = window.GuitarScaleFinder;
    const { parsearAcorde } = window.GuitarScaleFinder.ServicioTeoria;
    const p = parsearAcorde(nombre);
    if (p && !EstadoApp.listaAcordes.includes(p.nombre)) EstadoApp.listaAcordes.push(p.nombre);
    EstadoApp.posSelec.clear();
    window.GuitarScaleFinder.ComponentePanelIzq.renderizarPanelIzquierdo();
    window.GuitarScaleFinder.ComponentePanelDer.renderizarPanelDerecho();
  }

  function verMapa(tonica, tipo) {
    const { EstadoApp } = window.GuitarScaleFinder;
    EstadoApp.tonica = tonica;
    EstadoApp.tipoEsc = tipo;
    EstadoApp.modo = 'mapa';
    window.GuitarScaleFinder.ComponentePanelDer.renderizarPanelDerecho();
    cerrarPanelMovil();
  }

  function cambiarModo(modo) {
    window.GuitarScaleFinder.ComponentePanelDer.limpiarHighlight();
    window.GuitarScaleFinder.EstadoApp.modo = modo;
    window.GuitarScaleFinder.ComponentePanelDer.renderizarPanelDerecho();
  }

  function cerrarPanelMovil() {
    document.getElementById('panel-izq').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
  }

  // ── Eventos estáticos (DOM siempre presente) ──────────────────────────────

  function vincularEventosEstaticos() {
    document.getElementById('btn-menu').addEventListener('click', () => {
      document.getElementById('panel-izq').classList.toggle('open');
      document.getElementById('overlay').classList.toggle('open');
    });
    document.getElementById('overlay').addEventListener('click', cerrarPanelMovil);

    document.getElementById('inp-acorde').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const valor = e.target.value.trim();
        if (valor) agregarAcorde(valor);
      }
    });
    document.getElementById('btn-add').addEventListener('click', () => {
      const valor = document.getElementById('inp-acorde').value.trim();
      if (valor) agregarAcorde(valor);
    });
    document.getElementById('btn-clear-list').addEventListener('click', () => {
      window.GuitarScaleFinder.EstadoApp.listaAcordes = [];
      window.GuitarScaleFinder.ComponentePanelIzq.renderizarPanelIzquierdo();
    });

    document.getElementById('tab-det').addEventListener('click', () => cambiarModo('detector'));
    document.getElementById('tab-map').addEventListener('click', () => cambiarModo('mapa'));

    // Delegación para chips y escalas (panel izquierdo — estable en DOM)
    document.getElementById('chips').addEventListener('click', e => {
      const btn = e.target.closest('.chip-del');
      if (btn) eliminarAcorde(btn.dataset.acorde);
    });
    document.getElementById('escalas-lista').addEventListener('click', e => {
      const item = e.target.closest('.esc-item');
      if (item) verMapa(item.dataset.tonica, item.dataset.tipo);
    });
  }

  window.GuitarScaleFinder.ControladorApp = {
    agregarAcorde,
    eliminarAcorde,
    limpiarMastil,
    agregarDetectado,
    verMapa,
    cambiarModo,
    cerrarPanelMovil,
    vincularEventosEstaticos,
  };
})();

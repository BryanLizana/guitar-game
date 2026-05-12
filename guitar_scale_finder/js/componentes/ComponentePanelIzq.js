// S: única responsabilidad — renderizado del panel izquierdo (lista de acordes y escalas)
(function () {
  const { EstadoApp, ServicioTeoria } = window.GuitarScaleFinder;

  function generarHtmlChips(listaAcordes) {
    if (!listaAcordes.length) return '<span class="txt-vacio">Agrega acordes o detéctalos →</span>';
    return listaAcordes
      .map(a => `<span class="chip">${a}<button class="chip-del" data-acorde="${a}">×</button></span>`)
      .join('');
  }

  function generarHtmlEscalaItem(e) {
    return `<div class="esc-item" style="border-left-color:${e.color}" data-tonica="${e.tonica}" data-tipo="${e.tipo}">
      <div class="esc-cab">
        <span class="esc-nom">${e.nombre}</span>
        <span class="esc-pct" style="color:${e.color}">${e.porcentaje}%</span>
      </div>
      <div class="esc-barra"><div class="esc-rel" style="width:${e.porcentaje}%;background:${e.color}"></div></div>
      <div class="esc-grados">${e.coin.map(c => `<span class="grado-badge">${c.grado}=${c.acorde}</span>`).join('')}</div>
      <span class="esc-ver">Ver mapa →</span>
    </div>`;
  }

  function renderizarPanelIzquierdo() {
    const { listaAcordes } = window.GuitarScaleFinder.EstadoApp;

    document.getElementById('chips').innerHTML = generarHtmlChips(listaAcordes);
    document.getElementById('btn-clear-list').hidden = !listaAcordes.length;

    const escalas = window.GuitarScaleFinder.ServicioTeoria.detectarEscala(listaAcordes);
    const contenedor = document.getElementById('escalas-lista');
    if (!escalas.length) {
      contenedor.innerHTML = `<span class="txt-vacio">${listaAcordes.length ? 'Sin coincidencias.' : 'Agrega acordes para buscar la escala'}</span>`;
      return;
    }
    contenedor.innerHTML = escalas.map(generarHtmlEscalaItem).join('');
  }

  window.GuitarScaleFinder.ComponentePanelIzq = { renderizarPanelIzquierdo };
})();

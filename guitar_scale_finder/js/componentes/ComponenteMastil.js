// S: única responsabilidad — generación del HTML del mástil de guitarra
(function () {
  const { NOMBRES_CUERDAS, GROSOR_CUERDAS, COLORES_GRADO, NOTAS, AFINACION } = window.GuitarScaleFinder.Constantes;

  const MARCADORES_DOBLES = [12];
  const MARCADORES_SIMPLES = [3, 5, 7, 9];

  function generarMarcadoresPosicion() {
    let h = '<div class="m-row" style="height:18px;margin-bottom:2px"><div class="m-espacio"></div>';
    for (let t = 0; t <= 12; t++) {
      h += '<div class="marc-celda">';
      if (MARCADORES_SIMPLES.includes(t)) h += '<div class="marc-pto"></div>';
      else if (MARCADORES_DOBLES.includes(t)) h += '<div class="marc-pto"></div><div class="marc-pto"></div>';
      h += '</div>';
    }
    return h + '</div>';
  }

  function generarNumerosTraste() {
    let h = '<div class="m-row" style="margin-bottom:3px"><div class="m-espacio"></div>';
    for (let t = 0; t <= 12; t++) h += `<div class="num-traste">${t || ''}</div>`;
    return h + '</div>';
  }

  function generarCelda(c, t, posSelec, mapaDest, clickable) {
    const ni = (AFINACION[c] + t) % 12;
    const key = `${c}-${t}`;
    const seleccionado = posSelec.has(key);
    const destacado = mapaDest.get(key);
    const color = destacado ? COLORES_GRADO[destacado.grado] : seleccionado ? '#ffd700' : null;
    let h = `<div class="m-celda${clickable ? ' clickable' : ''}" data-c="${c}" data-t="${t}" data-ni="${ni}">`;
    if (t > 0) h += '<div class="traste-l"></div>';
    if (color) h += `<div class="nota-pto" style="background:${color};box-shadow:0 0 8px ${color}80"><span class="nota-txt">${destacado ? destacado.notaNom : NOTAS[ni]}</span></div>`;
    return h + '</div>';
  }

  function generarCuerpo(posSelec, mapaDest, clickable) {
    let h = '<div class="mastil-body">';
    for (let c = 5; c >= 0; c--) {
      h += `<div class="m-cuerda"><div class="c-label">${NOMBRES_CUERDAS[c]}</div>`;
      h += `<div class="c-linea" style="height:${GROSOR_CUERDAS[c]}px"></div>`;
      for (let t = 0; t <= 12; t++) h += generarCelda(c, t, posSelec, mapaDest, clickable);
      h += '</div>';
    }
    return h + '</div>';
  }

  function generarHtmlMastil(posSelec, posDestac = [], clickable = true) {
    const mapaDest = new Map(posDestac.map(p => [`${p.cuerda}-${p.traste}`, p]));
    return '<div class="mastil-wrap">'
      + generarMarcadoresPosicion()
      + generarNumerosTraste()
      + generarCuerpo(posSelec, mapaDest, clickable)
      + '</div>';
  }

  window.GuitarScaleFinder.ComponenteMastil = { generarHtmlMastil };
})();

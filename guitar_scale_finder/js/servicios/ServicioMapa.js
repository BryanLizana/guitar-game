// S: única responsabilidad — cálculo de posiciones en el mástil y conversión de grados
(function () {
  const { NOTAS, AFINACION } = window.GuitarScaleFinder.Constantes;
  const { TIPOS_ACORDE } = window.GuitarScaleFinder.Acordes;
  const { TIPOS_ESCALA } = window.GuitarScaleFinder.Escalas;

  function generarMapa(tonicaNombre, tipoEscala, numTrastes = 12) {
    const escala = TIPOS_ESCALA[tipoEscala];
    if (!escala) return [];
    const ti = NOTAS.indexOf(tonicaNombre);
    if (ti < 0) return [];
    const notasEscala = escala.intervalos.map(i => (ti + i) % 12);
    const posiciones = [];
    for (let c = 0; c < 6; c++) {
      for (let t = 0; t <= numTrastes; t++) {
        const ni = (AFINACION[c] + t) % 12;
        const grado = notasEscala.indexOf(ni);
        if (grado !== -1) {
          posiciones.push({ cuerda: c, traste: t, notaIdx: ni, notaNom: NOTAS[ni], grado, esTonica: ni === ti });
        }
      }
    }
    return posiciones;
  }

  function obtenerAcordesDesdeGrados(listaGrados, tonicaIdx) {
    return listaGrados.map(g => {
      const ri = (tonicaIdx + g.s) % 12;
      return `${NOTAS[ri]}${TIPOS_ACORDE[g.t].sufijo}`;
    });
  }

  window.GuitarScaleFinder.ServicioMapa = { generarMapa, obtenerAcordesDesdeGrados };
})();

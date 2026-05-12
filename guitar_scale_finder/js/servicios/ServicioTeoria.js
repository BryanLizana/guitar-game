// S: única responsabilidad — lógica de teoría musical (parsing, identificación, detección)
// D: depende de abstracciones de datos, no de implementaciones de UI
(function () {
  const { NOTAS, BEMOLES } = window.GuitarScaleFinder.Constantes;
  const { TIPOS_ACORDE, MAPA_SUFIJO, REGEX_AC } = window.GuitarScaleFinder.Acordes;
  const { TIPOS_ESCALA } = window.GuitarScaleFinder.Escalas;

  function normalizarNota(n) {
    return BEMOLES[n] ?? n;
  }

  function parsearAcorde(texto) {
    const m = texto.trim().match(REGEX_AC);
    if (!m) return null;
    const raiz = normalizarNota(m[1]);
    const sufijo = m[2] ?? '';
    const tipo = MAPA_SUFIJO[sufijo];
    if (tipo === undefined) return null;
    return { raiz, tipo, nombre: `${raiz}${TIPOS_ACORDE[tipo].sufijo}` };
  }

  function obtenerNotasAcorde(nombre) {
    const p = parsearAcorde(nombre);
    if (!p) return new Set();
    const ri = NOTAS.indexOf(p.raiz);
    return new Set(TIPOS_ACORDE[p.tipo].intervalos.map(iv => (ri + iv) % 12));
  }

  function identificarAcordeDesdeNotas(notasSet) {
    const arr = [...notasSet];
    if (arr.length < 2) return [];
    const resultados = [];
    for (const ri of arr) {
      for (const [tipo, ac] of Object.entries(TIPOS_ACORDE)) {
        const notasAcorde = ac.intervalos.map(i => (ri + i) % 12);
        if (notasAcorde.every(n => arr.includes(n))) {
          resultados.push({
            nombre: `${NOTAS[ri]}${ac.sufijo}`,
            raiz: NOTAS[ri], tipo,
            esExacto: notasAcorde.length === arr.length,
            coincidencias: notasAcorde.length,
            notasAcorde: notasAcorde.map(n => NOTAS[n]),
          });
        }
      }
    }
    return resultados.sort((a, b) =>
      (b.esExacto ? 1 : 0) - (a.esExacto ? 1 : 0) || b.coincidencias - a.coincidencias
    );
  }

  function sugerirAcordeCercano(notasSet) {
    const arr = [...notasSet];
    if (arr.length < 2) return [];
    const candidatos = [];
    for (let ri = 0; ri < 12; ri++) {
      for (const [tipo, ac] of Object.entries(TIPOS_ACORDE)) {
        const notasAcorde = ac.intervalos.map(i => (ri + i) % 12);
        const enComun = notasAcorde.filter(n => arr.includes(n));
        const faltantes = notasAcorde.filter(n => !arr.includes(n));
        if (enComun.length >= 2 && faltantes.length === 1) {
          candidatos.push({
            nombre: `${NOTAS[ri]}${ac.sufijo}`,
            notasAcorde: notasAcorde.map(n => NOTAS[n]),
            faltantes: faltantes.map(n => NOTAS[n]),
            puntuacion: enComun.length * 10 - 5,
          });
        }
      }
    }
    const vistos = new Set();
    return candidatos
      .sort((a, b) => b.puntuacion - a.puntuacion)
      .filter(s => { if (vistos.has(s.nombre)) return false; vistos.add(s.nombre); return true; })
      .slice(0, 5);
  }

  function detectarEscala(listaAcordes) {
    if (!listaAcordes.length) return [];
    const acordesParsados = listaAcordes.map(parsearAcorde).filter(Boolean);
    if (!acordesParsados.length) return [];
    const resultados = [];

    for (const [tipoEsc, escala] of Object.entries(TIPOS_ESCALA)) {
      if (!escala.acordesDiat) continue;
      for (let ti = 0; ti < 12; ti++) {
        const acordesDiat = escala.intervalos.map((intervalo, g) => ({
          ri: (ti + intervalo) % 12,
          tipo: escala.acordesDiat[g],
          grado: escala.grados[g],
        }));
        const coincidencias = [];
        for (const ac of acordesParsados) {
          const ri = NOTAS.indexOf(ac.raiz);
          const diat = acordesDiat.find(d =>
            d.ri === ri &&
            (d.tipo === ac.tipo ||
             (d.tipo === 'mayor' && ac.tipo === 'dom7') ||
             (d.tipo === 'disminuido' && ac.tipo === 'dim7'))
          );
          if (diat) coincidencias.push({ acorde: ac.nombre, grado: diat.grado });
        }
        if (coincidencias.length) {
          const porcentaje = Math.round(coincidencias.length / acordesParsados.length * 100);
          resultados.push({
            tonica: NOTAS[ti], tipo: tipoEsc,
            nombre: `${NOTAS[ti]} ${escala.nombre}`,
            color: escala.color,
            coincidencias: coincidencias.length,
            total: acordesParsados.length,
            porcentaje,
            coin: coincidencias,
          });
        }
      }
    }
    return resultados
      .sort((a, b) => b.porcentaje - a.porcentaje || b.coincidencias - a.coincidencias)
      .slice(0, 10);
  }

  window.GuitarScaleFinder.ServicioTeoria = {
    normalizarNota,
    parsearAcorde,
    obtenerNotasAcorde,
    identificarAcordeDesdeNotas,
    sugerirAcordeCercano,
    detectarEscala,
  };
})();

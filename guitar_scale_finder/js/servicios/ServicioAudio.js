// S: única responsabilidad — síntesis y reproducción de audio
// D: depende de abstracciones (Constantes, Acordes) no de implementaciones concretas
(function () {
  const { FREQ_CUERDAS, AFINACION, NOTAS } = window.GuitarScaleFinder.Constantes;

  let audioCtx = null;
  let scalePlayTimer = null;
  let estaReproduciendo = false;
  let progTimer = null;

  function obtenerContextoAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function reproducirNota(cuerda, traste, cuando = 0, duracion = 1.6) {
    try {
      const ctx = obtenerContextoAudio();
      const freq = FREQ_CUERDAS[cuerda] * Math.pow(2, traste / 12);
      const ahora = ctx.currentTime + cuando;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ahora);
      const filtro = ctx.createBiquadFilter();
      filtro.type = 'lowpass';
      filtro.frequency.setValueAtTime(2200, ahora);
      filtro.frequency.exponentialRampToValueAtTime(500, ahora + 1.0);
      const ganancia = ctx.createGain();
      ganancia.gain.setValueAtTime(0, ahora);
      ganancia.gain.linearRampToValueAtTime(0.35, ahora + 0.01);
      ganancia.gain.exponentialRampToValueAtTime(0.12, ahora + 0.3);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + duracion);
      osc.connect(filtro);
      filtro.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start(ahora);
      osc.stop(ahora + duracion);
    } catch (e) {}
  }

  function reproducirAcorde(notasIdx) {
    const cuérdasUsadas = new Set();
    [...notasIdx].forEach(ni => {
      for (let c = 0; c < 6; c++) {
        if (cuérdasUsadas.has(c)) continue;
        for (let t = 0; t <= 5; t++) {
          if ((AFINACION[c] + t) % 12 === ni) {
            reproducirNota(c, t, 0, 1.8);
            cuérdasUsadas.add(c);
            break;
          }
        }
      }
    });
  }

  function reproducirEscala(posicionesDestacadas, boton) {
    if (estaReproduciendo) {
      clearTimeout(scalePlayTimer);
      estaReproduciendo = false;
      if (boton) { boton.textContent = '▶ Escuchar escala'; boton.classList.remove('playing'); }
      return;
    }
    const frecuenciasVistas = new Set();
    const posicionesOrdenadas = [...posicionesDestacadas]
      .sort((a, b) => a.traste - b.traste || a.cuerda - b.cuerda)
      .filter(p => {
        const f = Math.round(FREQ_CUERDAS[p.cuerda] * Math.pow(2, p.traste / 12));
        if (frecuenciasVistas.has(f)) return false;
        frecuenciasVistas.add(f);
        return true;
      })
      .slice(0, 14);

    estaReproduciendo = true;
    if (boton) { boton.textContent = '⏹ Detener'; boton.classList.add('playing'); }
    let i = 0;

    function siguiente() {
      if (!estaReproduciendo || i >= posicionesOrdenadas.length) {
        estaReproduciendo = false;
        if (boton) { boton.textContent = '▶ Escuchar escala'; boton.classList.remove('playing'); }
        return;
      }
      reproducirNota(posicionesOrdenadas[i].cuerda, posicionesOrdenadas[i].traste);
      i++;
      scalePlayTimer = setTimeout(siguiente, 220);
    }
    siguiente();
  }

  function detenerProgresion() {
    clearTimeout(progTimer);
    document.querySelectorAll('.prog-item.tocando').forEach(el => el.classList.remove('tocando'));
  }

  function reproducirProgresion(nombresAcordes, elementoItem) {
    // Referencia tardía — ServicioTeoria se carga después de ServicioAudio
    const { parsearAcorde } = window.GuitarScaleFinder.ServicioTeoria;
    const { TIPOS_ACORDE } = window.GuitarScaleFinder.Acordes;
    detenerProgresion();
    elementoItem.classList.add('tocando');
    let i = 0;

    function siguiente() {
      if (i >= nombresAcordes.length) { detenerProgresion(); return; }
      const p = parsearAcorde(nombresAcordes[i].trim());
      if (p) {
        const ac = TIPOS_ACORDE[p.tipo];
        const ri = NOTAS.indexOf(p.raiz);
        reproducirAcorde(new Set(ac.intervalos.map(iv => (ri + iv) % 12)));
      }
      i++;
      progTimer = setTimeout(siguiente, 1500);
    }
    siguiente();
  }

  window.GuitarScaleFinder.ServicioAudio = {
    reproducirNota,
    reproducirAcorde,
    reproducirEscala,
    reproducirProgresion,
    detenerProgresion,
  };
})();

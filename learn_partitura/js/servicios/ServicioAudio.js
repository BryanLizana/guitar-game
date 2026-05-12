'use strict';

// SRP: única responsabilidad → síntesis y reproducción de audio.
var ServicioAudio = class {
  constructor() {
    this._contexto = null;
  }

  // Crea o reanuda el AudioContext (requiere interacción del usuario)
  _obtenerContexto() {
    if (!this._contexto) {
      this._contexto = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._contexto.state === 'suspended') this._contexto.resume();
    return this._contexto;
  }

  // Reproduce una frecuencia con timbre de piano (serie armónica + envolvente ADSR)
  reproducir(frecuencia, duracion = 1.8) {
    const ctx   = this._obtenerContexto();
    const ahora = ctx.currentTime;

    const gananciaGeneral = ctx.createGain();
    gananciaGeneral.gain.value = 0.44;
    gananciaGeneral.connect(ctx.destination);

    // Armónicos: [multiplicador, volumen relativo]
    [[1, 0.60], [2, 0.22], [3, 0.10], [4, 0.05], [5, 0.02]].forEach(([mult, vol]) => {
      const osc      = ctx.createOscillator();
      const ganancia = ctx.createGain();
      osc.connect(ganancia);
      ganancia.connect(gananciaGeneral);

      osc.type = 'sine';
      osc.frequency.value = frecuencia * mult;

      ganancia.gain.setValueAtTime(0, ahora);
      ganancia.gain.linearRampToValueAtTime(vol, ahora + 0.012);
      ganancia.gain.exponentialRampToValueAtTime(vol * 0.35, ahora + 0.5);
      ganancia.gain.setValueAtTime(vol * 0.35, ahora + duracion - 0.15);
      ganancia.gain.linearRampToValueAtTime(1e-4, ahora + duracion);

      osc.start(ahora);
      osc.stop(ahora + duracion + 0.1);
    });
  }
};

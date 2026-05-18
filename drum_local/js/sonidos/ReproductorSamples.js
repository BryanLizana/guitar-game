// SRP: reproduce AudioBuffers con timing schedulado; delega a síntesis si no hay sample
class ReproductorSamples {
  constructor(gestorContexto, cargadorSamples, sintetizadorFallback) {
    this._gestor   = gestorContexto;
    this._cargador = cargadorSamples;
    this._fallback = sintetizadorFallback;
  }

  _play(tipo, tiempo, volumen) {
    const buffer = this._cargador.obtenerBuffer(tipo);
    if (!buffer) return false;
    const ctx    = this._gestor.obtener();
    const fuente = ctx.createBufferSource();
    const gain   = ctx.createGain();
    fuente.buffer = buffer;
    gain.gain.setValueAtTime(Math.min(volumen, 1), tiempo);
    fuente.connect(gain);
    gain.connect(ctx.destination);
    fuente.start(tiempo);
    return true;
  }

  tocarKick(t, v = 1)    { if (!this._play('kick', t, v))      this._fallback.tocarKick(t, v); }
  tocarSnare(t, v = 1)   { if (!this._play('snare', t, v))     this._fallback.tocarSnare(t, v); }
  tocarCrash(t, v = 0.7) { if (!this._play('crash', t, v))     this._fallback.tocarCrash(t, v); }
  tocarClap(t, v = 0.85) { if (!this._play('clap', t, v))      this._fallback.tocarClap(t, v); }
  tocarRimshot(t, v = 0.7)   { if (!this._play('rimshot', t, v))   this._fallback.tocarRimshot(t, v); }
  tocarCowbell(t, v = 0.6)   { if (!this._play('cowbell', t, v))   this._fallback.tocarCowbell(t, v); }
  tocarPercusion(t, v = 0.7) { if (!this._play('percusion', t, v)) this._fallback.tocarPercusion(t, v); }

  tocarHihat(t, v = 0.7, abierto = false) {
    const tipo = abierto ? 'hihat_a' : 'hihat_c';
    if (!this._play(tipo, t, v)) this._fallback.tocarHihat(t, v, abierto);
  }

  tocarTom(t, freq = 120, v = 0.85) {
    const tipo = freq > 150 ? 'tom_alto' : freq > 90 ? 'tom_medio' : 'tom_bajo';
    if (!this._play(tipo, t, v)) this._fallback.tocarTom(t, freq, v);
  }
}

// SRP: Único responsable de calcular BPM por tapping del usuario
class MetronomoTap {
  constructor() {
    this._tiempos = [];
    this._MAX_TAPS = 8;
    this._TIMEOUT_RESET_MS = 2500;
    this._timerId = null;
  }

  registrarTap() {
    clearTimeout(this._timerId);
    this._timerId = setTimeout(() => { this._tiempos = []; }, this._TIMEOUT_RESET_MS);

    this._tiempos.push(performance.now());
    if (this._tiempos.length > this._MAX_TAPS) this._tiempos.shift();

    return this._calcularBPM();
  }

  _calcularBPM() {
    if (this._tiempos.length < 2) return null;
    const intervalos = [];
    for (let i = 1; i < this._tiempos.length; i++) {
      intervalos.push(this._tiempos[i] - this._tiempos[i - 1]);
    }
    const promedio = intervalos.reduce((a, b) => a + b, 0) / intervalos.length;
    return Math.round(Math.max(40, Math.min(300, 60000 / promedio)));
  }
}

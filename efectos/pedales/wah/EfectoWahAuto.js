"use strict";

class EfectoWahAuto extends EfectoBase {
  _inicializar() {
    this._nodoFiltro      = this._ctx.createBiquadFilter();
    this._nodoFiltro.type = 'bandpass';
    this._nodoFiltro.frequency.value = 1200;

    // LFO que barre la frecuencia del filtro
    this._lfo           = this._ctx.createOscillator();
    this._lfo.type      = 'sine';
    this._gananciaLfo   = this._ctx.createGain();

    this._velocidad   = 1;   // Hz
    this._profundidad = 60;  // 0-100
    this._resonancia  = 50;  // 0-100

    this._lfo.frequency.value   = this._velocidad;
    this._gananciaLfo.gain.value = 800 * (this._profundidad / 100);

    // LFO → ganancia → filter.frequency (suma al valor nominal)
    this._lfo.connect(this._gananciaLfo);
    this._gananciaLfo.connect(this._nodoFiltro.frequency);

    this._lfo.start();
    this._aplicarResonancia();
  }

  _conectarCadena() {
    this.nodoEntrada.connect(this._nodoFiltro);
    this._nodoFiltro.connect(this.nodoSalida);
  }

  _desconectarCadena() {
    const d = (a, b) => { try { a.disconnect(b); } catch (_) {} };
    d(this.nodoEntrada, this._nodoFiltro);
    d(this._nodoFiltro, this.nodoSalida);
  }

  ajustarVelocidad(v)   { this._lfo.frequency.value    = v; }
  ajustarProfundidad(v) { this._gananciaLfo.gain.value  = 800 * (v / 100); }
  ajustarResonancia(v)  { this._aplicarResonancia(v); }

  _aplicarResonancia(v = this._resonancia) {
    this._resonancia = v;
    // Q: 1 (sutil) → 20 (muy resonante / pico pronunciado)
    this._nodoFiltro.Q.value = 1 + (v / 100) * 19;
  }
}

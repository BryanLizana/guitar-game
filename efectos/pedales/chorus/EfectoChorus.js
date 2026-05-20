"use strict";

class EfectoChorus extends EfectoBase {
  _inicializar() {
    // Delay corto (10-25ms) modulado por LFO → ensanchamiento estéreo
    this._nodoDelay   = this._ctx.createDelay(0.05);
    this._lfo         = this._ctx.createOscillator();
    this._lfo.type    = 'sine';
    this._gananciaLfo = this._ctx.createGain();
    this._nodoWet     = this._ctx.createGain();
    this._nodoDry     = this._ctx.createGain();

    this._velocidad   = 1.5;
    this._profundidad = 40;
    this._mezcla      = 50;

    // Centro del delay en 15ms; LFO oscila ±profundidad ms alrededor
    this._nodoDelay.delayTime.value  = 0.015;
    this._lfo.frequency.value        = this._velocidad;
    this._gananciaLfo.gain.value     = 0.006 * (this._profundidad / 100);

    this._lfo.connect(this._gananciaLfo);
    this._gananciaLfo.connect(this._nodoDelay.delayTime);

    this._lfo.start();
    this._aplicarMezcla();
  }

  _conectarCadena() {
    this.nodoEntrada.connect(this._nodoDry);
    this._nodoDry.connect(this.nodoSalida);
    this.nodoEntrada.connect(this._nodoDelay);
    this._nodoDelay.connect(this._nodoWet);
    this._nodoWet.connect(this.nodoSalida);
  }

  _desconectarCadena() {
    const d = (a, b) => { try { a.disconnect(b); } catch (_) {} };
    d(this.nodoEntrada, this._nodoDry);
    d(this._nodoDry,    this.nodoSalida);
    d(this.nodoEntrada, this._nodoDelay);
    d(this._nodoDelay,  this._nodoWet);
    d(this._nodoWet,    this.nodoSalida);
  }

  ajustarVelocidad(v)   { this._lfo.frequency.value   = v; }
  ajustarProfundidad(v) { this._gananciaLfo.gain.value = 0.006 * (v / 100); }
  ajustarMezcla(v)      { this._mezcla = v; this._aplicarMezcla(); }

  _aplicarMezcla() {
    this._nodoWet.gain.value = this._mezcla / 100;
    this._nodoDry.gain.value = 1 - this._mezcla / 100;
  }
}

"use strict";

class EfectoTremolo extends EfectoBase {
  _inicializar() {
    this._nodoPortador = this._ctx.createGain();
    this._lfo          = this._ctx.createOscillator();
    this._lfo.type     = 'sine';
    this._gananciaLfo  = this._ctx.createGain();

    this._velocidad   = 5;
    this._profundidad = 60;

    this._lfo.frequency.value = this._velocidad;
    this._lfo.connect(this._gananciaLfo);
    this._gananciaLfo.connect(this._nodoPortador.gain);

    this._lfo.start();
    this._aplicarProfundidad();
  }

  _conectarCadena() {
    this.nodoEntrada.connect(this._nodoPortador);
    this._nodoPortador.connect(this.nodoSalida);
  }

  _desconectarCadena() {
    const d = (a, b) => { try { a.disconnect(b); } catch (_) {} };
    d(this.nodoEntrada,   this._nodoPortador);
    d(this._nodoPortador, this.nodoSalida);
  }

  ajustarVelocidad(v)   { this._velocidad = v;   this._lfo.frequency.value = v; }
  ajustarProfundidad(v) { this._profundidad = v;  this._aplicarProfundidad(); }

  _aplicarProfundidad() {
    const d = this._profundidad / 100;
    // gain oscila entre (1-d) y 1: valor nominal = 1-d/2, amplitud LFO = d/2
    this._nodoPortador.gain.value = 1 - d * 0.5;
    this._gananciaLfo.gain.value  = d * 0.5;
  }
}

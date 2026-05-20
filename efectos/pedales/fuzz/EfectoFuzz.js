"use strict";

class EfectoFuzz extends EfectoBase {
  _inicializar() {
    this._nodoShaper  = this._ctx.createWaveShaper();
    this._nodoShaper.oversample = '4x';
    this._nodoVolumen = this._ctx.createGain();

    this._intensidad = 50;
    this._volumen    = 70;
    this._aplicarIntensidad();
    this._aplicarVolumen();
  }

  _conectarCadena() {
    this.nodoEntrada.connect(this._nodoShaper);
    this._nodoShaper.connect(this._nodoVolumen);
    this._nodoVolumen.connect(this.nodoSalida);
  }

  _desconectarCadena() {
    const d = (a, b) => { try { a.disconnect(b); } catch (_) {} };
    d(this.nodoEntrada,  this._nodoShaper);
    d(this._nodoShaper,  this._nodoVolumen);
    d(this._nodoVolumen, this.nodoSalida);
  }

  ajustarIntensidad(v) { this._intensidad = v; this._aplicarIntensidad(); }
  ajustarVolumen(v)    { this._volumen = v;    this._aplicarVolumen(); }

  _aplicarIntensidad() {
    this._nodoShaper.curve = CurvaDistorsion.crearFuzz(this._intensidad);
  }

  _aplicarVolumen() {
    this._nodoVolumen.gain.value = (this._volumen / 100) * 2;
  }
}

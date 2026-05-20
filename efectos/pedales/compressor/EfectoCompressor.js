"use strict";

class EfectoCompressor extends EfectoBase {
  _inicializar() {
    this._nodoCompresor = this._ctx.createDynamicsCompressor();

    this._umbral    = -24;  // dB
    this._relacion  = 4;    // ratio
    this._ataque    = 3;    // ms
    this._liberacion = 250; // ms

    this._aplicarUmbral();
    this._aplicarRelacion();
    this._aplicarAtaque();
    this._aplicarLiberacion();
  }

  _conectarCadena() {
    this.nodoEntrada.connect(this._nodoCompresor);
    this._nodoCompresor.connect(this.nodoSalida);
  }

  _desconectarCadena() {
    const d = (a, b) => { try { a.disconnect(b); } catch (_) {} };
    d(this.nodoEntrada,    this._nodoCompresor);
    d(this._nodoCompresor, this.nodoSalida);
  }

  ajustarUmbral(v)     { this._umbral    = v; this._aplicarUmbral(); }
  ajustarRelacion(v)   { this._relacion  = v; this._aplicarRelacion(); }
  ajustarAtaque(v)     { this._ataque    = v; this._aplicarAtaque(); }
  ajustarLiberacion(v) { this._liberacion = v; this._aplicarLiberacion(); }

  _aplicarUmbral()     { this._nodoCompresor.threshold.value = this._umbral; }
  _aplicarRelacion()   { this._nodoCompresor.ratio.value     = this._relacion; }
  _aplicarAtaque()     { this._nodoCompresor.attack.value    = this._ataque    / 1000; }
  _aplicarLiberacion() { this._nodoCompresor.release.value   = this._liberacion / 1000; }
}

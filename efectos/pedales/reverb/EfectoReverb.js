"use strict";

class EfectoReverb extends EfectoBase {
  _inicializar() {
    this._nodoConvolucion = this._ctx.createConvolver();
    this._nodoMezclaWet  = this._ctx.createGain();
    this._nodoMezclaDry  = this._ctx.createGain();

    this._tamano      = 50;
    this._decaimiento = 50;
    this._mezcla      = 30;

    this._regenerarIR();
    this._aplicarMezcla();
  }

  _conectarCadena() {
    this.nodoEntrada.connect(this._nodoMezclaDry);
    this._nodoMezclaDry.connect(this.nodoSalida);
    this.nodoEntrada.connect(this._nodoConvolucion);
    this._nodoConvolucion.connect(this._nodoMezclaWet);
    this._nodoMezclaWet.connect(this.nodoSalida);
  }

  _desconectarCadena() {
    const d = (a, b) => { try { a.disconnect(b); } catch (_) {} };
    d(this.nodoEntrada,      this._nodoMezclaDry);
    d(this._nodoMezclaDry,   this.nodoSalida);
    d(this.nodoEntrada,      this._nodoConvolucion);
    d(this._nodoConvolucion, this._nodoMezclaWet);
    d(this._nodoMezclaWet,   this.nodoSalida);
  }

  ajustarTamano(v)      { this._tamano = v;      this._regenerarIR(); }
  ajustarDecaimiento(v) { this._decaimiento = v; this._regenerarIR(); }
  ajustarMezcla(v)      { this._mezcla = v;      this._aplicarMezcla(); }

  _regenerarIR() {
    this._nodoConvolucion.buffer = GeneradorImpulso.generar(
      this._ctx, this._tamano, this._decaimiento
    );
  }

  _aplicarMezcla() {
    const wet = this._mezcla / 100;
    this._nodoMezclaWet.gain.value = wet;
    this._nodoMezclaDry.gain.value = 1 - wet;
  }
}

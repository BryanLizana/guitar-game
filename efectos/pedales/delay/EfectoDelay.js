"use strict";

class EfectoDelay extends EfectoBase {
  _inicializar() {
    this._nodoDelay     = this._ctx.createDelay(2.0);
    this._nodoFeedback  = this._ctx.createGain();
    this._nodoMezclaWet = this._ctx.createGain();
    this._nodoMezclaDry = this._ctx.createGain();

    this._tiempo            = 300;
    this._retroalimentacion = 30;
    this._mezcla            = 40;
    this._aplicarTiempo();
    this._aplicarRetroalimentacion();
    this._aplicarMezcla();
  }

  _conectarCadena() {
    this.nodoEntrada.connect(this._nodoMezclaDry);
    this._nodoMezclaDry.connect(this.nodoSalida);
    this.nodoEntrada.connect(this._nodoDelay);
    this._nodoDelay.connect(this._nodoFeedback);
    this._nodoFeedback.connect(this._nodoDelay);   // lazo de feedback
    this._nodoDelay.connect(this._nodoMezclaWet);
    this._nodoMezclaWet.connect(this.nodoSalida);
  }

  _desconectarCadena() {
    const d = (a, b) => { try { a.disconnect(b); } catch (_) {} };
    d(this.nodoEntrada,    this._nodoMezclaDry);
    d(this._nodoMezclaDry, this.nodoSalida);
    d(this.nodoEntrada,    this._nodoDelay);
    d(this._nodoDelay,     this._nodoFeedback);
    d(this._nodoFeedback,  this._nodoDelay);
    d(this._nodoDelay,     this._nodoMezclaWet);
    d(this._nodoMezclaWet, this.nodoSalida);
  }

  ajustarTiempo(v)            { this._tiempo = v;            this._aplicarTiempo(); }
  ajustarRetroalimentacion(v) { this._retroalimentacion = v; this._aplicarRetroalimentacion(); }
  ajustarMezcla(v)            { this._mezcla = v;            this._aplicarMezcla(); }

  _aplicarTiempo()            { this._nodoDelay.delayTime.value = this._tiempo / 1000; }
  _aplicarRetroalimentacion() { this._nodoFeedback.gain.value   = this._retroalimentacion / 100; }
  _aplicarMezcla() {
    const wet = this._mezcla / 100;
    this._nodoMezclaWet.gain.value = wet;
    this._nodoMezclaDry.gain.value = 1 - wet;
  }
}

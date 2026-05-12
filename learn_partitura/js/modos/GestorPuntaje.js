'use strict';

// SRP: única responsabilidad → gestionar y mostrar la puntuación del modo lectura.
var GestorPuntaje = class {
  constructor(elAciertos, elRacha, elTotal) {
    this._aciertos  = 0;
    this._racha     = 0;
    this._total     = 0;
    this._elAciertos = elAciertos;
    this._elRacha    = elRacha;
    this._elTotal    = elTotal;
  }

  registrarAcierto() {
    this._aciertos++;
    this._racha++;
    this._total++;
    this._renderizar();
  }

  registrarFallo() {
    this._racha = 0;
    this._total++;
    this._renderizar();
  }

  _renderizar() {
    this._elAciertos.textContent = this._aciertos;
    this._elRacha.textContent    = this._racha;
    this._elTotal.textContent    = this._total;
  }
};

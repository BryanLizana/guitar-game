"use strict";

class CadenaEfectos {
  constructor(efectos, destino) {
    this._efectos = efectos;
    this._destino = destino;
    this._fuente  = null;
  }

  conectarFuente(nodoFuente) {
    this._fuente = nodoFuente;
    this._construirCadena();
  }

  _construirCadena() {
    if (!this._fuente) return;
    let nodo = this._fuente;
    for (const efecto of this._efectos) {
      nodo.connect(efecto.nodoEntrada);
      nodo = efecto.nodoSalida;
    }
    nodo.connect(this._destino);
  }
}

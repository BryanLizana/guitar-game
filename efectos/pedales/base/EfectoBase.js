"use strict";

class EfectoBase {
  constructor(ctx) {
    this._ctx    = ctx;
    this.activo  = false;
    this.nodoEntrada = ctx.createGain();
    this.nodoSalida  = ctx.createGain();
    this._ganadaBypass = ctx.createGain();

    // Bypass siempre conectado; ganancia controla si pasa o no
    this.nodoEntrada.connect(this._ganadaBypass);
    this._ganadaBypass.connect(this.nodoSalida);
    this._ganadaBypass.gain.value = 1;

    this._inicializar();
  }

  _inicializar()       { throw new Error('_inicializar() debe implementarse'); }
  _conectarCadena()    { throw new Error('_conectarCadena() debe implementarse'); }
  _desconectarCadena() { throw new Error('_desconectarCadena() debe implementarse'); }

  activar() {
    if (this.activo) return;
    this.activo = true;
    this._ganadaBypass.gain.setTargetAtTime(0, this._ctx.currentTime, 0.005);
    this._conectarCadena();
  }

  desactivar() {
    if (!this.activo) return;
    this._ganadaBypass.gain.setTargetAtTime(1, this._ctx.currentTime, 0.005);
    this._desconectarCadena();
    this.activo = false;
  }

  conectarA(destino) {
    this.nodoSalida.connect(destino);
  }
}

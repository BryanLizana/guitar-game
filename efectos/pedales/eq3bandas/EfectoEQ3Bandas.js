"use strict";

class EfectoEQ3Bandas extends EfectoBase {
  _inicializar() {
    this._nodoBajos  = this._ctx.createBiquadFilter();
    this._nodoMedios = this._ctx.createBiquadFilter();
    this._nodoAgudos = this._ctx.createBiquadFilter();

    this._nodoBajos.type  = 'lowshelf';
    this._nodoMedios.type = 'peaking';
    this._nodoAgudos.type = 'highshelf';

    this._nodoBajos.frequency.value  = 250;
    this._nodoMedios.frequency.value = 1000;
    this._nodoAgudos.frequency.value = 4000;
    this._nodoMedios.Q.value = 1;

    this._bajos  = 0;
    this._medios = 0;
    this._agudos = 0;
  }

  _conectarCadena() {
    this.nodoEntrada.connect(this._nodoBajos);
    this._nodoBajos.connect(this._nodoMedios);
    this._nodoMedios.connect(this._nodoAgudos);
    this._nodoAgudos.connect(this.nodoSalida);
  }

  _desconectarCadena() {
    const d = (a, b) => { try { a.disconnect(b); } catch (_) {} };
    d(this.nodoEntrada,  this._nodoBajos);
    d(this._nodoBajos,   this._nodoMedios);
    d(this._nodoMedios,  this._nodoAgudos);
    d(this._nodoAgudos,  this.nodoSalida);
  }

  ajustarBajos(v)  { this._nodoBajos.gain.value  = v; }
  ajustarMedios(v) { this._nodoMedios.gain.value = v; }
  ajustarAgudos(v) { this._nodoAgudos.gain.value = v; }
}

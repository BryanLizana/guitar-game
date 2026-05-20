"use strict";

class EfectoOverdrive extends EfectoBase {
  _inicializar() {
    this._nodoPreGain    = this._ctx.createGain();
    this._nodoShaper     = this._ctx.createWaveShaper();
    this._nodoShaper.oversample = '4x';
    this._nodoFiltroTono = this._ctx.createBiquadFilter();
    this._nodoFiltroTono.type = 'lowpass';

    this._ganancia = 50;
    this._tono     = 50;
    this._aplicarGanancia();
    this._aplicarTono();
  }

  _conectarCadena() {
    this.nodoEntrada.connect(this._nodoPreGain);
    this._nodoPreGain.connect(this._nodoShaper);
    this._nodoShaper.connect(this._nodoFiltroTono);
    this._nodoFiltroTono.connect(this.nodoSalida);
  }

  _desconectarCadena() {
    const d = (a, b) => { try { a.disconnect(b); } catch (_) {} };
    d(this.nodoEntrada,     this._nodoPreGain);
    d(this._nodoPreGain,    this._nodoShaper);
    d(this._nodoShaper,     this._nodoFiltroTono);
    d(this._nodoFiltroTono, this.nodoSalida);
  }

  ajustarGanancia(v) { this._ganancia = v; this._aplicarGanancia(); }
  ajustarTono(v)     { this._tono = v;     this._aplicarTono(); }

  _aplicarGanancia() {
    this._nodoShaper.curve       = CurvaDistorsion.crearOverdrive(this._ganancia);
    this._nodoPreGain.gain.value = 1 + (this._ganancia / 100) * 4;
  }

  _aplicarTono() {
    // 0 = oscuro (600 Hz) | 100 = brillante (12 000 Hz)
    this._nodoFiltroTono.frequency.value = 600 + (this._tono / 100) * 11400;
  }
}

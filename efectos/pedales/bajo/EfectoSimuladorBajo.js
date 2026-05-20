"use strict";

class EfectoSimuladorBajo extends EfectoBase {
  _inicializar() {
    // Simula bajo sin pitch-shifting: recorta agudos, realza cuerpo y añade armónicos
    this._nodoHP      = this._ctx.createBiquadFilter();
    this._nodoHP.type = 'highpass';
    this._nodoHP.frequency.value = 55; // elimina subsuelo

    this._nodoLP      = this._ctx.createBiquadFilter();
    this._nodoLP.type = 'lowpass';     // recorta agudos de guitarra

    this._nodoCuerpo      = this._ctx.createBiquadFilter();
    this._nodoCuerpo.type = 'peaking';
    this._nodoCuerpo.frequency.value = 110; // fundamental de bajo
    this._nodoCuerpo.Q.value = 1.2;

    this._nodoShaper = this._ctx.createWaveShaper();
    this._nodoShaper.oversample = '2x';
    // Distorsión suave para armónicos típicos de bajo
    this._nodoShaper.curve = EfectoSimuladorBajo._crearCurva();

    this._nodoVolumen = this._ctx.createGain();

    this._tono    = 50;
    this._cuerpo  = 60;
    this._volumen = 70;

    this._aplicarTono();
    this._aplicarCuerpo();
    this._aplicarVolumen();
  }

  static _crearCurva() {
    const n = 512;
    const curva = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curva[i] = Math.tanh(x * 3);
    }
    return curva;
  }

  _conectarCadena() {
    this.nodoEntrada.connect(this._nodoHP);
    this._nodoHP.connect(this._nodoLP);
    this._nodoLP.connect(this._nodoCuerpo);
    this._nodoCuerpo.connect(this._nodoShaper);
    this._nodoShaper.connect(this._nodoVolumen);
    this._nodoVolumen.connect(this.nodoSalida);
  }

  _desconectarCadena() {
    const d = (a, b) => { try { a.disconnect(b); } catch (_) {} };
    d(this.nodoEntrada,  this._nodoHP);
    d(this._nodoHP,      this._nodoLP);
    d(this._nodoLP,      this._nodoCuerpo);
    d(this._nodoCuerpo,  this._nodoShaper);
    d(this._nodoShaper,  this._nodoVolumen);
    d(this._nodoVolumen, this.nodoSalida);
  }

  ajustarTono(v)    { this._tono = v;    this._aplicarTono(); }
  ajustarCuerpo(v)  { this._cuerpo = v;  this._aplicarCuerpo(); }
  ajustarVolumen(v) { this._volumen = v;  this._aplicarVolumen(); }

  _aplicarTono() {
    // 0 = muy oscuro (350 Hz) | 100 = brillante para bajo (1800 Hz)
    this._nodoLP.frequency.value = 350 + (this._tono / 100) * 1450;
  }

  _aplicarCuerpo() {
    // Boost en 110 Hz: 0 → 0 dB | 100 → +15 dB
    this._nodoCuerpo.gain.value = (this._cuerpo / 100) * 15;
  }

  _aplicarVolumen() {
    this._nodoVolumen.gain.value = (this._volumen / 100) * 2;
  }
}

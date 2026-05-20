"use strict";

class CurvaDistorsion {
  static crearOverdrive(ganancia) {
    const n = 512;
    const curva = new Float32Array(n);
    const k = ganancia * 3;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curva[i] = ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x));
    }
    return curva;
  }

  static crearFuzz(intensidad) {
    const n = 512;
    const curva = new Float32Array(n);
    const k = 2 + (intensidad / 100) * 998;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curva[i] = Math.tanh(x * k);
    }
    return curva;
  }
}

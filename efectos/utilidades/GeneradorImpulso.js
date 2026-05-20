"use strict";

class GeneradorImpulso {
  static generar(ctx, tamano, decaimiento) {
    // tamano 0-100 → duración 0.2s – 4s
    const duracion = 0.2 + (tamano / 100) * 3.8;
    const longitud = Math.ceil(ctx.sampleRate * duracion);
    const buffer   = ctx.createBuffer(2, longitud, ctx.sampleRate);
    // decaimiento 0-100 → exponente 0.5 – 20 (mayor = cola más corta)
    const exponente = 0.5 + (decaimiento / 100) * 19.5;
    for (let canal = 0; canal < 2; canal++) {
      const datos = buffer.getChannelData(canal);
      for (let i = 0; i < longitud; i++) {
        const t = i / longitud;
        datos[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, exponente);
      }
    }
    return buffer;
  }
}

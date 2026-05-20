"use strict";

class GestorArchivoAudio {
  async decodificar(archivo, ctx) {
    const buffer = await archivo.arrayBuffer();
    return ctx.decodeAudioData(buffer);
  }
}

"use strict";

class GestorDispositivosAudio {
  async listarEntradas() {
    await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const todos = await navigator.mediaDevices.enumerateDevices();
    return todos.filter(d => d.kind === 'audioinput');
  }

  async crearFlujo(idDispositivo) {
    const restricciones = {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        latency: 0,
      },
    };
    if (idDispositivo) {
      restricciones.audio.deviceId = { exact: idDispositivo };
    }
    return navigator.mediaDevices.getUserMedia(restricciones);
  }
}

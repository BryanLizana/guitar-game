// SRP: Único responsable de crear y mantener el AudioContext compartido
class GestorContextoAudio {
  constructor() {
    this._contexto = null;
  }

  obtener() {
    if (!this._contexto) {
      this._contexto = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._contexto.state === 'suspended') {
      this._contexto.resume();
    }
    return this._contexto;
  }
}

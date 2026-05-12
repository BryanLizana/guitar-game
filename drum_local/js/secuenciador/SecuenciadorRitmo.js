// SRP: Único responsable del motor de timing y scheduling del loop
class SecuenciadorRitmo {
  constructor(biblioteca, gestorContexto) {
    this._biblioteca = biblioteca;      // DIP
    this._gestor = gestorContexto;      // DIP
    this._pistas = [];
    this._bpm = 120;
    this._numeroPasos = 16;
    this._pasoActual = 0;
    this._tiempoProximo = 0;
    this._reproduciendo = false;
    this._timeoutId = null;
    this._callbackPaso = null;
    this._LOOK_AHEAD = 0.12;   // segundos de anticipación
    this._INTERVALO = 25;      // ms entre ciclos del scheduler
  }

  establecerCallbackPaso(fn) { this._callbackPaso = fn; }
  establecerBPM(bpm) { this._bpm = Math.max(40, Math.min(300, bpm)); }
  obtenerBPM() { return this._bpm; }
  obtenerPasoActual() { return this._pasoActual; }
  estaReproduciendo() { return this._reproduciendo; }

  agregarPista(pista) { this._pistas.push(pista); }
  eliminarPista(id) { this._pistas = this._pistas.filter(p => p.id !== id); }
  obtenerPistas() { return this._pistas; }

  cambiarNumeroPasos(pasos) {
    this._numeroPasos = pasos;
    this._pistas.forEach(p => p.redimensionar(pasos));
  }

  iniciar() {
    if (this._reproduciendo) return;
    const ctx = this._gestor.obtener();
    this._reproduciendo = true;
    this._pasoActual = 0;
    this._tiempoProximo = ctx.currentTime + 0.05;
    this._tick();
  }

  detener() {
    this._reproduciendo = false;
    clearTimeout(this._timeoutId);
    this._pasoActual = 0;
    if (this._callbackPaso) this._callbackPaso(-1);
  }

  _tick() {
    if (!this._reproduciendo) return;
    this._programarPendientes();
    this._timeoutId = setTimeout(() => this._tick(), this._INTERVALO);
  }

  _programarPendientes() {
    const ctx = this._gestor.obtener();
    const segsPorPaso = (60 / this._bpm) / 4; // corcheas (16th notes)

    while (this._tiempoProximo < ctx.currentTime + this._LOOK_AHEAD) {
      const paso = this._pasoActual;
      const tiempo = this._tiempoProximo;

      this._tocarPaso(paso, tiempo);
      this._notificarUI(paso, tiempo, ctx.currentTime);

      this._pasoActual = (paso + 1) % this._numeroPasos;
      this._tiempoProximo += segsPorPaso;
    }
  }

  _tocarPaso(paso, tiempo) {
    this._pistas.forEach(pista => {
      if (!pista.silenciada && pista.estaActivo(paso)) {
        const sonido = this._biblioteca.obtenerSonido(pista.tipoSonido);
        sonido.tocar(tiempo, pista.volumen);
      }
    });
  }

  _notificarUI(paso, tiempoAudio, ahora) {
    // Dispara el callback justo cuando ese paso debe sonar
    const demora = Math.max(0, (tiempoAudio - ahora) * 1000 - 8);
    setTimeout(() => {
      if (this._reproduciendo && this._callbackPaso) {
        this._callbackPaso(paso);
      }
    }, demora);
  }
}

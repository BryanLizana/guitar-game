class Metronomo {
    constructor(sintetizadorAudio) {
        this.sintetizadorAudio = sintetizadorAudio;
        this.callbackTick = null;
        this.bpm           = 80;
        this.activo        = false;
        this.beatActual    = 0;
        this.beatsPerCompas = 4;
        this._timerId      = null;
    }

    iniciar() {
        if (this.activo) return;
        this.activo = true;
        this.beatActual = 0;
        this._ejecutarTick();
        this._timerId = setInterval(() => this._ejecutarTick(), this._msPerBeat());
    }

    detener() {
        if (!this.activo) return;
        this.activo = false;
        clearInterval(this._timerId);
        this._timerId = null;
        this.beatActual = 0;
    }

    ajustarBpm(nuevoBpm) {
        const estabaActivo = this.activo;
        if (estabaActivo) this.detener();
        this.bpm = Math.max(40, Math.min(220, nuevoBpm));
        if (estabaActivo) this.iniciar();
    }

    _msPerBeat() {
        return Math.round(60000 / this.bpm);
    }

    _ejecutarTick() {
        const esAccento = this.beatActual === 0;
        this.sintetizadorAudio.reproducirTick(esAccento);
        if (this.callbackTick) this.callbackTick(this.beatActual, esAccento);
        this.beatActual = (this.beatActual + 1) % this.beatsPerCompas;
    }
}

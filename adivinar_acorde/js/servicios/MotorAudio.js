// S: única responsabilidad — síntesis y reproducción de audio tipo guitarra
// D: depende de Guitarra para la conversión MIDI→Hz
class MotorAudio {
    constructor() {
        this._ctx = null;
    }

    _inicializar() {
        if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this._ctx.state === 'suspended') this._ctx.resume();
    }

    _reproducirNota(midi, t0, duracion) {
        const ctx = this._ctx;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        const real = new Float32Array([0, 0.55, 0.28, 0.14, 0.07, 0.035, 0.017]);
        const imag = new Float32Array(real.length);
        osc.setPeriodicWave(ctx.createPeriodicWave(real, imag));
        osc.frequency.value = Guitarra.midiAHz(midi);
        env.gain.setValueAtTime(0.001, t0);
        env.gain.linearRampToValueAtTime(0.32, t0 + 0.012);
        env.gain.exponentialRampToValueAtTime(0.001, t0 + duracion);
        osc.connect(env);
        env.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + duracion);
    }

    tocarAcorde(notasMidi) {
        this._inicializar();
        const ahora = this._ctx.currentTime;
        notasMidi.forEach((midi, i) => this._reproducirNota(midi, ahora + i * 0.065, 2.2));
    }
}

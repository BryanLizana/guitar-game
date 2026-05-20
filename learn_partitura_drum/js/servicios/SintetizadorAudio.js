class SintetizadorAudio {
    constructor() {
        this.contexto = null;
    }

    _obtenerContexto() {
        if (!this.contexto) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.contexto = new AudioCtx();
        }
        if (this.contexto && this.contexto.state === 'suspended') {
            this.contexto.resume();
        }
        return this.contexto;
    }

    reproducir(idInstrumento) {
        const ctx = this._obtenerContexto();
        if (!ctx) return;
        switch (idInstrumento) {
            case 'bombo':  this._bombo(ctx);  break;
            case 'tarola': this._tarola(ctx); break;
            case 'hihat':  this._hihat(ctx);  break;
        }
    }

    reproducirTick(esAccento) {
        const ctx = this._obtenerContexto();
        if (!ctx) return;
        const t    = ctx.currentTime;
        const freq = esAccento ? 1500 : 900;
        const vol  = esAccento ? 0.5  : 0.3;
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
        osc.start(t);
        osc.stop(t + 0.03);
    }

    _bombo(ctx) {
        const t = ctx.currentTime;
        // Tono con descenso de pitch
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
        gain.gain.setValueAtTime(1.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t); osc.stop(t + 0.35);
        // Golpe de ataque
        const src = ctx.createBufferSource();
        src.buffer = this._bufRuido(ctx, 0.05);
        const lpf = ctx.createBiquadFilter();
        lpf.type = 'lowpass'; lpf.frequency.value = 400;
        const gn = ctx.createGain();
        gn.gain.setValueAtTime(1.0, t);
        gn.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        src.connect(lpf); lpf.connect(gn); gn.connect(ctx.destination);
        src.start(t); src.stop(t + 0.05);
    }

    _tarola(ctx) {
        const t = ctx.currentTime;
        // Tono
        const osc = ctx.createOscillator();
        const g1  = ctx.createGain();
        osc.connect(g1); g1.connect(ctx.destination);
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.1);
        g1.gain.setValueAtTime(0.7, t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.start(t); osc.stop(t + 0.12);
        // Bordona (ruido)
        const src = ctx.createBufferSource();
        src.buffer = this._bufRuido(ctx, 0.22);
        const hpf = ctx.createBiquadFilter();
        hpf.type = 'highpass'; hpf.frequency.value = 2000;
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.8, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        src.connect(hpf); hpf.connect(g2); g2.connect(ctx.destination);
        src.start(t); src.stop(t + 0.22);
    }

    _hihat(ctx) {
        const t   = ctx.currentTime;
        const src = ctx.createBufferSource();
        src.buffer = this._bufRuido(ctx, 0.1);
        const hpf = ctx.createBiquadFilter();
        hpf.type = 'highpass'; hpf.frequency.value = 8000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        src.connect(hpf); hpf.connect(gain); gain.connect(ctx.destination);
        src.start(t); src.stop(t + 0.1);
    }

    _bufRuido(ctx, duracion) {
        const n   = Math.floor(ctx.sampleRate * duracion);
        const buf = ctx.createBuffer(1, n, ctx.sampleRate);
        const d   = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        return buf;
    }
}

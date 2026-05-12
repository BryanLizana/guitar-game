var GL = GL || {};

GL.liveWaveform = {
  _drawing:    false,
  _animFr:     null,
  _chunks:     [],
  _sampleRate: 44100,
  _color:      '#ef5350',
  _proc:       null,
  _canvas:     null,

  start(canvas, color) {
    this._canvas     = canvas;
    this._color      = color || '#ef5350';
    this._chunks     = [];
    this._drawing    = true;
    this._sampleRate = GL.audioEngine.audioCtx.sampleRate;

    const proc = GL.audioEngine.audioCtx.createScriptProcessor(2048, 1, 1);
    proc.onaudioprocess = e => {
      if (!this._drawing) return;
      this._chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    };
    GL.audioEngine.visAn.connect(proc);
    proc.connect(GL.audioEngine.audioCtx.destination);
    this._proc = proc;
    this._drawLoop();
  },

  stop() {
    this._drawing = false;
    cancelAnimationFrame(this._animFr);
    if (this._proc) { try { this._proc.disconnect(); } catch (e) {} this._proc = null; }
  },

  _drawLoop() {
    if (!this._drawing) return;
    this._animFr = requestAnimationFrame(() => this._drawLoop());

    const canvas = this._canvas;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = 90;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#1e1e1e'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

    const total = this._chunks.reduce((a, c) => a + c.length, 0);
    if (total === 0) return;
    const all = new Float32Array(total);
    let pos = 0; this._chunks.forEach(c => { all.set(c, pos); pos += c.length; });

    const showSamples = Math.min(all.length, Math.floor(this._sampleRate * 8));
    const slice = all.slice(all.length - showSamples);
    const step  = slice.length / W;

    ctx.strokeStyle = this._color; ctx.lineWidth = 1.2;
    [- 1, + 1].forEach(sign => {
      ctx.beginPath();
      for (let i = 0; i < W; i++) {
        let max = 0;
        const s = Math.floor(i * step), e = Math.floor((i + 1) * step);
        for (let j = s; j < e; j++) { const v = Math.abs(slice[j] || 0); if (v > max) max = v; }
        const y = H / 2 + sign * max * (H / 2 - 4);
        i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
      }
      ctx.stroke();
    });
  }
};

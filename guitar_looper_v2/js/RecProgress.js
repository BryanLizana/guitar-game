var GL = GL || {};

// Barra de progreso visual para grabación cuantizada por compases
GL.recProgress = {
  _animFr:      null,
  _canvas:      null,
  _wrap:        null,
  _loopStart:   0,
  _totalBars:   0,
  _bpm:         120,
  _beatsPerBar: 4,

  init(canvas, wrap) {
    this._canvas = canvas;
    this._wrap   = wrap;
    window.addEventListener('resize', () => this._resize());
  },

  start(loopStart, totalBars, bpm, beatsPerBar) {
    this._loopStart   = loopStart;
    this._totalBars   = totalBars;
    this._bpm         = bpm;
    this._beatsPerBar = beatsPerBar;
    this._resize();
    this._wrap.classList.add('show');
    cancelAnimationFrame(this._animFr);
    this._drawLoop();
  },

  stop() {
    cancelAnimationFrame(this._animFr);
    this._animFr = null;
    this._wrap.classList.remove('show');
  },

  _resize() {
    this._canvas.width  = this._canvas.offsetWidth || 600;
    this._canvas.height = this._canvas.offsetHeight || 28;
  },

  _drawLoop() {
    this._animFr = requestAnimationFrame(() => this._drawLoop());
    const audioCtx = GL.audioEngine.audioCtx;
    if (!audioCtx || !this._totalBars) return;

    const elapsed     = audioCtx.currentTime - this._loopStart;
    const beatDur     = 60 / this._bpm;
    const totalBeats  = this._totalBars * this._beatsPerBar;
    const totalDur    = totalBeats * beatDur;
    const curBeat     = elapsed / beatDur;            // beat actual (decimal)

    const W = this._canvas.width, H = this._canvas.height;
    const c = this._canvas.getContext('2d');
    c.clearRect(0, 0, W, H);

    // Fondo
    c.fillStyle = '#0d0d0d';
    c.fillRect(0, 0, W, H);

    // Dibujar cada compás
    for (let bar = 0; bar < this._totalBars; bar++) {
      const barStartBeat = bar * this._beatsPerBar;
      const x1 = Math.round((barStartBeat / totalBeats) * W);
      const x2 = Math.round(((barStartBeat + this._beatsPerBar) / totalBeats) * W);
      const bw = x2 - x1;

      // Relleno del compás según progreso
      const barProg = Math.max(0, Math.min(1, (curBeat - barStartBeat) / this._beatsPerBar));
      // Compás completo
      c.fillStyle = '#1a1a1a';
      c.fillRect(x1 + 1, 3, bw - 2, H - 6);
      // Parte grabada
      if (barProg > 0) {
        c.fillStyle = barProg >= 1 ? '#7f1010' : '#5a0808';
        c.fillRect(x1 + 1, 3, Math.round((bw - 2) * barProg), H - 6);
      }

      // Marcadores de tiempo (beats) dentro del compás
      for (let b = 1; b < this._beatsPerBar; b++) {
        const bx = x1 + Math.round((b / this._beatsPerBar) * bw);
        c.strokeStyle = 'rgba(239,83,80,0.25)';
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(bx, 6); c.lineTo(bx, H - 6); c.stroke();
      }

      // Número de compás
      c.fillStyle = barProg > 0.08 ? '#ef5350' : '#444';
      c.font = 'bold 10px system-ui';
      c.fillText((bar + 1) + '', x1 + 5, H / 2 + 4);
    }

    // Líneas divisorias de compás
    for (let bar = 0; bar <= this._totalBars; bar++) {
      const x = Math.round((bar * this._beatsPerBar / totalBeats) * W);
      c.strokeStyle = '#ef5350';
      c.lineWidth   = bar === 0 || bar === this._totalBars ? 2 : 1.5;
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke();
    }

    // Cabezal de posición actual
    const px = Math.min(W - 1, Math.round((curBeat / totalBeats) * W));
    c.strokeStyle = '#fff';
    c.lineWidth   = 2;
    c.beginPath(); c.moveTo(px, 0); c.lineTo(px, H); c.stroke();

    // Texto de tiempo restante (compás actual)
    const currentBar  = Math.min(this._totalBars, Math.floor(curBeat / this._beatsPerBar) + 1);
    const currentBeat = Math.floor(curBeat % this._beatsPerBar) + 1;
    const info = currentBar + '.' + currentBeat + ' / ' + this._totalBars + '.' + this._beatsPerBar;
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.font      = '9px system-ui';
    const tw = c.measureText(info).width;
    c.fillText(info, W - tw - 6, H / 2 + 4);
  }
};

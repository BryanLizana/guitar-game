var GL = GL || {};

GL.player = {
  _activeSrcs: [],

  playLayer(buf, offsetSecs, lStart, lEnd, dest) {
    const ctx = GL.audioEngine.audioCtx;
    const dur = lEnd - lStart;
    if (dur <= 0) return null;
    const src = ctx.createBufferSource();
    src.buffer    = buf;
    src.loop      = true;
    src.loopStart = lStart;
    src.loopEnd   = lEnd;
    src.connect(dest || ctx.destination);
    src.start(0, lStart + (offsetSecs % dur));
    return src;
  },

  stopAll() {
    this._activeSrcs.forEach(s => { try { s.stop(); } catch (e) {} });
    this._activeSrcs = [];
  },

  restartLayers(layers, loopStart, trimStart, trimEnd) {
    this.stopAll();
    const ctx = GL.audioEngine.audioCtx;
    if (!ctx || trimEnd <= trimStart) return;
    const dur     = trimEnd - trimStart;
    const elapsed = (ctx.currentTime - loopStart) % dur;
    layers.forEach(l => {
      if (!l.buffer) return;
      const lS = l.aligned ? 0 : trimStart;
      const lE = l.aligned ? l.buffer.duration : trimEnd;
      if (l.gainNode) l.gainNode.gain.value = l.muted ? 0 : (l.vol != null ? l.vol : 1);
      const s = this.playLayer(l.buffer, elapsed, lS, lE, l.gainNode || ctx.destination);
      if (s) this._activeSrcs.push(s);
    });
  },

  addSrc(src) {
    if (src) this._activeSrcs.push(src);
  }
};

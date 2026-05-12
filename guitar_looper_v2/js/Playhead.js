var GL = GL || {};

GL.playhead = {
  _animFr:   null,
  _el:       null,
  _getState: null,

  init(element, getState) {
    this._el       = element;
    this._getState = getState;
  },

  start() {
    cancelAnimationFrame(this._animFr);
    this._el.style.display = 'block';
    const tick = () => {
      const ctx = GL.audioEngine.audioCtx;
      const { loopStart, loopDuration, trimStart, trimEnd, canvas } = this._getState();
      if (!ctx || !loopDuration) return;
      const dur     = trimEnd - trimStart;
      const elapsed = ((ctx.currentTime - loopStart) % dur) / dur;
      const W  = canvas.width;
      const sx = (trimStart / loopDuration) * W;
      const ex = (trimEnd   / loopDuration) * W;
      this._el.style.left = (sx + elapsed * (ex - sx)) + 'px';
      this._animFr = requestAnimationFrame(tick);
    };
    tick();
  },

  stop() {
    cancelAnimationFrame(this._animFr);
    if (this._el) this._el.style.display = 'none';
  }
};

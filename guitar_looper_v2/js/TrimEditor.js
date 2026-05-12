var GL = GL || {};

GL.trimEditor = {
  _canvas:   null,
  _dragging: null,
  _getState: null,
  _onUpdate: null,

  init(canvas, getState, onUpdate) {
    this._canvas   = canvas;
    this._getState = getState;
    this._onUpdate = onUpdate;

    canvas.addEventListener('mousedown', e => this._onDown(e));
    canvas.addEventListener('touchstart', e => this._onDown(e), { passive: false });
    window.addEventListener('mousemove', e => this._onMove(e));
    window.addEventListener('touchmove', e => this._onMove(e), { passive: false });
    window.addEventListener('mouseup',  () => { this._dragging = null; });
    window.addEventListener('touchend', () => { this._dragging = null; });
  },

  _getRelX(e) {
    const r = this._canvas.getBoundingClientRect();
    return ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width;
  },

  _onDown(e) {
    const { loopDuration, trimStart, trimEnd } = this._getState();
    if (!loopDuration) return;
    e.preventDefault();
    const rx = this._getRelX(e);
    const sx = trimStart / loopDuration, ex = trimEnd / loopDuration;
    if      (Math.abs(rx - sx) < 0.03) this._dragging = 'start';
    else if (Math.abs(rx - ex) < 0.03) this._dragging = 'end';
  },

  _onMove(e) {
    if (!this._dragging) return;
    const { loopDuration, trimStart, trimEnd, bpm } = this._getState();
    if (!loopDuration) return;
    e.preventDefault();
    const rx     = Math.max(0, Math.min(1, this._getRelX(e)));
    const t      = rx * loopDuration;
    const minLen = 60 / bpm;
    let newStart = trimStart, newEnd = trimEnd;
    if (this._dragging === 'start') {
      newStart = Math.max(0, Math.min(t, trimEnd - minLen));
    } else {
      newEnd = Math.min(loopDuration, Math.max(t, trimStart + minLen));
    }
    this._onUpdate({ trimStart: newStart, trimEnd: newEnd });
  }
};

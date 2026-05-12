var GL = GL || {};

GL.countIn = {
  _active:       false,
  _timer:        null,
  _playClick:    null,
  _flashDot:     null,
  _getBpm:         () => 120,
  _getBeatsPerBar: () => 4,
  _onTick:    null,
  _onDone:    null,
  _onCancel:  null,

  configure(opts) {
    if (opts.playClick)     this._playClick     = opts.playClick;
    if (opts.flashDot)      this._flashDot      = opts.flashDot;
    if (opts.getBpm)        this._getBpm        = opts.getBpm;
    if (opts.getBeatsPerBar)this._getBeatsPerBar= opts.getBeatsPerBar;
    if (opts.onTick)        this._onTick        = opts.onTick;
    if (opts.onDone)        this._onDone        = opts.onDone;
    if (opts.onCancel)      this._onCancel      = opts.onCancel;
  },

  get active() { return this._active; },

  // Cuenta 2 compases completos antes de grabar
  start() {
    this._active = true;
    const bpm         = this._getBpm();
    const beatsPerBar = this._getBeatsPerBar();
    const totalBeats  = 2 * beatsPerBar;   // siempre 2 compases
    const ms          = 60000 / bpm;
    let i = 0;

    const tick = () => {
      const bar  = Math.floor(i / beatsPerBar) + 1; // 1 o 2
      const beat = (i % beatsPerBar) + 1;            // 1..beatsPerBar
      if (this._playClick) this._playClick(beat === 1);
      if (this._flashDot)  this._flashDot();
      if (this._onTick)    this._onTick(bar, beat, beatsPerBar, totalBeats - i);
      i++;
      if (i < totalBeats) {
        this._timer = setTimeout(tick, ms);
      } else {
        this._timer = setTimeout(() => {
          this._active = false;
          if (this._onDone) this._onDone();
        }, ms);
      }
    };
    tick();
  },

  cancel() {
    clearTimeout(this._timer);
    this._active = false;
    if (this._onCancel) this._onCancel();
  }
};

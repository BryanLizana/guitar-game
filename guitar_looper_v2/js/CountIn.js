var GL = GL || {};

GL.countIn = {
  _active:    false,
  _timer:     null,
  _playClick: null,
  _flashDot:  null,
  _getBpm:    () => 120,
  _onTick:    null,
  _onDone:    null,
  _onCancel:  null,

  configure(opts) {
    if (opts.playClick) this._playClick = opts.playClick;
    if (opts.flashDot)  this._flashDot  = opts.flashDot;
    if (opts.getBpm)    this._getBpm    = opts.getBpm;
    if (opts.onTick)    this._onTick    = opts.onTick;
    if (opts.onDone)    this._onDone    = opts.onDone;
    if (opts.onCancel)  this._onCancel  = opts.onCancel;
  },

  get active() { return this._active; },

  start() {
    this._active = true;
    const ms     = 60000 / this._getBpm();
    const labels = ['1', '2', '3'];
    let i = 0;

    const tick = () => {
      if (this._playClick) this._playClick(i === 0);
      if (this._flashDot)  this._flashDot();
      if (this._onTick)    this._onTick(labels[i], 3 - i);
      i++;
      if (i < 3) {
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

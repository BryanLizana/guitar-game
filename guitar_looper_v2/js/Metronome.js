var GL = GL || {};

GL.metronome = {
  on:    false,
  muted: false,
  _timer:        null,
  _beat:         0,
  _nextBeatTime: 0,
  _onUI:           null,
  _onFlash:        null,
  _getBpm:         () => 120,
  _getBeatsPerBar: () => 4,
  _getLoopInfo:    () => ({ loopStart: 0, loopDuration: 0 }),

  configure(opts) {
    if (opts.getBpm)         this._getBpm         = opts.getBpm;
    if (opts.getBeatsPerBar) this._getBeatsPerBar = opts.getBeatsPerBar;
    if (opts.getLoopInfo)    this._getLoopInfo    = opts.getLoopInfo;
    if (opts.onUI)           this._onUI           = opts.onUI;
    if (opts.onFlash)        this._onFlash        = opts.onFlash;
  },

  playClick(first) {
    this._playClickAt(GL.audioEngine.audioCtx.currentTime, first);
  },

  start() {
    const ctx = GL.audioEngine.audioCtx;
    if (!ctx) GL.audioEngine.init();
    this.on = true;
    this._beat = 0;
    this._notifyUI();

    const bpm     = this._getBpm();
    const beatDur = 60 / bpm;
    const { loopStart, loopDuration } = this._getLoopInfo();

    if (loopDuration > 0 && loopStart > 0) {
      const elapsed   = ctx.currentTime - loopStart;
      const loopN     = Math.floor(Math.max(0, elapsed) / loopDuration);
      const curStart  = loopStart + loopN * loopDuration;
      const posInLoop = ctx.currentTime - curStart;
      const nextBeat  = Math.ceil(posInLoop / beatDur);
      this._nextBeatTime = curStart + nextBeat * beatDur;
      this._beat         = nextBeat;
    } else {
      this._nextBeatTime = ctx.currentTime;
      this._beat         = 0;
    }
    this._schedule();
  },

  stop() {
    clearTimeout(this._timer);
    this._timer = null;
    this.on = false;
    this._notifyUI();
  },

  mute(m) {
    this.muted = m;
    if (GL.audioEngine.metroGain) GL.audioEngine.metroGain.gain.value = m ? 0 : 1;
    this._notifyUI();
  },

  _playClickAt(time, first) {
    const ctx = GL.audioEngine.audioCtx;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(GL.audioEngine.metroGain);
    o.frequency.value = first ? 1200 : 880;
    g.gain.setValueAtTime(0.4, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    o.start(time); o.stop(time + 0.07);
  },

  _schedule() {
    if (!this.on) return;
    const ctx         = GL.audioEngine.audioCtx;
    const bpm         = this._getBpm();
    const beatsPerBar = this._getBeatsPerBar();
    const beatDur     = 60 / bpm;
    const { loopStart, loopDuration } = this._getLoopInfo();

    while (this._nextBeatTime < ctx.currentTime + 0.1) {
      if (!this.muted) {
        this._playClickAt(this._nextBeatTime, this._beat === 0);
        const d = Math.max(0, (this._nextBeatTime - ctx.currentTime) * 1000);
        if (this._onFlash) setTimeout(this._onFlash, d);
      }
      this._beat++;
      this._nextBeatTime += beatDur;

      if (loopDuration > 0 && loopStart > 0) {
        const prev    = this._nextBeatTime - beatDur;
        const elapsed = prev - loopStart;
        if (elapsed >= 0) {
          const boundary = loopStart + (Math.floor(elapsed / loopDuration) + 1) * loopDuration;
          if (boundary > prev && boundary <= this._nextBeatTime) {
            this._nextBeatTime = boundary;
            this._beat = 0;
          }
        }
      } else {
        this._beat = this._beat % beatsPerBar;
      }
    }
    this._timer = setTimeout(() => this._schedule(), 25);
  },

  _notifyUI() {
    if (this._onUI) this._onUI({ on: this.on, muted: this.muted });
  }
};

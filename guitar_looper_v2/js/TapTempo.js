var GL = GL || {};

GL.tapTempo = {
  _times: [],
  _onBpm: null,

  configure(opts) {
    if (opts.onBpm) this._onBpm = opts.onBpm;
  },

  tap() {
    const now = Date.now();
    if (this._times.length > 0 && now - this._times[this._times.length - 1] > 2000) {
      this._times = [];
    }
    this._times.push(now);
    if (this._times.length > 8) this._times.shift();
    if (this._times.length >= 2) {
      let sum = 0;
      for (let i = 1; i < this._times.length; i++) sum += this._times[i] - this._times[i - 1];
      const bpm = Math.max(40, Math.min(240, Math.round(60000 / (sum / (this._times.length - 1)))));
      if (this._onBpm) this._onBpm(bpm);
    }
  }
};

"use strict";

class ContextoAudio {
  constructor() {
    this._ctx = null;
  }

  obtener() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 44100,
      });
    }
    return this._ctx;
  }

  async reanudar() {
    const ctx = this.obtener();
    if (ctx.state === 'suspended') await ctx.resume();
    return ctx;
  }
}

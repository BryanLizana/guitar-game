var GL = GL || {};

GL.fxChain = {
  buildImpulse(decaySecs) {
    const ctx = GL.audioEngine.audioCtx;
    const sr  = ctx.sampleRate;
    const len = Math.round(sr * decaySecs);
    const buf = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-3 * i / len);
      }
    }
    return buf;
  },

  create(layer) {
    const ctx = GL.audioEngine.audioCtx;
    const fx  = {};
    fx.delay     = ctx.createDelay(1.0);   fx.delay.delayTime.value = 0.25;
    fx.feedback  = ctx.createGain();        fx.feedback.gain.value   = 0.3;
    fx.delayWet  = ctx.createGain();        fx.delayWet.gain.value   = 0;
    fx.convolver = ctx.createConvolver();  fx.convolver.buffer = this.buildImpulse(2);
    fx.reverbWet = ctx.createGain();        fx.reverbWet.gain.value  = 0;

    layer.gainNode.connect(fx.delay);
    fx.delay.connect(fx.feedback); fx.feedback.connect(fx.delay);
    fx.delay.connect(fx.delayWet); fx.delayWet.connect(ctx.destination);

    layer.gainNode.connect(fx.convolver);
    fx.convolver.connect(fx.reverbWet); fx.reverbWet.connect(ctx.destination);

    layer.fx = fx;
  },

  destroy(layer) {
    if (!layer.fx) return;
    const { delay, feedback, delayWet, convolver, reverbWet } = layer.fx;
    [delay, feedback, delayWet, convolver, reverbWet].forEach(n => {
      try { n.disconnect(); } catch (e) {}
    });
    layer.fx = null;
  }
};

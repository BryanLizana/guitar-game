var GL = GL || {};

GL.exporter = {
  async downloadMix(layers, trimStart, trimEnd) {
    if (!layers.length || !GL.audioEngine.audioCtx) return;
    const ctx    = GL.audioEngine.audioCtx;
    const dur    = trimEnd - trimStart;
    const sr     = ctx.sampleRate;
    const offCtx = new OfflineAudioContext(1, Math.round(dur * sr), sr);

    layers.filter(l => !l.muted && l.buffer).forEach(l => {
      const lS = l.aligned ? 0 : trimStart;
      const lE = l.aligned ? l.buffer.duration : trimEnd;
      const src  = offCtx.createBufferSource();
      src.buffer = l.buffer; src.loop = true; src.loopStart = lS; src.loopEnd = lE;
      const volG = offCtx.createGain(); volG.gain.value = l.vol != null ? l.vol : 1;
      src.connect(volG); volG.connect(offCtx.destination);

      if (l.fx) {
        if (l.fx.delayWet.gain.value > 0.001) {
          const dly = offCtx.createDelay(1.0); dly.delayTime.value = l.fx.delay.delayTime.value;
          const fb  = offCtx.createGain();     fb.gain.value        = l.fx.feedback.gain.value;
          const wet = offCtx.createGain();     wet.gain.value       = l.fx.delayWet.gain.value;
          volG.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(offCtx.destination);
        }
        if (l.fx.reverbWet.gain.value > 0.001) {
          const conv = offCtx.createConvolver(); conv.buffer    = l.fx.convolver.buffer;
          const wet  = offCtx.createGain();      wet.gain.value = l.fx.reverbWet.gain.value;
          volG.connect(conv); conv.connect(wet); wet.connect(offCtx.destination);
        }
      }
      src.start(0, lS);
    });

    const rendered = await offCtx.startRendering();
    const raw = rendered.getChannelData(0);
    const pcm = new Int16Array(raw.length);
    for (let i = 0; i < raw.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, raw[i] * 32767));

    const enc   = new lamejs.Mp3Encoder(1, sr, 128);
    const parts = []; const blk = 1152;
    for (let i = 0; i < pcm.length; i += blk) {
      const buf = enc.encodeBuffer(pcm.subarray(i, i + blk));
      if (buf.length > 0) parts.push(new Uint8Array(buf));
    }
    const tail = enc.flush();
    if (tail.length > 0) parts.push(new Uint8Array(tail));

    const blob = new Blob(parts, { type: 'audio/mpeg' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'guitar_loop.mp3'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

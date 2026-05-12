var GL = GL || {};

GL.waveformRenderer = {
  _peak(data, step, i) {
    let max = 0;
    for (let j = 0; j < step; j++) { const v = Math.abs(data[i * step + j] || 0); if (v > max) max = v; }
    return max;
  },

  drawMainWave(buffer, canvas, color) {
    if (!buffer) return;
    const data = buffer.getChannelData(0);
    const ctx  = canvas.getContext('2d');
    const W = canvas.width, H = 90;
    const c    = color || '#ef5350';
    const step = Math.max(1, Math.floor(data.length / W));

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#1e1e1e'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

    ctx.fillStyle = c.replace(')', ', .15)').replace('rgb', 'rgba');
    ctx.beginPath(); ctx.moveTo(0, H / 2);
    for (let i = 0; i < W; i++) ctx.lineTo(i, H / 2 - this._peak(data, step, i) * (H / 2 - 4));
    for (let i = W - 1; i >= 0; i--) ctx.lineTo(i, H / 2 + this._peak(data, step, i) * (H / 2 - 4));
    ctx.closePath(); ctx.fill();

    ctx.strokeStyle = c; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < W; i++) { const y = H/2 - this._peak(data,step,i)*(H/2-4); i===0?ctx.moveTo(i,y):ctx.lineTo(i,y); }
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < W; i++) { const y = H/2 + this._peak(data,step,i)*(H/2-4); i===0?ctx.moveTo(i,y):ctx.lineTo(i,y); }
    ctx.stroke();
  },

  drawTrackWave(buffer, canvas, color) {
    const data = buffer.getChannelData(0);
    const ctx  = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const step = Math.max(1, Math.floor(data.length / W));

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = color.replace(')', ', 0.15)').replace('rgb', 'rgba');
    ctx.beginPath(); ctx.moveTo(0, H / 2);
    for (let i = 0; i < W; i++) ctx.lineTo(i, H/2 - this._peak(data,step,i)*(H/2-2));
    for (let i = W - 1; i >= 0; i--) ctx.lineTo(i, H/2 + this._peak(data,step,i)*(H/2-2));
    ctx.closePath(); ctx.fill();

    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < W; i++) { const y = H/2-this._peak(data,step,i)*(H/2-2); i===0?ctx.moveTo(i,y):ctx.lineTo(i,y); }
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < W; i++) { const y = H/2+this._peak(data,step,i)*(H/2-2); i===0?ctx.moveTo(i,y):ctx.lineTo(i,y); }
    ctx.stroke();
  },

  drawRuler(canvas, bpm, beatsPerBar, trimStart, trimEnd) {
    const dur = trimEnd - trimStart;
    if (!dur) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = 20;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#161616'; ctx.fillRect(0, 0, W, H);
    let t = 0, beat = 0;
    while (t < dur) {
      const x = (t / dur) * W;
      const isBar = beat % beatsPerBar === 0;
      ctx.strokeStyle = isBar ? '#555' : '#2a2a2a'; ctx.lineWidth = isBar ? 1.5 : 0.8;
      ctx.beginPath(); ctx.moveTo(x, isBar ? 0 : 10); ctx.lineTo(x, H); ctx.stroke();
      if (isBar) { ctx.fillStyle='#555'; ctx.font='9px system-ui'; ctx.fillText((beat/beatsPerBar+1)+'', x+2, 10); }
      t += 60 / bpm; beat++;
    }
  },

  drawTrimOverlay(canvas, loopDuration, trimStart, trimEnd, bpm, beatsPerBar) {
    if (!loopDuration) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = 90;
    ctx.clearRect(0, 0, W, H);
    const sx = (trimStart / loopDuration) * W;
    const ex = (trimEnd   / loopDuration) * W;

    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(0, 0, sx, H); ctx.fillRect(ex, 0, W - ex, H);

    let t = trimStart, beat = 0;
    while (t < trimEnd) {
      const x = ((t - trimStart) / (trimEnd - trimStart)) * (ex - sx) + sx;
      const isBar = beat % beatsPerBar === 0;
      ctx.strokeStyle = isBar ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.1)';
      ctx.lineWidth = isBar ? 1.2 : 0.6;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      t += 60 / bpm; beat++;
    }

    ctx.fillStyle = '#66BB6A'; ctx.fillRect(sx, 0, 2, H);
    this._drawHandle(ctx, sx, H / 2, 'right');
    ctx.fillStyle = '#FFA726'; ctx.fillRect(ex - 2, 0, 2, H);
    this._drawHandle(ctx, ex, H / 2, 'left');
  },

  _drawHandle(ctx, x, y, side) {
    const w = 10, h = 20;
    ctx.beginPath();
    if (side === 'right') {
      ctx.moveTo(x,y-h/2); ctx.lineTo(x+w,y-h/2); ctx.lineTo(x+w,y+h/2); ctx.lineTo(x,y+h/2);
    } else {
      ctx.moveTo(x,y-h/2); ctx.lineTo(x-w,y-h/2); ctx.lineTo(x-w,y+h/2); ctx.lineTo(x,y+h/2);
    }
    ctx.closePath(); ctx.fill();
  }
};

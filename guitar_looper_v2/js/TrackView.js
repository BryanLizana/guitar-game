var GL = GL || {};

GL.trackView = {
  create(layer, index, { onDelete } = {}) {
    const wrap = document.createElement('div');
    const row  = document.createElement('div'); row.className = 'track';

    const dot = document.createElement('div');
    dot.className = 't-dot'; dot.style.background = layer.color;

    const nm = document.createElement('span');
    nm.className = 't-name'; nm.textContent = 'Pista ' + (index + 1);

    const cv = document.createElement('canvas');
    cv.className = 't-wave'; cv.width = 300; cv.height = 32;

    const vs = document.createElement('input');
    vs.type = 'range'; vs.min = 0; vs.max = 100; vs.value = 100;
    vs.className = 't-vol'; vs.title = 'Volumen';
    vs.oninput = () => {
      layer.vol = vs.value / 100;
      if (layer.gainNode) {
        layer.gainNode.gain.setTargetAtTime(
          layer.muted ? 0 : layer.vol, GL.audioEngine.audioCtx.currentTime, 0.01
        );
      }
    };

    const mb = document.createElement('button');
    mb.className = 'tbtn'; mb.textContent = 'Mutear';
    mb.onclick = () => {
      layer.muted = !layer.muted;
      mb.textContent = layer.muted ? 'Activar' : 'Mutear';
      mb.classList.toggle('muted', layer.muted);
      if (layer.gainNode) {
        layer.gainNode.gain.setTargetAtTime(
          layer.muted ? 0 : layer.vol, GL.audioEngine.audioCtx.currentTime, 0.01
        );
      }
    };

    const fxBtn = document.createElement('button');
    fxBtn.className = 'tbtn'; fxBtn.textContent = 'FX';

    const db = document.createElement('button');
    db.className = 'tbtn'; db.textContent = 'Borrar';
    db.onclick = () => { if (onDelete) onDelete(layer, wrap); };

    row.append(dot, nm, cv, vs, mb, fxBtn, db);

    const fxRow = this._buildFxPanel(layer);
    fxBtn.onclick = () => {
      const open = !fxRow.classList.contains('open');
      fxRow.classList.toggle('open', open);
      fxBtn.classList.toggle('fx-on', open);
    };

    wrap.appendChild(row);
    wrap.appendChild(fxRow);
    GL.waveformRenderer.drawTrackWave(layer.buffer, cv, layer.color);
    return wrap;
  },

  _slider(label, min, max, val, unit, onChange) {
    const g  = document.createElement('span'); g.className = 'fx-ctl';
    const lb = document.createElement('span'); lb.textContent = label + ':';
    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = min; sl.max = max; sl.value = val;
    const vd = document.createElement('span'); vd.className = 'fx-val'; vd.textContent = val + unit;
    sl.oninput = () => { vd.textContent = sl.value + unit; onChange(+sl.value); };
    g.append(lb, sl, vd);
    return g;
  },

  _buildFxPanel(layer) {
    const fxRow = document.createElement('div'); fxRow.className = 'track-fx';

    const dlySec = document.createElement('div'); dlySec.className = 'fx-sec';
    const dlyLbl = document.createElement('span'); dlyLbl.className = 'fx-sec-lbl'; dlyLbl.textContent = 'Delay';
    dlySec.append(
      dlyLbl,
      this._slider('T',  50,500,250,'ms', v => { if(layer.fx) layer.fx.delay.delayTime.setTargetAtTime(v/1000, GL.audioEngine.audioCtx.currentTime, 0.01); }),
      this._slider('Fb',  0, 80, 30, '%', v => { if(layer.fx) layer.fx.feedback.gain.setTargetAtTime(v/100,   GL.audioEngine.audioCtx.currentTime, 0.01); }),
      this._slider('Mix', 0,100,  0, '%', v => { if(layer.fx) layer.fx.delayWet.gain.setTargetAtTime(v/100*0.9, GL.audioEngine.audioCtx.currentTime, 0.01); })
    );

    const rvbSec = document.createElement('div'); rvbSec.className = 'fx-sec';
    const rvbLbl = document.createElement('span'); rvbLbl.className = 'fx-sec-lbl'; rvbLbl.textContent = 'Reverb';
    rvbSec.append(
      rvbLbl,
      this._slider('Sala', 1,10, 5,'', v => { if(layer.fx) layer.fx.convolver.buffer = GL.fxChain.buildImpulse(0.3+(v-1)/9*3.7); }),
      this._slider('Mix',  0,100,0,'%', v => { if(layer.fx) layer.fx.reverbWet.gain.setTargetAtTime(v/100*0.8, GL.audioEngine.audioCtx.currentTime, 0.01); })
    );

    fxRow.append(dlySec, rvbSec);
    return fxRow;
  }
};

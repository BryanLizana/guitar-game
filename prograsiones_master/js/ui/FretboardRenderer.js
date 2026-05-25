// Responsible only for drawing the fretboard canvas
class FretboardRenderer {
  constructor(canvas, data) {
    this._cv  = canvas;
    this._cx  = canvas.getContext('2d');
    this._d   = data;
    this._FW  = 52;   // fret width
    this._SH  = 52;   // string spacing
    this._ML  = 72;   // margin left
    this._MT  = 50;   // margin top
    this._NF  = 14;   // num frets17
    this._DOT = [3,5,7,9,12,15,17];
    this._DBL = new Set([12]);

    canvas.width  = this._ML + this._NF * this._FW + 28;
    canvas.height = this._MT + 5 * this._SH + 72;
  }

  render(pos, chord, scaleLabel) {
    this._clear();
    this._drawWood();
    this._drawInlays();
    this._drawScaleNotes(pos.scale, chord);
    this._drawNut();
    this._drawFrets();
    this._drawStrings();
    this._drawChordNotes(pos.chord);
    this._drawStringLabels();
    this._drawFretNumbers();
    this._drawChordInfo(chord, scaleLabel);
  }

  // ── private ──────────────────────────────────────────────────────────────

  _clear() {
    const { _cv:cv, _cx:cx } = this;
    cx.fillStyle = '#0d0d14';
    cx.fillRect(0, 0, cv.width, cv.height);
  }

  _drawWood() {
    const { _cx:cx, _ML:ML, _MT:MT, _SH:SH, _NF:NF, _FW:FW, _cv:cv } = this;
    const fbT = MT - 12, fbB = MT + 5*SH + 12;
    const g = cx.createLinearGradient(ML, 0, cv.width, 0);
    g.addColorStop(0,   '#3a2010');
    g.addColorStop(0.4, '#5a3018');
    g.addColorStop(0.8, '#472818');
    g.addColorStop(1,   '#2a1608');
    cx.fillStyle = g;
    cx.beginPath();
    cx.roundRect(ML - 5, fbT, cv.width - ML - 10, fbB - fbT, 6);
    cx.fill();
  }

  _drawInlays() {
    const { _cx:cx, _ML:ML, _MT:MT, _SH:SH, _FW:FW, _DOT, _DBL } = this;
    _DOT.forEach(f => {
      const x = ML + f*FW - FW/2;
      cx.fillStyle = 'rgba(210,175,110,0.16)';
      if (_DBL.has(f)) {
        [MT + 0.8*SH, MT + 4.2*SH].forEach(y => {
          cx.beginPath(); cx.arc(x, y, 7, 0, Math.PI*2); cx.fill();
        });
      } else {
        cx.beginPath(); cx.arc(x, MT + 2.5*SH, 7, 0, Math.PI*2); cx.fill();
      }
    });
  }

  _drawScaleNotes(scalePos, chord) {
    const { _cx:cx, _ML:ML, _MT:MT, _SH:SH, _FW:FW, _d:d } = this;
    scalePos.forEach(({ s, f, note, iv }) => {
      const x   = f === 0 ? ML - 24 : ML + f*FW - FW/2;
      const y   = MT + s*SH;
      const col = d.DEGREES[iv].c;
      cx.save();
      cx.strokeStyle = this._rgba(col, 0.38);
      cx.fillStyle   = this._rgba(col, 0.10);
      cx.lineWidth   = 1.5;
      cx.setLineDash([3, 3]);
      cx.beginPath(); cx.arc(x, y, 11, 0, Math.PI*2);
      cx.fill(); cx.stroke();
      cx.setLineDash([]);
      cx.fillStyle = this._rgba(col, 0.5);
      cx.font = '7px sans-serif';
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText(d.DEGREES[iv].n, x, y);
      cx.restore();
    });
  }

  _drawNut() {
    const { _cx:cx, _ML:ML, _MT:MT, _SH:SH } = this;
    const fbT = MT - 12, fbB = MT + 5*SH + 12;
    const g = cx.createLinearGradient(ML-5, 0, ML+4, 0);
    g.addColorStop(0, '#e8d8b8'); g.addColorStop(1, '#9a7858');
    cx.fillStyle = g;
    cx.fillRect(ML - 5, fbT, 9, fbB - fbT);
  }

  _drawFrets() {
    const { _cx:cx, _ML:ML, _MT:MT, _SH:SH, _NF:NF, _FW:FW } = this;
    const fbT = MT - 12, fbB = MT + 5*SH + 12;
    for (let f = 1; f <= NF; f++) {
      const x = ML + f*FW;
      cx.strokeStyle = f === 12 ? '#999' : '#504848';
      cx.lineWidth   = f === 12 ? 2 : 1.2;
      cx.beginPath(); cx.moveTo(x, fbT); cx.lineTo(x, fbB); cx.stroke();
    }
  }

  _drawStrings() {
    const { _cx:cx, _ML:ML, _MT:MT, _SH:SH, _cv:cv, _d:d } = this;
    for (let s = 0; s < 6; s++) {
      const y = MT + s*SH, t = d.STRING_THICK[s];
      const g = cx.createLinearGradient(0, y-t, 0, y+t);
      g.addColorStop(0,    '#f0e0b0');
      g.addColorStop(0.45, '#c8a060');
      g.addColorStop(1,    '#906030');
      cx.strokeStyle = g; cx.lineWidth = t;
      cx.beginPath(); cx.moveTo(ML, y); cx.lineTo(cv.width - 10, y); cx.stroke();
    }
  }

  _drawChordNotes(chordPos) {
    const { _cx:cx, _ML:ML, _MT:MT, _SH:SH, _FW:FW, _d:d } = this;
    cx.save();
    chordPos.forEach(({ s, f, note, iv }) => {
      const x   = f === 0 ? ML - 24 : ML + f*FW - FW/2;
      const y   = MT + s*SH;
      const col = d.DEGREES[iv].c;
      const R   = 15;

      cx.shadowColor = col; cx.shadowBlur = 16;
      const cg = cx.createRadialGradient(x-4, y-4, 2, x, y, R);
      cg.addColorStop(0, this._rgba(col, 1));
      cg.addColorStop(1, this._rgba(col, 0.75));
      cx.fillStyle = cg;
      cx.beginPath(); cx.arc(x, y, R, 0, Math.PI*2); cx.fill();
      cx.shadowBlur = 0;

      const tc  = this._textColor(col);
      const lbl = d.NOTES[note];
      cx.fillStyle = tc;
      cx.font = `bold ${lbl.length > 1 ? 8 : 10}px sans-serif`;
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText(lbl, x, y - 3);

      cx.font = '7px sans-serif';
      cx.fillText(d.DEGREES[iv].n, x, y + 6);

      // Degree label below circle
      cx.fillStyle = this._rgba(col, 0.85);
      cx.font = 'bold 9px sans-serif';
      cx.textBaseline = 'top';
      cx.fillText(d.DEGREES[iv].n, x, y + R + 3);
    });
    cx.restore();
  }

  _drawStringLabels() {
    const { _cx:cx, _ML:ML, _MT:MT, _SH:SH, _d:d } = this;
    for (let s = 0; s < 6; s++) {
      cx.font = 'bold 12px monospace';
      cx.fillStyle = '#c8a96e';
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText(d.STRING_NAMES[s], ML - 48, MT + s*SH);
    }
  }

  _drawFretNumbers() {
    const { _cx:cx, _ML:ML, _MT:MT, _SH:SH, _NF:NF, _FW:FW } = this;
    const fbB = MT + 5*SH + 12;
    cx.font = '11px monospace'; cx.fillStyle = '#555'; cx.textAlign = 'center';
    for (let f = 1; f <= NF; f++) {
      cx.fillText(f, ML + f*FW - FW/2, fbB + 18);
    }
  }

  _drawChordInfo(chord, scaleLabel) {
    const { _cx:cx, _cv:cv, _d:d } = this;
    cx.textAlign = 'left'; cx.textBaseline = 'top';
    cx.font = 'bold 16px sans-serif'; cx.fillStyle = '#c8a96e';
    cx.fillText(chord.name, 10, 8);
    cx.font = '11px sans-serif'; cx.fillStyle = '#666';
    cx.fillText(chord.noteNames.join('  '), 10, 28);
    if (scaleLabel) {
      cx.font = '11px sans-serif';
      cx.fillStyle = 'rgba(80,180,200,0.65)';
      cx.textAlign = 'right';
      cx.fillText(`Escala: ${scaleLabel}`, cv.width - 14, 8);
    }
  }

  // ── helpers ──────────────────────────────────────────────────
  _rgba(hex, a) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  _textColor(hex) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return (r*299 + g*587 + b*114) / 1000 > 145 ? '#000' : '#fff';
  }
}

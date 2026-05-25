/**
 * Chord network overlay on Captura.png.
 * Image (2012×2016) drawn at 780×780; node circles calibrated to align.
 * Center=(390,390), R_I=340 → scale ≈ 877/2012 image px.
 * No arrows drawn — image provides them.
 */
class ChordDiagramUI {
  constructor(canvas, data, onSelect) {
    this._cv       = canvas;
    this._cx       = canvas.getContext('2d');
    this._d        = data;
    this._onSelect = onSelect;

    canvas.width  = 780;
    canvas.height = 780;

    this._zoom = 1;
    this._pan  = { x: 0, y: 0 };
    this._drag = { on: false, x0: 0, y0: 0, px: 0, py: 0 };
    this._selected = null;
    this._hovered  = null;

    this._img = new Image();
    this._img.onload = () => this.draw();
    this._img.src = 'Captura.png';

    this._build();
    this._bindEvents();
    this.draw();
  }

  // ── Node layout ─────────────────────────────────────────────
  _build() {
    // All positions derived from pixel-scan of Captura.png (2012×2016 → 780×780 canvas)
    const OX = 386, OY = 401;
    const R_I  = 306;   // major / I  (outer ring)
    const R_va = 249;   // aug   / V+
    const R_v7 = 193;   // dom7  / V7
    const R_ii = 139;   // minor / ii

    const ATOMS = [
      { root:'C',  va:'G+',  v7:'G7',  ii:'Dm'  },
      { root:'G',  va:'D+',  v7:'D7',  ii:'Am'  },
      { root:'D',  va:'A+',  v7:'A7',  ii:'Em'  },
      { root:'A',  va:'E+',  v7:'E7',  ii:'Bm'  },
      { root:'E',  va:'B+',  v7:'B7',  ii:'F#m' },
      { root:'B',  va:'F#+', v7:'F#7', ii:'C#m' },
      { root:'Gb', va:'Db+', v7:'Db7', ii:'Abm' },
      { root:'Db', va:'Ab+', v7:'Ab7', ii:'Ebm' },
      { root:'Ab', va:'Eb+', v7:'Eb7', ii:'Bbm' },
      { root:'Eb', va:'Bb+', v7:'Bb7', ii:'Fm'  },
      { root:'Bb', va:'F+',  v7:'F7',  ii:'Cm'  },
      { root:'F',  va:'C+',  v7:'C7',  ii:'Gm'  },
    ];

    this._nodes = [];

    // 12 atoms × 4 nodes (pure radial, no perp offset)
    ATOMS.forEach((def, i) => {
      const a  = i * Math.PI / 6 - Math.PI / 2;  // COF: C at top
      const rx = Math.cos(a), ry = Math.sin(a);
      this._nodes.push({ id: def.root, x: OX + R_I  * rx, y: OY + R_I  * ry, r: 17, color: '#ff4455', type: 'maj'  });
      this._nodes.push({ id: def.va,   x: OX + R_va * rx, y: OY + R_va * ry, r: 17, color: '#33dd55', type: 'aug'  });
      this._nodes.push({ id: def.v7,   x: OX + R_v7 * rx, y: OY + R_v7 * ry, r: 17, color: '#ffcc00', type: 'dom7' });
      this._nodes.push({ id: def.ii,   x: OX + R_ii * rx, y: OY + R_ii * ry, r: 17, color: '#4499ff', type: 'min'  });
    });

    // Inner Coltrane octagon — positions from pixel-scan of Captura.png
    [
      { id: 'C',   x: 428, y: 345, color: '#ff4455' },
      { id: 'G7',  x: 378, y: 353, color: '#ffcc00' },
      { id: 'Eb',  x: 328, y: 365, color: '#ff4455' },
      { id: 'Bb7', x: 340, y: 414, color: '#ffcc00' },
      { id: 'Gb',  x: 352, y: 460, color: '#ff4455' },
      { id: 'Db7', x: 399, y: 450, color: '#ffcc00' },
      { id: 'A',   x: 448, y: 440, color: '#ff4455' },
      { id: 'E7',  x: 438, y: 390, color: '#ffcc00' },
    ].forEach(def => {
      this._nodes.push({
        id: def.id, x: def.x, y: def.y,
        r: 17, color: def.color,
        type: def.color === '#ff4455' ? 'maj' : 'dom7',
      });
    });
  }

  // ── Draw ────────────────────────────────────────────────────
  draw() {
    const { _cv: cv, _cx: cx } = this;
    cx.fillStyle = '#000';
    cx.fillRect(0, 0, cv.width, cv.height);

    cx.save();
    cx.translate(this._pan.x, this._pan.y);
    cx.scale(this._zoom, this._zoom);

    // Background image (fills the 780×780 logical space)
    if (this._img.complete && this._img.naturalWidth > 0) {
      cx.drawImage(this._img, 0, 0, 780, 780);
    }

    // Interactive overlay circles
    this._nodes.forEach(n => this._drawNode(n));

    cx.restore();

    // Zoom hint
    cx.fillStyle = 'rgba(80,80,130,0.55)';
    cx.font = '10px monospace';
    cx.textAlign = 'right';
    cx.textBaseline = 'bottom';
    cx.fillText(`${Math.round(this._zoom * 100)}%  ↕scroll  ✥drag`, cv.width - 6, cv.height - 4);
  }

  _drawNode(n) {
    const cx  = this._cx;
    const sel = this._selected?.id === n.id;
    const hov = this._hovered?.id  === n.id;

    cx.save();
    if (sel)      { cx.shadowColor = n.color; cx.shadowBlur = 22; }
    else if (hov) { cx.shadowColor = n.color; cx.shadowBlur = 14; }

    // Fill: nearly transparent normally, opaque when active
    cx.fillStyle = this._rgba(n.color, sel ? 0.60 : hov ? 0.38 : 0.08);
    cx.beginPath(); cx.arc(n.x, n.y, n.r, 0, Math.PI * 2); cx.fill();

    // Border ring
    cx.strokeStyle = this._rgba(n.color, sel ? 1 : hov ? 0.90 : 0.55);
    cx.lineWidth   = sel ? 2.5 : hov ? 2 : 1.5;
    cx.stroke();
    cx.shadowBlur  = 0;

    // Chord-tone tooltip when selected
    if (sel) {
      const { root, suffix } = this._parseId(n.id);
      const { NOTES, ALIAS, CHORD_INTERVALS } = this._d;
      const ri  = NOTES.indexOf(ALIAS[root] || root);
      const ivs = CHORD_INTERVALS[suffix];
      if (ivs && ri >= 0) {
        const txt = ivs.map(iv => NOTES[(ri + iv) % 12]).join(' ');
        cx.font         = 'bold 11px sans-serif';
        cx.textAlign    = 'center';
        cx.textBaseline = 'bottom';
        const tw = cx.measureText(txt).width + 10;
        cx.fillStyle = 'rgba(0,0,0,0.72)';
        cx.fillRect(n.x - tw / 2, n.y - n.r - 22, tw, 16);
        cx.fillStyle = 'rgba(255,255,200,0.95)';
        cx.fillText(txt, n.x, n.y - n.r - 7);
      }
    }
    cx.restore();
  }

  // ── Events ──────────────────────────────────────────────────
  _bindEvents() {
    const cv = this._cv;
    cv.style.cursor = 'grab';

    cv.addEventListener('mousedown', e => {
      this._drag = { on: true, x0: e.clientX, y0: e.clientY,
                     px: this._pan.x, py: this._pan.y };
      cv.style.cursor = 'grabbing';
    });

    cv.addEventListener('mousemove', e => {
      if (this._drag.on) {
        this._pan.x = this._drag.px + (e.clientX - this._drag.x0);
        this._pan.y = this._drag.py + (e.clientY - this._drag.y0);
        this.draw(); return;
      }
      const lp   = this._toLoc(e.clientX, e.clientY);
      const node = this._nodeAt(lp.x, lp.y);
      if (node !== this._hovered) {
        this._hovered   = node;
        cv.style.cursor = node ? 'pointer' : 'grab';
        this.draw();
      }
    });

    cv.addEventListener('mouseup', e => {
      const moved = Math.hypot(e.clientX - this._drag.x0, e.clientY - this._drag.y0) > 5;
      this._drag.on   = false;
      cv.style.cursor = 'grab';
      if (!moved) {
        const lp   = this._toLoc(e.clientX, e.clientY);
        const node = this._nodeAt(lp.x, lp.y);
        if (node) { this._selected = node; this.draw(); this._onSelect(node.id); }
      }
    });

    cv.addEventListener('mouseleave', () => {
      this._drag.on = false; this._hovered = null;
      cv.style.cursor = 'grab'; this.draw();
    });

    cv.addEventListener('wheel', e => {
      e.preventDefault();
      const f    = e.deltaY < 0 ? 1.1 : 0.91;
      const rect = cv.getBoundingClientRect();
      const mx   = (e.clientX - rect.left) * (cv.width  / rect.width);
      const my   = (e.clientY - rect.top)  * (cv.height / rect.height);
      this._pan.x = mx - (mx - this._pan.x) * f;
      this._pan.y = my - (my - this._pan.y) * f;
      this._zoom  = Math.max(0.3, Math.min(5, this._zoom * f));
      this.draw();
    }, { passive: false });

    cv.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      this._drag = { on: true, x0: t.clientX, y0: t.clientY,
                     px: this._pan.x, py: this._pan.y };
    }, { passive: false });

    cv.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!this._drag.on) return;
      const t = e.touches[0];
      this._pan.x = this._drag.px + (t.clientX - this._drag.x0);
      this._pan.y = this._drag.py + (t.clientY - this._drag.y0);
      this.draw();
    }, { passive: false });

    cv.addEventListener('touchend', e => {
      const t     = e.changedTouches[0];
      const moved = Math.hypot(t.clientX - this._drag.x0, t.clientY - this._drag.y0) > 8;
      this._drag.on = false;
      if (!moved) {
        const lp   = this._toLoc(t.clientX, t.clientY);
        const node = this._nodeAt(lp.x, lp.y);
        if (node) { this._selected = node; this.draw(); this._onSelect(node.id); }
      }
    });
  }

  // ── Public ──────────────────────────────────────────────────
  setSelected(id) {
    this._selected = this._nodes.find(n => n.id === id) || null;
    this.draw();
  }
  resetView() { this._pan = { x: 0, y: 0 }; this._zoom = 1; this.draw(); }

  // ── Helpers ─────────────────────────────────────────────────
  _parseId(id) {
    const m = id.match(/^([A-G][#b]?)(.*)/);
    return m ? { root: m[1], suffix: m[2] } : { root: id, suffix: '' };
  }

  _toLoc(cx, cy) {
    const rect = this._cv.getBoundingClientRect();
    return {
      x: ((cx - rect.left) * (this._cv.width  / rect.width)  - this._pan.x) / this._zoom,
      y: ((cy - rect.top)  * (this._cv.height / rect.height) - this._pan.y) / this._zoom,
    };
  }

  _nodeAt(lx, ly) {
    let best = null, bestD = Infinity;
    this._nodes.forEach(n => {
      const d = Math.hypot(n.x - lx, n.y - ly);
      if (d <= n.r + 5 && d < bestD) { best = n; bestD = d; }
    });
    return best;
  }

  _rgba(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
}

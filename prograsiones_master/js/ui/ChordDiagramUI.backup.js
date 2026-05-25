/**
 * Recreates Captura.png exactly:
 *
 * Central octagon  (alternating major/dom7 a minor-3rd apart):
 *   C → G7 → Eb → Bb7 → Gb → Db7 → A → E7 → C
 *
 * 4 harmonic atoms (one per major chord in the octagon).
 * Each atom has 4 chord types arranged in a row/arc:
 *   • Major (red)     C
 *   • Aug   (green)   G+
 *   • Dom7  (yellow)  G7   ← shared with octagon
 *   • Minor (blue)    Dm
 *
 * Orbital ellipses group each atom visually.
 * Arrows: cycle (octagon), V7→I resolution, ii→V→I inside each atom.
 *
 * Controls: drag to pan · scroll-wheel to zoom · click to select.
 */
class ChordDiagramUI {
  constructor(canvas, data, onSelect) {
    this._cv       = canvas;
    this._cx       = canvas.getContext('2d');
    this._d        = data;
    this._onSelect = onSelect;

    canvas.width  = 520;
    canvas.height = 520;

    // ── View ─────────────────────────────────────────────────
    this._zoom = 0.62;
    this._pan  = { x: 0, y: 0 };
    this._drag = { on: false, x0: 0, y0: 0, px: 0, py: 0 };
    this._selected = null;
    this._hovered  = null;

    // ── Fixed node layout (logical coords, centre = 400,400) ──
    // Colors match Captura.png: red=major, yellow=dom7, green=aug, blue=minor
    const R = 170; // octagon radius
    const ox = 400, oy = 400;
    // Octagon angles: C top, then clockwise 45° steps
    const oa = (i) => (i * Math.PI / 4) - Math.PI / 2;
    const op = (i, r) => ({
      x: ox + r * Math.cos(oa(i)),
      y: oy + r * Math.sin(oa(i)),
    });

    const OCTAGON = [
      { id: 'C',   ...op(0, R), r: 21, color: '#ff4040', type: 'maj' },
      { id: 'G7',  ...op(1, R), r: 18, color: '#ffcc00', type: 'dom7' },
      { id: 'Eb',  ...op(2, R), r: 21, color: '#ff4040', type: 'maj' },
      { id: 'Bb7', ...op(3, R), r: 18, color: '#ffcc00', type: 'dom7' },
      { id: 'Gb',  ...op(4, R), r: 21, color: '#ff4040', type: 'maj' },
      { id: 'Db7', ...op(5, R), r: 18, color: '#ffcc00', type: 'dom7' },
      { id: 'A',   ...op(6, R), r: 21, color: '#ff4040', type: 'maj' },
      { id: 'E7',  ...op(7, R), r: 18, color: '#ffcc00', type: 'dom7' },
    ];

    // Satellite nodes: extend outward from each major chord
    // Direction = radially outward from center, offset perpendicular for aug/min
    const SAT_R = 290; // distance from center for aug/min satellites
    const sat = (slot, perpSign, dist) => {
      const angle = oa(slot);
      const perpAngle = angle + perpSign * Math.PI / 3.5;
      return { x: ox + dist * Math.cos(perpAngle), y: oy + dist * Math.sin(perpAngle) };
    };

    const SATS = [
      // C atom (slot 0, top)
      { id: 'G+', ...sat(0, -1, SAT_R), r: 16, color: '#33ee55', type: 'aug' },
      { id: 'Dm', ...sat(0, +1, SAT_R), r: 16, color: '#4499ff', type: 'min' },
      // Eb atom (slot 2, right)
      { id: 'Bb+', ...sat(2, -1, SAT_R), r: 16, color: '#33ee55', type: 'aug' },
      { id: 'Fm',  ...sat(2, +1, SAT_R), r: 16, color: '#4499ff', type: 'min' },
      // Gb atom (slot 4, bottom)
      { id: 'Db+', ...sat(4, -1, SAT_R), r: 16, color: '#33ee55', type: 'aug' },
      { id: 'Abm', ...sat(4, +1, SAT_R), r: 16, color: '#4499ff', type: 'min' },
      // A atom (slot 6, left)
      { id: 'E+',  ...sat(6, -1, SAT_R), r: 16, color: '#33ee55', type: 'aug' },
      { id: 'Bm',  ...sat(6, +1, SAT_R), r: 16, color: '#4499ff', type: 'min' },
    ];

    this._nodes = [...OCTAGON, ...SATS];

    // ── Connections ───────────────────────────────────────────
    this._CONNS = [
      // Octagon cycle  C→G7→Eb→Bb7→Gb→Db7→A→E7→C
      { a:'C',   b:'G7',  style:'cycle' },
      { a:'G7',  b:'Eb',  style:'cycle' },
      { a:'Eb',  b:'Bb7', style:'cycle' },
      { a:'Bb7', b:'Gb',  style:'cycle' },
      { a:'Gb',  b:'Db7', style:'cycle' },
      { a:'Db7', b:'A',   style:'cycle' },
      { a:'A',   b:'E7',  style:'cycle' },
      { a:'E7',  b:'C',   style:'cycle' },
      // V7 → I inside each atom (resolution)
      { a:'G7',  b:'C',   style:'resolv' },
      { a:'Bb7', b:'Eb',  style:'resolv' },
      { a:'Db7', b:'Gb',  style:'resolv' },
      { a:'E7',  b:'A',   style:'resolv' },
      // Aug satellites → major
      { a:'G+',  b:'C',   style:'aug' },
      { a:'Bb+', b:'Eb',  style:'aug' },
      { a:'Db+', b:'Gb',  style:'aug' },
      { a:'E+',  b:'A',   style:'aug' },
      // ii → V (minor → dom7 in same atom)
      { a:'Dm',  b:'G7',  style:'ii5' },
      { a:'Fm',  b:'Bb7', style:'ii5' },
      { a:'Abm', b:'Db7', style:'ii5' },
      { a:'Bm',  b:'E7',  style:'ii5' },
      // minor → major (direct)
      { a:'Dm',  b:'C',   style:'rel' },
      { a:'Fm',  b:'Eb',  style:'rel' },
      { a:'Abm', b:'Gb',  style:'rel' },
      { a:'Bm',  b:'A',   style:'rel' },
    ];

    // ── Orbital atoms (ellipse groups) ────────────────────────
    this._ATOMS = [
      ['C',  'G+',  'G7',  'Dm'],
      ['Eb', 'Bb+', 'Bb7', 'Fm'],
      ['Gb', 'Db+', 'Db7', 'Abm'],
      ['A',  'E+',  'E7',  'Bm'],
    ];

    this._centerView();
    this._bindEvents();
    this.draw();
  }

  // ── Public ─────────────────────────────────────────────────
  setSelected(id) {
    this._selected = this._nodes.find(n => n.id === id) || null;
    this.draw();
  }

  resetView() {
    this._centerView();
    this.draw();
  }

  // ── View helpers ────────────────────────────────────────────
  _centerView() {
    const cx = this._cv.width  / 2;
    const cy = this._cv.height / 2;
    this._pan = { x: cx - 400 * this._zoom, y: cy - 400 * this._zoom };
  }

  // ── Draw ────────────────────────────────────────────────────
  draw() {
    const { _cv: cv, _cx: cx } = this;
    cx.fillStyle = '#09090f';
    cx.fillRect(0, 0, cv.width, cv.height);

    cx.save();
    cx.translate(this._pan.x, this._pan.y);
    cx.scale(this._zoom, this._zoom);

    this._drawBgGlow();
    this._drawOrbits();
    this._drawConnections();
    this._drawNodes();

    cx.restore();

    // HUD
    cx.fillStyle = 'rgba(80,80,130,0.55)';
    cx.font = '10px monospace';
    cx.textAlign = 'right';
    cx.textBaseline = 'bottom';
    cx.fillText(`${Math.round(this._zoom * 100)}%  ↕scroll  ✥drag`, cv.width - 6, cv.height - 4);
  }

  _drawBgGlow() {
    const cx = this._cx;
    const g = cx.createRadialGradient(400, 400, 0, 400, 400, 340);
    g.addColorStop(0,   'rgba(80,20,100,0.22)');
    g.addColorStop(0.6, 'rgba(20,10,50,0.10)');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    cx.fillStyle = g;
    cx.fillRect(0, 0, 800, 800);
  }

  // Ellipse per atom: centered at centroid of its 4 nodes
  _drawOrbits() {
    const cx = this._cx;
    this._ATOMS.forEach(ids => {
      const ns = ids.map(id => this._nodes.find(n => n.id === id)).filter(Boolean);
      if (ns.length < 3) return;

      const ecx = ns.reduce((s, n) => s + n.x, 0) / ns.length;
      const ecy = ns.reduce((s, n) => s + n.y, 0) / ns.length;

      const dists = ns.map(n => Math.hypot(n.x - ecx, n.y - ecy));
      const maxD  = Math.max(...dists);
      const farN  = ns[dists.indexOf(maxD)];
      const rot   = Math.atan2(farN.y - ecy, farN.x - ecx);
      const ra    = maxD * 1.35;
      const rb    = ra  * 0.36;

      cx.save();
      cx.translate(ecx, ecy);
      cx.rotate(rot);
      cx.strokeStyle = 'rgba(210,190,255,0.18)';
      cx.lineWidth   = 1.5;
      cx.beginPath();
      cx.ellipse(0, 0, ra, rb, 0, 0, Math.PI * 2);
      cx.stroke();
      cx.restore();
    });
  }

  // Connection styling by type
  _connStyle(style) {
    return {
      cycle:  { color: 'rgba(255,200,0,0.55)',  lw: 1.8, dash: [],     arrow: true  },
      resolv: { color: 'rgba(255,80,80,0.50)',   lw: 1.4, dash: [],     arrow: true  },
      aug:    { color: 'rgba(80,240,120,0.30)',   lw: 1,   dash: [3,4],  arrow: false },
      ii5:    { color: 'rgba(100,180,255,0.45)', lw: 1.2, dash: [],     arrow: true  },
      rel:    { color: 'rgba(100,180,255,0.22)', lw: 0.8, dash: [2,5],  arrow: false },
    }[style] || {};
  }

  _drawConnections() {
    const cx = this._cx;
    this._CONNS.forEach(conn => {
      const na = this._nodes.find(n => n.id === conn.a);
      const nb = this._nodes.find(n => n.id === conn.b);
      if (!na || !nb) return;
      const s = this._connStyle(conn.style);
      cx.save();
      cx.strokeStyle = s.color;
      cx.lineWidth   = s.lw;
      cx.setLineDash(s.dash || []);
      this._drawArc(na, nb, s.arrow, s.color);
      cx.setLineDash([]);
      cx.restore();
    });
  }

  _drawArc(na, nb, arrow, color) {
    const cx = this._cx;
    const dx = nb.x - na.x, dy = nb.y - na.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    const gap = na.r + 2;
    const gapB = nb.r + 2;
    const sx = na.x + ux * gap, sy = na.y + uy * gap;
    const tx = nb.x - ux * gapB, ty = nb.y - uy * gapB;
    // Control point: perpendicular offset for slight curve
    const cpx = (sx + tx) / 2 - uy * 22;
    const cpy = (sy + ty) / 2 + ux * 22;

    cx.beginPath();
    cx.moveTo(sx, sy);
    cx.quadraticCurveTo(cpx, cpy, tx, ty);
    cx.stroke();

    if (arrow) {
      const tux = tx - cpx, tuy = ty - cpy;
      const tl  = Math.hypot(tux, tuy);
      const fux = tux / tl, fuy = tuy / tl;
      const AH  = 8;
      cx.fillStyle = color;
      cx.beginPath();
      cx.moveTo(tx, ty);
      cx.lineTo(tx - fux * AH + fuy * AH * 0.38, ty - fuy * AH - fux * AH * 0.38);
      cx.lineTo(tx - fux * AH - fuy * AH * 0.38, ty - fuy * AH + fux * AH * 0.38);
      cx.closePath();
      cx.fill();
    }
  }

  _drawNodes() {
    this._nodes.forEach(n => {
      const sel = this._selected && this._selected.id === n.id;
      const hov = this._hovered  && this._hovered.id  === n.id;
      this._drawNode(n, sel, hov);
    });
  }

  _drawNode(node, sel, hov) {
    const { _cx: cx, _d: d } = this;
    const { x, y, r, color, id } = node;

    cx.save();
    if (sel)      { cx.shadowColor = color; cx.shadowBlur = 24; }
    else if (hov) { cx.shadowColor = color; cx.shadowBlur = 14; }

    const a  = sel ? 1 : hov ? 0.95 : 0.78;
    const cg = cx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
    cg.addColorStop(0, this._rgba(color, a));
    cg.addColorStop(1, this._rgba(color, a * 0.52));
    cx.fillStyle = cg;
    cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
    cx.strokeStyle = sel ? '#fff' : this._rgba(color, hov ? 0.9 : 0.5);
    cx.lineWidth   = sel ? 2.5 : 1;
    cx.stroke();
    cx.shadowBlur  = 0;

    // Label
    const { root, suffix } = this._parseId(id);
    const tc = this._textColor(color);
    cx.textAlign = 'center'; cx.textBaseline = 'middle';

    if (suffix && r >= 18) {
      cx.fillStyle = tc;
      cx.font = `bold ${r < 20 ? 9 : 10}px sans-serif`;
      cx.fillText(root, x, y - 3.5);
      cx.font = `${r < 20 ? 7 : 8}px sans-serif`;
      cx.fillText(suffix, x, y + 5);
    } else {
      cx.fillStyle = tc;
      cx.font = `bold ${r <= 16 ? 9 : 10}px sans-serif`;
      cx.fillText(id, x, y);
    }

    // Show notes when selected
    if (sel) {
      const ri  = d.NOTES.indexOf(d.ALIAS[root] || root);
      const ivs = d.CHORD_INTERVALS[suffix];
      if (ivs && ri >= 0) {
        cx.font = '7px sans-serif';
        cx.fillStyle = this._rgba(color, 0.85);
        cx.textBaseline = 'top';
        cx.fillText(ivs.map(i => d.NOTES[(ri + i) % 12]).join(' '), x, y + r + 5);
      }
    }
    cx.restore();
  }

  // ── Events ─────────────────────────────────────────────────
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
      this._pan.x  = mx - (mx - this._pan.x) * f;
      this._pan.y  = my - (my - this._pan.y) * f;
      this._zoom   = Math.max(0.3, Math.min(4, this._zoom * f));
      this.draw();
    }, { passive: false });

    // Touch
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
      const t = e.changedTouches[0];
      const moved = Math.hypot(t.clientX - this._drag.x0, t.clientY - this._drag.y0) > 8;
      this._drag.on = false;
      if (!moved) {
        const lp   = this._toLoc(t.clientX, t.clientY);
        const node = this._nodeAt(lp.x, lp.y);
        if (node) { this._selected = node; this.draw(); this._onSelect(node.id); }
      }
    });
  }

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
    return this._nodes.find(n => Math.hypot(n.x - lx, n.y - ly) <= n.r + 3) || null;
  }

  _rgba(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  _textColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 145 ? '#000' : '#fff';
  }
}

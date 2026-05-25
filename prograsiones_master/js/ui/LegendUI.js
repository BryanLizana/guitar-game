// Responsible only for rendering and updating the degree color legend
class LegendUI {
  constructor(container, data) {
    this._el = container;
    this._d  = data;
    this._build();
  }

  highlight(activeIntervals) {
    const active = new Set(activeIntervals.map(i => i % 12));
    this._d.DEGREES.forEach((_, i) => {
      const item = document.getElementById(`leg-${i}`);
      if (item) item.classList.toggle('leg-on', active.has(i));
    });
  }

  // ── private ──────────────────────────────────────────────────
  _build() {
    this._el.innerHTML = '';
    this._d.DEGREES.forEach((deg, i) => {
      const div = document.createElement('div');
      div.className = 'leg-item';
      div.id = `leg-${i}`;
      div.innerHTML = `
        <span class="leg-dot" style="background:${deg.c};box-shadow:0 0 5px ${deg.c}"></span>
        <span class="leg-label">${deg.n} — ${deg.lng}</span>`;
      this._el.appendChild(div);
    });
  }
}

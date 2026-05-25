// Responsible only for parsing chord names and resolving their notes
class ChordService {
  constructor(data) {
    this._d = data;
  }

  // Returns full chord info object or null if name is invalid
  build(name) {
    const parsed = this._parse(name);
    if (!parsed) return null;
    const ri  = this._rootIdx(parsed.root);
    const ivs = this._d.CHORD_INTERVALS[parsed.type];
    if (!ivs || ri < 0) return null;
    const notes     = ivs.map(i => (ri + i) % 12);
    const noteNames = notes.map(n => this._d.NOTES[n]);
    return {
      name,
      ri,
      root: parsed.root,
      type: parsed.type,
      notes,
      noteNames,
      ivs,          // raw interval values (may include >11 for 9ths etc.)
    };
  }

  scaleNoteSet(rootIdx, scaleKey) {
    const ivs = this._d.SCALE_INTERVALS[scaleKey];
    if (!ivs) return new Set();
    return new Set(ivs.map(i => (rootIdx + i) % 12));
  }

  // ── private ──────────────────────────────────────────────────
  _parse(name) {
    const m = name.match(/^([A-G][#b]?)(.*)/);
    return m ? { root: m[1], type: m[2] } : null;
  }

  _rootIdx(root) {
    const canonical = this._d.ALIAS[root] || root;
    return this._d.NOTES.indexOf(canonical);
  }
}

// Responsible only for calculating note positions on the fretboard
class FretboardService {
  constructor(data) {
    this._d    = data;
    this.FRETS = 17;
  }

  // Returns { chord: [...], scale: [...] } position arrays
  positions(chord, scaleNotes) {
    const cSet = new Set(chord.notes);
    const res  = { chord: [], scale: [] };

    for (let s = 0; s < 6; s++) {
      for (let f = 0; f <= this.FRETS; f++) {
        const note = (this._d.STRING_TUNING[s] + f) % 12;
        const iv   = (note - chord.ri + 12) % 12;
        if (cSet.has(note)) {
          res.chord.push({ s, f, note, iv });
        } else if (scaleNotes && scaleNotes.has(note)) {
          res.scale.push({ s, f, note, iv });
        }
      }
    }
    return res;
  }
}

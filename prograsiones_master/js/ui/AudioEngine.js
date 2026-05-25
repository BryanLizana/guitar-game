class AudioEngine {
  constructor() {
    this._ctx   = null;
    this._muted = false;
    this._vol   = 0.72;
  }

  get muted()   { return this._muted; }
  set muted(v)  { this._muted = !!v; }
  set volume(v) { this._vol = Math.max(0, Math.min(1, v)); }

  playChord(chord) {
    if (this._muted) return;
    if (!this._ctx)
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this._ctx.state === 'suspended') this._ctx.resume();

    const voicing = this._voicing(chord.notes, chord.ri);
    const perNote = (this._vol * 0.6) / voicing.length;

    voicing.forEach(midi => this._beep(this._freq(midi), perNote));
  }

  // Sine wave: instant on, 1.4s sustain, clean fade
  _beep(freq, amp) {
    const ctx = this._ctx;
    const now = ctx.currentTime;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type            = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(amp, now);
    gain.gain.setValueAtTime(amp, now + 1.0);          // sustain
    gain.gain.linearRampToValueAtTime(0, now + 1.6);   // clean fade

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.7);
  }

  // Notas del acorde en octava 4-5 (C4 = MIDI 60, Do central)
  _voicing(notes, rootIdx) {
    const bass = 60 + rootIdx;
    const v    = [bass];
    let cur    = bass;

    notes.filter(n => n !== rootIdx).forEach(note => {
      let m = cur + 1;
      while (m % 12 !== note) m++;
      while (m - cur > 10) m -= 12;
      if (m <= cur) m += 12;
      v.push(m);
      cur = m;
    });

    if (cur < bass + 12) v.push(bass + 12);
    return v;
  }

  _freq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
}

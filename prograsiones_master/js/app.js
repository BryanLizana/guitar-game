(function () {
  'use strict';

  const data         = ChordsData;
  const chordSvc     = new ChordService(data);
  const fretboardSvc = new FretboardService(data);
  const fretboardRnd = new FretboardRenderer(document.getElementById('cv-fretboard'), data);
  const legendUI     = new LegendUI(document.getElementById('legend'), data);
  const audioEng     = new AudioEngine();
  const diagramUI    = new ChordDiagramUI(
    document.getElementById('cv-diagram'), data,
    name => {
      const btn = [...document.querySelectorAll('.cbtn')].find(b => b.textContent === name);
      if (btn) btn.click();
      else onChordSelected(name, null);
    }
  );

  const scaleSelect  = document.getElementById('scale-sel');
  const scaleSuggest = document.getElementById('scale-suggest');
  const chordNameEl  = document.getElementById('chord-name');
  const chordNotesEl = document.getElementById('chord-notes');

  // ── Audio controls ──────────────────────────────────────────
  const btnSound  = document.getElementById('btn-sound');
  const volSlider = document.getElementById('vol-slider');
  const volLabel  = document.getElementById('vol-label');

  btnSound.addEventListener('click', () => {
    audioEng.muted = !audioEng.muted;
    btnSound.textContent = audioEng.muted ? '🔇 Mudo' : '🔊 Sonido';
    btnSound.classList.toggle('muted', audioEng.muted);
  });

  volSlider.addEventListener('input', () => {
    audioEng.volume = volSlider.value / 100;
    volLabel.textContent = volSlider.value + '%';
  });

  let currentChord = null;
  let activeBtn    = null;

  // ── Chord groups ────────────────────────────────────────────
  // COF order: C G D A E B F# Db Ab Eb Bb F
  const COF = ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F'];

  const GROUPS = [
    { type:'maj',  label:'Mayor',   suffix:'',     chords: COF },
    { type:'min',  label:'Menor',   suffix:'m',    chords: COF },
    { type:'dom7', label:'Dom 7',   suffix:'7',    chords: COF },
    { type:'maj7', label:'Maj 7',   suffix:'maj7', chords: COF },
    { type:'min7', label:'Men 7',   suffix:'m7',   chords: COF },
    { type:'aug',  label:'Aug',     suffix:'+',    chords: COF },
    { type:'dim',  label:'Dim',     suffix:'dim',  chords: COF },
  ];

  // ── Build chord grid ────────────────────────────────────────
  const grid = document.getElementById('chord-grid');

  GROUPS.forEach(grp => {
    const row = document.createElement('div');
    row.className = 'chord-row';
    row.dataset.type = grp.type;

    const lbl = document.createElement('span');
    lbl.className = 'chord-row-label';
    lbl.textContent = grp.label;
    row.appendChild(lbl);

    grp.chords.forEach(root => {
      const name = root + grp.suffix;
      const btn  = document.createElement('button');
      btn.className = `cbtn t-${grp.type}`;
      btn.textContent = name;
      btn.title = name;
      btn.onclick = () => onChordSelected(name, btn);
      row.appendChild(btn);
    });

    grid.appendChild(row);
  });

  // ── Type filter tabs ────────────────────────────────────────
  document.querySelectorAll('.ttab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ttab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const type = tab.dataset.type;
      document.querySelectorAll('.chord-row').forEach(row => {
        row.classList.toggle('hidden', type !== 'all' && row.dataset.type !== type);
      });
    });
  });

  // ── Image tabs ──────────────────────────────────────────────
  const refImg = document.getElementById('ref-img');
  document.querySelectorAll('.itab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.itab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      refImg.src = tab.dataset.img;
    });
  });

  // ── Chord selection ────────────────────────────────────────
  function onChordSelected(name, btn) {
    const chord = chordSvc.build(name);
    if (!chord) return;
    currentChord = chord;

    if (activeBtn) activeBtn.classList.remove('active');
    activeBtn = btn;
    if (btn) btn.classList.add('active');

    chordNameEl.textContent  = chord.name;
    chordNotesEl.textContent = chord.noteNames.join('  ·  ');

    audioEng.playChord(chord);
    diagramUI.setSelected(chord.name);
    _autoSuggestScale(chord);
    _refresh();
  }

  scaleSelect.addEventListener('change', _refresh);

  scaleSuggest.addEventListener('click', () => {
    const key = scaleSuggest.dataset.key;
    if (key) { scaleSelect.value = key; _refresh(); }
  });

  // ── Refresh fretboard ───────────────────────────────────────
  function _refresh() {
    if (!currentChord) return;
    const sk         = scaleSelect.value;
    const scaleNotes = chordSvc.scaleNoteSet(currentChord.ri, sk);
    const pos        = fretboardSvc.positions(currentChord, scaleNotes);
    const scaleLbl   = sk ? data.SCALE_LABELS[sk] : '';
    fretboardRnd.render(pos, currentChord, scaleLbl);
    legendUI.highlight(currentChord.ivs);
  }

  // ── Scale auto-suggest ──────────────────────────────────────
  function _autoSuggestScale(chord) {
    const MAP = {
      '':     'major',        'm':    'minor',
      '7':    'mixolydian',   'maj7': 'major',
      'm7':   'dorian',       '+':    'melodic_minor',
      'dim':  'locrian',      'dim7': 'locrian',
      'sus4': 'major',        'sus2': 'major',
    };
    const key = MAP[chord.type];
    if (key) {
      scaleSuggest.textContent   = `✦ ${data.SCALE_LABELS[key]}`;
      scaleSuggest.dataset.key   = key;
      scaleSuggest.style.display = 'inline';
    } else {
      scaleSuggest.style.display = 'none';
    }
  }

  // ── Default ─────────────────────────────────────────────────
  const firstBtn = grid.querySelector('.cbtn');
  if (firstBtn) firstBtn.click();
})();

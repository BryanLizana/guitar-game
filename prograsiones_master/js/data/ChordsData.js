// Single source of truth — pure data, no logic
const ChordsData = (() => {

  const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

  const ALIAS = {
    Db:'C#', Eb:'D#', Fb:'E', Gb:'F#',
    Ab:'G#', Bb:'A#', Cb:'B'
  };

  // Interval formulas (semitones from root)
  const CHORD_INTERVALS = {
    '':     [0,4,7],
    'm':    [0,3,7],
    '7':    [0,4,7,10],
    'maj7': [0,4,7,11],
    'm7':   [0,3,7,10],
    '+':    [0,4,8],
    'dim':  [0,3,6],
    'dim7': [0,3,6,9],
    'm7b5': [0,3,6,10],
    'sus4': [0,5,7],
    'sus2': [0,2,7],
    '9':    [0,4,7,10,14],
    'add9': [0,4,7,14],
  };

  const SCALE_INTERVALS = {
    major:          [0,2,4,5,7,9,11],
    minor:          [0,2,3,5,7,8,10],
    dorian:         [0,2,3,5,7,9,10],
    mixolydian:     [0,2,4,5,7,9,10],
    penta_major:    [0,2,4,7,9],
    penta_minor:    [0,3,5,7,10],
    blues:          [0,3,5,6,7,10],
    harmonic_minor: [0,2,3,5,7,8,11],
    melodic_minor:  [0,2,3,5,7,9,11],
    lydian:         [0,2,4,6,7,9,11],
    phrygian:       [0,1,3,5,7,8,10],
    locrian:        [0,1,3,5,6,8,10],
  };

  const SCALE_LABELS = {
    major:          'Mayor (Jónica)',
    minor:          'Menor Natural (Eólica)',
    dorian:         'Dórica',
    mixolydian:     'Mixolidia',
    penta_major:    'Pentatónica Mayor',
    penta_minor:    'Pentatónica Menor',
    blues:          'Blues',
    harmonic_minor: 'Menor Armónica',
    melodic_minor:  'Menor Melódica',
    lydian:         'Lidia',
    phrygian:       'Frigia',
    locrian:        'Locria',
  };

  // 12 degree colors (one per semitone interval)
  const DEGREES = [
    { c:'#ff5500', n:'R',   lng:'Raíz'       },
    { c:'#ff2277', n:'b2',  lng:'2da menor'   },
    { c:'#ffe000', n:'2',   lng:'2da mayor'   },
    { c:'#88ee22', n:'b3',  lng:'3ra menor'   },
    { c:'#22dd88', n:'3',   lng:'3ra mayor'   },
    { c:'#22ddee', n:'4',   lng:'4ta justa'   },
    { c:'#9966ff', n:'b5',  lng:'Tritono'     },
    { c:'#4488ff', n:'5',   lng:'5ta justa'   },
    { c:'#cc44ff', n:'b6',  lng:'6ta menor'   },
    { c:'#ff44cc', n:'6',   lng:'6ta mayor'   },
    { c:'#ff9900', n:'b7',  lng:'7ma menor'   },
    { c:'#ee2255', n:'7',   lng:'7ma mayor'   },
  ];

  // Guitar standard tuning: e B G D A E  (high→low, displayed top→bottom)
  const STRING_TUNING = [4, 11, 7, 2, 9, 4];
  const STRING_NAMES  = ['e','B','G','D','A','E'];
  const STRING_THICK  = [1.0, 1.4, 1.9, 2.4, 3.0, 3.6];

  // Chord network nodes — mirrors the visual layout in the reference images.
  // Layout key: 'ring' (0=inner…3=outer) and 'slot' (0-11, clockwise from top)
  // type: 'maj'|'min'|'dom7'|'aug'|'dim'
  const CIRCLE_OF_FIFTHS = ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F'];

  const NETWORK_NODES = (() => {
    const nodes = [];
    const types = [
      { ring:0, suffix:'dim',  label:'dim',  color:'#9966ff' },
      { ring:1, suffix:'m7',   label:'m7',   color:'#4488ff' },
      { ring:2, suffix:'m',    label:'m',    color:'#22dd88' },
      { ring:3, suffix:'',     label:'maj',  color:'#ff9900' },
      { ring:4, suffix:'7',    label:'7',    color:'#ff5500' },
      { ring:5, suffix:'+',    label:'aug',  color:'#cc44ff' },
    ];
    types.forEach(({ ring, suffix, label, color }) => {
      CIRCLE_OF_FIFTHS.forEach((root, slot) => {
        nodes.push({ id:`${root}${suffix}`, root, suffix, label, ring, slot, color });
      });
    });
    return nodes;
  })();

  return Object.freeze({
    NOTES, ALIAS,
    CHORD_INTERVALS, SCALE_INTERVALS, SCALE_LABELS,
    DEGREES,
    STRING_TUNING, STRING_NAMES, STRING_THICK,
    CIRCLE_OF_FIFTHS, NETWORK_NODES,
  });
})();

// S: única responsabilidad — definiciones de tipos de escalas y sus progresiones diatónicas
window.GuitarScaleFinder.Escalas = {
  TIPOS_ESCALA: {
    mayor: {
      nombre: 'Mayor', color: '#4CAF50',
      intervalos: [0,2,4,5,7,9,11],
      acordesDiat: ['mayor','menor','menor','mayor','mayor','menor','disminuido'],
      grados: ['I','ii','iii','IV','V','vi','vii°'],
      progresiones: [
        { nombre: 'Pop clásico',        grados: [0,4,5,3],             txt: 'I–V–vi–IV' },
        { nombre: 'Blues 12 compases',  grados: [0,0,0,0,3,3,0,0,4,3,0,4], txt: 'I–I–I–I–IV–IV–I–I–V–IV–I–V' },
        { nombre: 'Cánon de Pachelbel', grados: [0,4,5,2,3,0,3,4],    txt: 'I–V–vi–iii–IV–I–IV–V' },
        { nombre: '50s doo-wop',        grados: [0,5,3,4],             txt: 'I–vi–IV–V' },
      ],
    },
    menor: {
      nombre: 'Menor Natural', color: '#2196F3',
      intervalos: [0,2,3,5,7,8,10],
      acordesDiat: ['menor','disminuido','mayor','menor','menor','mayor','mayor'],
      grados: ['i','ii°','III','iv','v','VI','VII'],
      progresiones: [
        { nombre: 'Metal/Rock menor', grados: [0,6,5,6], txt: 'i–VII–VI–VII' },
        { nombre: 'Andaluza',         grados: [0,6,5,4], txt: 'i–VII–VI–v' },
        { nombre: 'Power ballad',     grados: [0,5,2,6], txt: 'i–VI–III–VII' },
        { nombre: 'Funk/Soul menor',  grados: [0,3,6,0], txt: 'i–iv–VII–i' },
      ],
    },
    dorica: {
      nombre: 'Dórica', color: '#00BCD4',
      intervalos: [0,2,3,5,7,9,10],
      acordesDiat: ['menor','menor','mayor','mayor','menor','disminuido','mayor'],
      grados: ['i','ii','♭III','IV','v','vi°','♭VII'],
      progresiones: [
        { nombre: 'Dórica clásica', grados: [0,3,6,0], txt: 'i–IV–♭VII–i' },
        { nombre: 'Jazz-Funk',      grados: [0,3,0,3], txt: 'i–IV–i–IV' },
      ],
    },
    frigia: {
      nombre: 'Frigia', color: '#FF5722',
      intervalos: [0,1,3,5,7,8,10],
      acordesDiat: ['menor','mayor','mayor','menor','disminuido','mayor','menor'],
      grados: ['i','♭II','♭III','iv','v°','♭VI','♭vii'],
      progresiones: [
        { nombre: 'Flamenco',     grados: [0,1,0,1], txt: 'i–♭II–i–♭II' },
        { nombre: 'Metal frigio', grados: [0,6,5,1], txt: 'i–♭vii–♭VI–♭II' },
      ],
    },
    lidia: {
      nombre: 'Lidia', color: '#E91E63',
      intervalos: [0,2,4,6,7,9,11],
      acordesDiat: ['mayor','mayor','menor','disminuido','mayor','menor','menor'],
      grados: ['I','II','iii','#iv°','V','vi','vii'],
      progresiones: [
        { nombre: 'Lidia soñadora', grados: [0,1,4,0], txt: 'I–II–V–I' },
      ],
    },
    mixolidia: {
      nombre: 'Mixolidia', color: '#FF9800',
      intervalos: [0,2,4,5,7,9,10],
      acordesDiat: ['mayor','menor','disminuido','mayor','menor','menor','mayor'],
      grados: ['I','ii','iii°','IV','v','vi','♭VII'],
      progresiones: [
        { nombre: 'Rock mixolidio', grados: [0,6,3,0], txt: 'I–♭VII–IV–I' },
        { nombre: 'Blues-rock',     grados: [0,3,6,0], txt: 'I–IV–♭VII–I' },
      ],
    },
    locria: {
      nombre: 'Locria', color: '#607D8B',
      intervalos: [0,1,3,5,6,8,10],
      acordesDiat: ['disminuido','mayor','menor','menor','mayor','mayor','menor'],
      grados: ['i°','♭II','♭iii','iv','♭V','♭VI','♭vii'],
      progresiones: [
        { nombre: 'Locria oscura', grados: [0,1,0,1], txt: 'i°–♭II–i°–♭II' },
      ],
    },
    menor_arm: {
      nombre: 'Menor Armónica', color: '#9C27B0',
      intervalos: [0,2,3,5,7,8,11],
      acordesDiat: ['menor','disminuido','aumentado','menor','mayor','mayor','dim7'],
      grados: ['i','ii°','♭III+','iv','V','♭VI','vii°'],
      progresiones: [
        { nombre: 'Flamenca armónica', grados: [0,3,4,0], txt: 'i–iv–V–i' },
        { nombre: 'Clásica V–i',       grados: [4,0,4,0], txt: 'V–i–V–i' },
      ],
    },
    menor_mel: {
      nombre: 'Menor Melódica', color: '#3F51B5',
      intervalos: [0,2,3,5,7,9,11],
      acordesDiat: ['menor','menor','aumentado','mayor','mayor','disminuido','disminuido'],
      grados: ['i','ii','♭III+','IV','V','vi°','vii°'],
      progresiones: [
        { nombre: 'Jazz melódico', grados: [1,4,0,0], txt: 'ii–V–i–i' },
      ],
    },
    pentatonica_mayor: {
      nombre: 'Pentatónica Mayor', color: '#8BC34A',
      intervalos: [0,2,4,7,9], acordesDiat: null,
      grados: ['1','2','3','5','6'], progresiones: [],
    },
    pentatonica_menor: {
      nombre: 'Pentatónica Menor', color: '#673AB7',
      intervalos: [0,3,5,7,10], acordesDiat: null,
      grados: ['1','♭3','4','5','♭7'], progresiones: [],
    },
    blues_mayor: {
      nombre: 'Blues Mayor', color: '#CDDC39',
      intervalos: [0,2,3,4,7,9], acordesDiat: null,
      grados: ['1','2','♭3','3','5','6'], progresiones: [],
    },
    blues_menor: {
      nombre: 'Blues Menor', color: '#795548',
      intervalos: [0,3,5,6,7,10], acordesDiat: null,
      grados: ['1','♭3','4','♭5','5','♭7'], progresiones: [],
    },
    huayno: {
      nombre: 'Huayno (Andina)', color: '#E67E22',
      intervalos: [0,1,3,7,8], acordesDiat: null,
      grados: ['1','♭2','♭3','5','♭6'],
      progresiones: [
        { nombre: 'Huayno tradicional', manual: true, acordes: ['Am','Bb','C','Am'],  txt: 'i–♭II–♭III–i' },
        { nombre: 'Ritmo andino',       manual: true, acordes: ['Am','C','Am','Bb'],  txt: 'i–♭III–i–♭II' },
      ],
    },
  },
};

// S: única responsabilidad — progresiones regionales del mundo
// O: se pueden agregar nuevas regiones sin modificar la lógica existente
window.GuitarScaleFinder.Progresiones = {
  PROGS_REGIONALES: {
    japon: {
      label: '🇯🇵 Japonesas',
      escalas: ['menor','menor_arm','dorica','frigia'],
      progs: [
        { nombre: 'Anime (yonanuki menor)', txt: 'i–♭VI–♭III–♭VII', grados: [{s:0,t:'menor'},{s:8,t:'mayor'},{s:3,t:'mayor'},{s:10,t:'mayor'}] },
        { nombre: 'In-sen (tensión)',        txt: 'i–♭II–V–i',       grados: [{s:0,t:'menor'},{s:1,t:'mayor'},{s:7,t:'mayor'},{s:0,t:'menor'}] },
        { nombre: 'Yonanuki oscura',         txt: 'i–♭VII–♭VI–V',    grados: [{s:0,t:'menor'},{s:10,t:'mayor'},{s:8,t:'mayor'},{s:7,t:'mayor'}] },
        { nombre: 'Akebono',                 txt: 'I–♭II–IV–V',      grados: [{s:0,t:'mayor'},{s:1,t:'mayor'},{s:5,t:'mayor'},{s:7,t:'mayor'}] },
      ],
    },
    latinoamerica: {
      label: '🌎 América Latina',
      escalas: ['mayor','menor','menor_arm'],
      progs: [
        { nombre: 'Bossa Nova',   txt: 'I–vi–II–V', grados: [{s:0,t:'mayor'},{s:9,t:'menor'},{s:2,t:'mayor'},{s:7,t:'mayor'}] },
        { nombre: 'Vals criollo', txt: 'I–IV–V–I',  grados: [{s:0,t:'mayor'},{s:5,t:'mayor'},{s:7,t:'mayor'},{s:0,t:'mayor'}] },
        { nombre: 'Salsa/Son',    txt: 'i–iv–V–i',  grados: [{s:0,t:'menor'},{s:5,t:'menor'},{s:7,t:'mayor'},{s:0,t:'menor'}] },
        { nombre: 'Cumbia',       txt: 'I–IV–I–V',  grados: [{s:0,t:'mayor'},{s:5,t:'mayor'},{s:0,t:'mayor'},{s:7,t:'mayor'}] },
      ],
    },
    africa: {
      label: '🌍 África',
      escalas: ['mayor','menor'],
      progs: [
        { nombre: 'Afrobeat', txt: 'i–♭VII–IV–i', grados: [{s:0,t:'menor'},{s:10,t:'mayor'},{s:5,t:'mayor'},{s:0,t:'menor'}] },
        { nombre: 'Highlife', txt: 'I–IV–I–V',    grados: [{s:0,t:'mayor'},{s:5,t:'mayor'},{s:0,t:'mayor'},{s:7,t:'mayor'}] },
        { nombre: 'Afro-pop', txt: 'I–V–vi–iii',  grados: [{s:0,t:'mayor'},{s:7,t:'mayor'},{s:9,t:'menor'},{s:4,t:'menor'}] },
      ],
    },
    asia: {
      label: '🌏 Asia (India/Korea/China)',
      escalas: ['mayor','menor','menor_arm'],
      progs: [
        { nombre: 'Bollywood',         txt: 'i–♭VI–♭VII–i',  grados: [{s:0,t:'menor'},{s:8,t:'mayor'},{s:10,t:'mayor'},{s:0,t:'menor'}] },
        { nombre: 'K-pop círculo',     txt: 'I–V–vi–iii–IV', grados: [{s:0,t:'mayor'},{s:7,t:'mayor'},{s:9,t:'menor'},{s:4,t:'menor'},{s:5,t:'mayor'}] },
        { nombre: 'Pentatónica china', txt: 'I–ii–V–I',      grados: [{s:0,t:'mayor'},{s:2,t:'menor'},{s:7,t:'mayor'},{s:0,t:'mayor'}] },
      ],
    },
    europa: {
      label: '🌍 Europa',
      escalas: ['mayor','menor','frigia','menor_arm'],
      progs: [
        { nombre: 'Folk celta',       txt: 'I–♭VII–IV–I', grados: [{s:0,t:'mayor'},{s:10,t:'mayor'},{s:5,t:'mayor'},{s:0,t:'mayor'}] },
        { nombre: 'Balcanes',         txt: 'i–♭II–V–i',   grados: [{s:0,t:'menor'},{s:1,t:'mayor'},{s:7,t:'mayor'},{s:0,t:'menor'}] },
        { nombre: 'Clásica cadencia', txt: 'I–IV–V–I',    grados: [{s:0,t:'mayor'},{s:5,t:'mayor'},{s:7,t:'mayor'},{s:0,t:'mayor'}] },
      ],
    },
    norteamerica: {
      label: '🌎 América del Norte',
      escalas: ['mayor','menor'],
      progs: [
        { nombre: 'R&B/Soul', txt: 'I–IV–♭VII–IV', grados: [{s:0,t:'mayor'},{s:5,t:'mayor'},{s:10,t:'mayor'},{s:5,t:'mayor'}] },
        { nombre: 'Country',  txt: 'I–IV–V–I',      grados: [{s:0,t:'mayor'},{s:5,t:'mayor'},{s:7,t:'mayor'},{s:0,t:'mayor'}] },
        { nombre: 'Gospel',   txt: 'I–IV–I–V–I',    grados: [{s:0,t:'mayor'},{s:5,t:'mayor'},{s:0,t:'mayor'},{s:7,t:'mayor'},{s:0,t:'mayor'}] },
        { nombre: 'Reggae',   txt: 'I–♭VII–IV–I',   grados: [{s:0,t:'mayor'},{s:10,t:'mayor'},{s:5,t:'mayor'},{s:0,t:'mayor'}] },
      ],
    },
    pacifico: {
      label: '🌊 Pacífico / Andina',
      escalas: ['mayor','menor','huayno'],
      progs: [
        { nombre: 'Hawaiian slack key', txt: 'I–IV–V–IV',    grados: [{s:0,t:'mayor'},{s:5,t:'mayor'},{s:7,t:'mayor'},{s:5,t:'mayor'}] },
        { nombre: 'Huayno andino',      txt: 'i–♭II–♭III–i', grados: [{s:0,t:'menor'},{s:1,t:'mayor'},{s:3,t:'mayor'},{s:0,t:'menor'}] },
      ],
    },
  },
};

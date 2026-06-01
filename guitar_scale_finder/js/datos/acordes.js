// S: única responsabilidad — definiciones de tipos de acordes
(function () {
  const TIPOS_ACORDE = {
    mayor:          { intervalos: [0,4,7],         sufijo: '' },
    menor:          { intervalos: [0,3,7],         sufijo: 'm' },
    dom7:           { intervalos: [0,4,7,10],      sufijo: '7' },
    menor7:         { intervalos: [0,3,7,10],      sufijo: 'm7' },
    maj7:           { intervalos: [0,4,7,11],      sufijo: 'maj7' },
    disminuido:     { intervalos: [0,3,6],         sufijo: 'dim' },
    dim7:           { intervalos: [0,3,6,9],       sufijo: 'dim7' },
    semidisminuido: { intervalos: [0,3,6,10],      sufijo: 'm7b5' },
    aumentado:      { intervalos: [0,4,8],         sufijo: 'aug' },
    sus2:           { intervalos: [0,2,7],         sufijo: 'sus2' },
    sus4:           { intervalos: [0,5,7],         sufijo: 'sus4' },
    dom9:           { intervalos: [0,4,7,10,2],    sufijo: '9' },
    maj9:           { intervalos: [0,4,7,11,2],    sufijo: 'maj9' },
    m9:             { intervalos: [0,3,7,10,2],    sufijo: 'm9' },
    add9:           { intervalos: [0,4,7,2],       sufijo: 'add9' },
    madd9:          { intervalos: [0,3,7,2],       sufijo: 'madd9' },
  };

  window.GuitarScaleFinder.Acordes = {
    TIPOS_ACORDE,
    ACORDES_RAPIDOS: ['C','Dm','Em','F','G','Am','A','Bm','D','E','G7','Am7','Cmaj9','Am9','G9','Dadd9'],
    SUFMAP: {
      mayor: '', menor: 'm', disminuido: 'dim', dom7: '7',
      aumentado: 'aug', semidisminuido: 'm7b5', dim7: 'dim7',
      sus2: 'sus2', sus4: 'sus4',
    },
    // Expresión regular para parsear nombre de acorde
    REGEX_AC: /^([A-G][#b]?)(m7b5|maj9|maj7|madd9|add9|dim7|m9|m7|aug|dim|sus2|sus4|m|9|7)?$/,
    // Lookup inverso: sufijo → clave de tipo
    MAPA_SUFIJO: Object.fromEntries(
      Object.entries(TIPOS_ACORDE).map(([k, v]) => [v.sufijo, k])
    ),
  };
})();

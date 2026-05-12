// S: única responsabilidad — constantes musicales base del dominio
window.GuitarScaleFinder = window.GuitarScaleFinder || {};

window.GuitarScaleFinder.Constantes = {
  NOTAS: ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],
  BEMOLES: { Db:'C#', Eb:'D#', Fb:'E', Gb:'F#', Ab:'G#', Bb:'A#', Cb:'B' },
  AFINACION: [4, 9, 2, 7, 11, 4],           // E A D G B e (índices NOTAS)
  NOMBRES_CUERDAS: ['E','A','D','G','B','e'],
  GROSOR_CUERDAS: [3.5, 3, 2.5, 2, 1.5, 1],
  COLORES_GRADO: ['#ff4444','#ff8c00','#ffd700','#44dd44','#00cccc','#4488ff','#cc44ff'],
  FREQ_CUERDAS: [82.41, 110.00, 146.83, 196.00, 246.94, 329.63], // Hz: E A D G B e
};

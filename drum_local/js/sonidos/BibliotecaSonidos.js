// SRP: Único responsable del catálogo de tipos de drum y sus metadatos
class BibliotecaSonidos {
  constructor(sintetizador) {
    this._sintetizador = sintetizador; // DIP
    this._catalogo = this._construirCatalogo();
  }

  _construirCatalogo() {
    const s = this._sintetizador;
    return {
      kick:          { nombre: 'Kick',      color: '#e74c3c', tocar: (t, v) => s.tocarKick(t, v) },
      snare:         { nombre: 'Snare',     color: '#e67e22', tocar: (t, v) => s.tocarSnare(t, v) },
      hihat_c:       { nombre: 'Hi-Hat C',  color: '#f1c40f', tocar: (t, v) => s.tocarHihat(t, v, false) },
      hihat_a:       { nombre: 'Hi-Hat A',  color: '#2ecc71', tocar: (t, v) => s.tocarHihat(t, v, true) },
      crash:         { nombre: 'Crash',     color: '#1abc9c', tocar: (t, v) => s.tocarCrash(t, v) },
      tom_alto:      { nombre: 'Tom Alto',  color: '#3498db', tocar: (t, v) => s.tocarTom(t, 210, v) },
      tom_medio:     { nombre: 'Tom Med',   color: '#9b59b6', tocar: (t, v) => s.tocarTom(t, 130, v) },
      tom_bajo:      { nombre: 'Tom Bajo',  color: '#8e44ad', tocar: (t, v) => s.tocarTom(t, 75, v) },
      clap:          { nombre: 'Clap',      color: '#e91e63', tocar: (t, v) => s.tocarClap(t, v) },
      rimshot:       { nombre: 'Rimshot',   color: '#ff5722', tocar: (t, v) => s.tocarRimshot(t, v) },
      cowbell:       { nombre: 'Cowbell',   color: '#795548', tocar: (t, v) => s.tocarCowbell(t, v) },
      percusion:     { nombre: 'Perc',      color: '#607d8b', tocar: (t, v) => s.tocarPercusion(t, v) },
    };
  }

  obtenerTipos() {
    return Object.keys(this._catalogo);
  }

  obtenerSonido(tipo) {
    return this._catalogo[tipo] ?? this._catalogo.kick;
  }
}

// SRP: único responsable de cargar archivos de audio y detectar el tipo de drum por nombre
class CargadorSamples {
  constructor(gestorContexto) {
    this._gestor = gestorContexto;
    this._buffers = {};
    this._mapa = {
      kick:      ['kick', 'bd', 'bombo', 'bass drum', 'bassdrum'],
      snare:     ['snare', 'sd', 'caja', 'snaredrum'],
      hihat_c:   ['hihat_c', 'hihat_closed', 'hh_c', 'hh_closed', 'closed', 'hihat closed'],
      hihat_a:   ['hihat_a', 'hihat_open', 'hh_o', 'hh_open', 'open', 'hihat open'],
      crash:     ['crash', 'cymbal'],
      tom_alto:  ['tom_alto', 'tom1', 'tom_high', 'tom high', 'rack', 'hi tom'],
      tom_medio: ['tom_medio', 'tom2', 'tom_mid', 'mid tom', 'floor tom2'],
      tom_bajo:  ['tom_bajo', 'tom3', 'tom_low', 'floor', 'low tom'],
      clap:      ['clap'],
      rimshot:   ['rim', 'rimshot'],
      cowbell:   ['cow', 'cowbell'],
      percusion: ['perc', 'percusion', 'shaker', 'tambourine'],
    };
  }

  async cargarArchivos(archivos) {
    const ctx = this._gestor.obtener();
    let cargados = 0;
    const tipos = [];

    for (const archivo of archivos) {
      const tipo = this._detectarTipo(archivo.name);
      if (!tipo) continue;
      try {
        const arrayBuffer = await archivo.arrayBuffer();
        const audioBuffer = await new Promise((res, rej) =>
          ctx.decodeAudioData(arrayBuffer, res, rej)
        );
        this._buffers[tipo] = audioBuffer;
        cargados++;
        tipos.push(tipo);
      } catch {
        // archivo no compatible, se ignora
      }
    }
    return { cargados, total: archivos.length, tipos };
  }

  _detectarTipo(nombre) {
    const n = nombre.toLowerCase().replace(/[_\-\.]/g, ' ');
    for (const [tipo, palabras] of Object.entries(this._mapa)) {
      if (palabras.some(p => n.includes(p))) return tipo;
    }
    return null;
  }

  // Carga automática desde carpeta samples/ (requiere servidor local, no file://)
  async cargarDesdeRuta(ruta = 'samples/') {
    const ctx = this._gestor.obtener();
    const tipos = Object.keys(this._mapa);
    const exts  = ['wav', 'mp3', 'ogg'];
    let cargados = 0;

    for (const tipo of tipos) {
      for (const ext of exts) {
        try {
          const resp = await fetch(`${ruta}${tipo}.${ext}`);
          if (!resp.ok) continue;
          const arr  = await resp.arrayBuffer();
          const buf  = await new Promise((res, rej) => ctx.decodeAudioData(arr, res, rej));
          this._buffers[tipo] = buf;
          cargados++;
          break;
        } catch { continue; }
      }
    }
    return cargados;
  }

  obtenerBuffer(tipo)     { return this._buffers[tipo] ?? null; }
  tieneBuffer(tipo)       { return tipo in this._buffers; }
  cantidadCargada()       { return Object.keys(this._buffers).length; }
  limpiar()               { this._buffers = {}; }
}

// SRP: Único responsable de proveer patrones rítmicos predefinidos
class PresetsRitmo {
  constructor() {
    this._presets = this._definirPresets();
  }

  _definirPresets() {
    const T = true, F = false;
    return {
      vacio: {
        nombre: '— Vacío —',
        pistas: []
      },
      rock_basico: {
        nombre: 'Rock Básico',
        pistas: [
          { tipo: 'kick',    patron: [T,F,F,F, T,F,F,F, T,F,F,F, T,F,F,F] },
          { tipo: 'snare',   patron: [F,F,F,F, T,F,F,F, F,F,F,F, T,F,F,F] },
          { tipo: 'hihat_c', patron: [T,F,T,F, T,F,T,F, T,F,T,F, T,F,T,F] },
        ]
      },
      rock_doble: {
        nombre: 'Rock Doble',
        pistas: [
          { tipo: 'kick',    patron: [T,F,F,F, F,F,T,F, T,F,F,F, F,F,T,F] },
          { tipo: 'snare',   patron: [F,F,F,F, T,F,F,F, F,F,F,F, T,F,F,F] },
          { tipo: 'hihat_c', patron: [T,T,T,T, T,T,T,T, T,T,T,T, T,T,T,T] },
          { tipo: 'crash',   patron: [T,F,F,F, F,F,F,F, F,F,F,F, F,F,F,F] },
        ]
      },
      funk: {
        nombre: 'Funk Groove',
        pistas: [
          { tipo: 'kick',    patron: [T,F,F,T, F,F,T,F, F,F,T,F, F,T,F,F] },
          { tipo: 'snare',   patron: [F,F,F,F, T,F,F,T, F,F,F,F, T,F,T,F] },
          { tipo: 'hihat_c', patron: [T,T,T,T, T,T,T,T, T,T,T,T, T,T,T,T] },
          { tipo: 'hihat_a', patron: [F,F,F,F, F,F,F,F, T,F,F,F, F,F,F,F] },
          { tipo: 'clap',    patron: [F,F,F,F, T,F,F,F, F,F,F,F, T,F,F,T] },
        ]
      },
      hip_hop: {
        nombre: 'Hip-Hop',
        pistas: [
          { tipo: 'kick',    patron: [T,F,F,F, F,F,F,F, T,F,F,T, F,F,F,F] },
          { tipo: 'snare',   patron: [F,F,F,F, T,F,F,F, F,F,F,F, T,F,F,F] },
          { tipo: 'hihat_c', patron: [T,F,T,F, F,T,F,T, T,F,T,F, F,T,F,T] },
          { tipo: 'clap',    patron: [F,F,F,F, T,F,F,F, F,F,F,F, T,F,T,F] },
        ]
      },
      reggae: {
        nombre: 'Reggae',
        pistas: [
          { tipo: 'kick',    patron: [T,F,F,F, F,F,T,F, T,F,F,F, F,F,F,F] },
          { tipo: 'snare',   patron: [F,F,F,F, F,F,F,F, T,F,F,F, F,F,F,F] },
          { tipo: 'hihat_c', patron: [F,F,T,F, F,F,T,F, F,F,T,F, F,F,T,F] },
          { tipo: 'rimshot', patron: [F,F,F,F, T,F,F,F, F,F,F,F, T,F,F,F] },
        ]
      },
      bossa_nova: {
        nombre: 'Bossa Nova',
        pistas: [
          { tipo: 'kick',    patron: [T,F,F,T, F,F,T,F, T,F,F,T, F,F,F,F] },
          { tipo: 'rimshot', patron: [F,F,T,F, F,T,F,F, F,F,T,F, F,T,F,F] },
          { tipo: 'hihat_c', patron: [T,F,T,F, T,F,T,F, T,F,T,F, T,F,T,T] },
        ]
      },
      latin: {
        nombre: 'Latin / Salsa',
        pistas: [
          { tipo: 'kick',     patron: [T,F,F,F, T,F,F,T, F,F,T,F, F,T,F,F] },
          { tipo: 'snare',    patron: [F,F,T,F, F,F,T,F, F,F,T,F, F,F,T,F] },
          { tipo: 'cowbell',  patron: [T,F,T,F, F,T,F,T, T,F,T,F, F,T,F,T] },
          { tipo: 'percusion',patron: [F,T,F,T, F,T,F,T, F,T,F,T, F,T,F,T] },
        ]
      },
      blues_shuffle: {
        nombre: 'Blues Shuffle',
        pistas: [
          { tipo: 'kick',    patron: [T,F,F,T, F,F,T,F, F,F,T,F, F,F,F,F] },
          { tipo: 'snare',   patron: [F,F,F,F, T,F,F,F, F,F,F,F, T,F,F,F] },
          { tipo: 'hihat_c', patron: [T,F,T,T, F,T,T,F, T,T,F,T, T,F,T,T] },
        ]
      },
      balada: {
        nombre: 'Balada / Slow',
        pistas: [
          { tipo: 'kick',    patron: [T,F,F,F, F,F,F,F, T,F,F,F, F,F,F,F] },
          { tipo: 'snare',   patron: [F,F,F,F, T,F,F,F, F,F,F,F, T,F,F,F] },
          { tipo: 'hihat_c', patron: [T,F,T,F, T,F,T,F, T,F,T,F, T,F,T,F] },
          { tipo: 'crash',   patron: [T,F,F,F, F,F,F,F, F,F,F,F, F,F,F,F] },
        ]
      },
    };
  }

  obtenerNombres() {
    return Object.entries(this._presets).map(([id, p]) => ({ id, nombre: p.nombre }));
  }

  obtenerPreset(id) {
    return this._presets[id] ?? this._presets.vacio;
  }
}

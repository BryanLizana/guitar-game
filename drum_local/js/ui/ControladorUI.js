// SRP: Único responsable de conectar la UI con el dominio (eventos, acciones)
class ControladorUI {
  constructor(secuenciador, metronomo, presets, grid, biblioteca) {
    this._seq = secuenciador;   // DIP
    this._tap = metronomo;      // DIP
    this._presets = presets;    // DIP
    this._grid = grid;          // DIP
    this._bib = biblioteca;     // DIP
    this._contadorPistas = 0;
    this._compases = 4;         // 4 compases × 4 pasos = 16 pasos por defecto
    this._PASOS_POR_COMPAS = 4;
    this._COMPASES_MIN = 1;
    this._COMPASES_MAX = 16;
  }

  inicializar() {
    this._conectarTransporte();
    this._conectarBPM();
    this._conectarTap();
    this._conectarPresets();
    this._conectarAgregarPista();
    this._conectarCompases();
    this._conectarLimpiar();
    this._conectarTeclas();
    this._generarNumeracion();

    this._grid.establecerCallbacks({
      alternarPaso: (id, i) => {
        const pista = this._seq.obtenerPistas().find(p => p.id === id);
        pista?.alternarPaso(i);
      },
      cambiarTipo: (id, tipo) => {
        const pista = this._seq.obtenerPistas().find(p => p.id === id);
        if (pista) { pista.cambiarTipo(tipo); this._renderizar(); }
      },
      eliminarPista: (id) => {
        this._seq.eliminarPista(id);
        this._renderizar();
      },
      cambiarVolumen: (id, vol) => {
        const pista = this._seq.obtenerPistas().find(p => p.id === id);
        if (pista) pista.volumen = vol;
      },
      mutePista: () => {}
    });

    this._seq.establecerCallbackPaso(paso => {
      this._grid.actualizarPaso(paso);
    });
  }

  cargarPresetInicial(id) {
    this._cargarPreset(id);
    document.getElementById('select-preset').value = id;
  }

  // ---------- privados ----------

  _obtenerPasosActuales() {
    return this._compases * this._PASOS_POR_COMPAS;
  }

  _conectarTransporte() {
    document.getElementById('btn-play').addEventListener('click', () => this._togglePlay());
  }

  _togglePlay() {
    const btn = document.getElementById('btn-play');
    if (this._seq.estaReproduciendo()) {
      this._seq.detener();
      btn.textContent = '▶ Play';
      btn.classList.remove('reproduciendo');
      document.getElementById('indicador-play').classList.remove('activo');
    } else {
      this._seq.iniciar();
      btn.textContent = '⏹ Stop';
      btn.classList.add('reproduciendo');
      document.getElementById('indicador-play').classList.add('activo');
    }
  }

  _conectarBPM() {
    const slider = document.getElementById('slider-bpm');
    const display = document.getElementById('display-bpm');
    slider.value = this._seq.obtenerBPM();
    display.textContent = this._seq.obtenerBPM();

    slider.addEventListener('input', e => {
      const bpm = parseInt(e.target.value);
      this._seq.establecerBPM(bpm);
      display.textContent = bpm;
    });
  }

  _conectarTap() {
    document.getElementById('btn-tap').addEventListener('click', () => this._registrarTap());
  }

  _registrarTap() {
    const bpm = this._tap.registrarTap();
    if (!bpm) return;
    this._seq.establecerBPM(bpm);
    document.getElementById('slider-bpm').value = bpm;
    document.getElementById('display-bpm').textContent = bpm;

    const btn = document.getElementById('btn-tap');
    btn.classList.add('tap-flash');
    setTimeout(() => btn.classList.remove('tap-flash'), 120);
  }

  _conectarPresets() {
    const sel = document.getElementById('select-preset');
    this._presets.obtenerNombres().forEach(({ id, nombre }) => {
      const op = document.createElement('option');
      op.value = id; op.textContent = nombre;
      sel.appendChild(op);
    });
    sel.addEventListener('change', e => this._cargarPreset(e.target.value));
  }

  _cargarPreset(id) {
    const preset = this._presets.obtenerPreset(id);
    const pausaReanudar = this._seq.estaReproduciendo();
    if (pausaReanudar) this._seq.detener();

    [...this._seq.obtenerPistas()].forEach(p => this._seq.eliminarPista(p.id));
    this._contadorPistas = 0;

    const pasos = this._obtenerPasosActuales();
    preset.pistas.forEach(({ tipo, patron }) => {
      const pista = new PistaRitmo(`pista_${++this._contadorPistas}`, tipo, pasos);
      pista.establecerPatron(patron);
      this._seq.agregarPista(pista);
    });

    this._renderizar();
    this._generarNumeracion();
    if (pausaReanudar) this._seq.iniciar();
  }

  _conectarAgregarPista() {
    document.getElementById('btn-agregar').addEventListener('click', () => {
      const pasos = this._obtenerPasosActuales();
      const pista = new PistaRitmo(`pista_${++this._contadorPistas}`, 'hihat_c', pasos);
      this._seq.agregarPista(pista);
      this._renderizar();
    });
  }

  _conectarCompases() {
    document.getElementById('btn-mas-compas').addEventListener('click', () => {
      if (this._compases >= this._COMPASES_MAX) return;
      this._compases++;
      this._aplicarCambioCompases();
    });

    document.getElementById('btn-menos-compas').addEventListener('click', () => {
      if (this._compases <= this._COMPASES_MIN) return;
      this._compases--;
      this._aplicarCambioCompases();
    });
  }

  _aplicarCambioCompases() {
    const display = document.getElementById('display-compases');
    display.textContent = this._compases;

    // Deshabilitar botones en límites
    document.getElementById('btn-menos-compas').disabled = this._compases <= this._COMPASES_MIN;
    document.getElementById('btn-mas-compas').disabled  = this._compases >= this._COMPASES_MAX;

    const pasos = this._obtenerPasosActuales();
    this._seq.cambiarNumeroPasos(pasos);
    this._renderizar();
    this._generarNumeracion();
  }

  _conectarLimpiar() {
    document.getElementById('btn-limpiar').addEventListener('click', () => {
      this._seq.obtenerPistas().forEach(p => p.limpiar());
      this._renderizar();
    });
  }

  _conectarTeclas() {
    document.addEventListener('keydown', e => {
      const enInput = ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName);
      if (enInput) return;
      if (e.key === 't' || e.key === 'T') this._registrarTap();
      if (e.key === ' ') { e.preventDefault(); this._togglePlay(); }
    });
  }

  _generarNumeracion() {
    const pasos = this._obtenerPasosActuales();
    const contenedor = document.getElementById('numeracion-pasos');
    contenedor.innerHTML = '';
    for (let i = 1; i <= pasos; i++) {
      const span = document.createElement('span');
      // Marcar el inicio de cada compás (cada 4 pasos)
      const esInicioCompas = (i - 1) % this._PASOS_POR_COMPAS === 0;
      span.className = `num-paso ${esInicioCompas ? 'num-beat' : ''}`;
      span.textContent = i;
      if (i > 1 && esInicioCompas) span.classList.add('grupo-inicio');
      contenedor.appendChild(span);
    }
  }

  _renderizar() {
    this._grid.renderizar(this._seq.obtenerPistas());
  }
}

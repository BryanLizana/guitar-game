"use strict";

class ControladorApp {
  constructor() {
    this._gestorCtx          = new ContextoAudio();
    this._gestorDispositivos = new GestorDispositivosAudio();
    this._gestorArchivo      = new GestorArchivoAudio();
    this._flujoActual        = null;
    this._fuenteArchivo      = null;
    this._selector           = null;
    this._vistaEstado        = null;
    this._cadena             = null;
  }

  async inicializar(raiz) {
    this._raiz = raiz;
    try {
      const dispositivos = await this._gestorDispositivos.listarEntradas();
      this._renderizarUI(dispositivos);
    } catch (e) {
      raiz.innerHTML =
        `<div class="barra-estado error">Sin permiso de micrófono: ${e.message}</div>`;
    }
  }

  _renderizarUI(dispositivos) {
    this._vistaEstado = new VistaEstado();
    this._raiz.appendChild(this._vistaEstado.renderizar());

    this._selector = new VistaSelector({
      dispositivos,
      alSeleccionar:       () => {},
      alConectar:          id      => this._conectar(id),
      alReproducirArchivo: archivo => this._reproducirArchivo(archivo),
      alDetenerArchivo:    ()      => this._detenerArchivo(),
    });
    this._raiz.appendChild(this._selector.renderizar());

    const ctx = this._gestorCtx.obtener();

    // ── Instanciar pedales ────────────────────────────────────────
    const compressor = new EfectoCompressor(ctx);
    const wah        = new EfectoWahAuto(ctx);
    const eq         = new EfectoEQ3Bandas(ctx);
    const overdrive  = new EfectoOverdrive(ctx);
    const fuzz       = new EfectoFuzz(ctx);
    const chorus     = new EfectoChorus(ctx);
    const tremolo    = new EfectoTremolo(ctx);
    const delay      = new EfectoDelay(ctx);
    const reverb     = new EfectoReverb(ctx);
    const bajo       = new EfectoSimuladorBajo(ctx);

    // ── Cadena de señal ───────────────────────────────────────────
    // Compressor → Wah → EQ → Overdrive → Fuzz → Chorus → Tremolo → Delay → Reverb → Bajo
    this._cadena = new CadenaEfectos(
      [compressor, wah, eq, overdrive, fuzz, chorus, tremolo, delay, reverb, bajo],
      ctx.destination
    );

    // ── Renderizar tarjetas ───────────────────────────────────────
    this._raiz.appendChild(new VistaEfecto({
      nombre: 'Compressor', claseCss: 'compressor', orden: '①', efecto: compressor,
      knobs: [
        { etiqueta: 'THRESH', valorInicial: -24, min: -60, max:  0,  unidad: 'dB',
          alCambiar: v => compressor.ajustarUmbral(v) },
        { etiqueta: 'RATIO',  valorInicial:   4, min:   1, max: 20,  unidad: ':1',
          alCambiar: v => compressor.ajustarRelacion(v) },
        { etiqueta: 'ATK',    valorInicial:   3, min:   0, max: 200, unidad: 'ms',
          alCambiar: v => compressor.ajustarAtaque(v) },
        { etiqueta: 'REL',    valorInicial: 250, min:   0, max: 500, unidad: 'ms',
          alCambiar: v => compressor.ajustarLiberacion(v) },
      ],
    }).renderizar());

    this._raiz.appendChild(new VistaEfecto({
      nombre: 'Wah Auto', claseCss: 'wah', orden: '②', efecto: wah,
      knobs: [
        { etiqueta: 'RATE',  valorInicial:  1, min: 0, max: 8,   unidad: 'Hz',
          alCambiar: v => wah.ajustarVelocidad(v) },
        { etiqueta: 'DEPTH', valorInicial: 60, min: 0, max: 100, unidad: '%',
          alCambiar: v => wah.ajustarProfundidad(v) },
        { etiqueta: 'RES',   valorInicial: 50, min: 0, max: 100, unidad: '',
          alCambiar: v => wah.ajustarResonancia(v) },
      ],
    }).renderizar());

    this._raiz.appendChild(new VistaEfecto({
      nombre: 'EQ 3 Bandas', claseCss: 'eq3bandas', orden: '③', efecto: eq,
      knobs: [
        { etiqueta: 'BASS',   valorInicial: 0, min: -15, max: 15, unidad: 'dB',
          alCambiar: v => eq.ajustarBajos(v) },
        { etiqueta: 'MID',    valorInicial: 0, min: -15, max: 15, unidad: 'dB',
          alCambiar: v => eq.ajustarMedios(v) },
        { etiqueta: 'TREBLE', valorInicial: 0, min: -15, max: 15, unidad: 'dB',
          alCambiar: v => eq.ajustarAgudos(v) },
      ],
    }).renderizar());

    this._raiz.appendChild(new VistaEfecto({
      nombre: 'Overdrive', claseCss: 'overdrive', orden: '④', efecto: overdrive,
      knobs: [
        { etiqueta: 'GAIN', valorInicial: 50, min: 0, max: 100, unidad: '',
          alCambiar: v => overdrive.ajustarGanancia(v) },
        { etiqueta: 'TONE', valorInicial: 50, min: 0, max: 100, unidad: '',
          alCambiar: v => overdrive.ajustarTono(v) },
      ],
    }).renderizar());

    this._raiz.appendChild(new VistaEfecto({
      nombre: 'Fuzz', claseCss: 'fuzz', orden: '⑤', efecto: fuzz,
      knobs: [
        { etiqueta: 'INTENS', valorInicial: 50, min: 0, max: 100, unidad: '',
          alCambiar: v => fuzz.ajustarIntensidad(v) },
        { etiqueta: 'VOL',    valorInicial: 70, min: 0, max: 100, unidad: '',
          alCambiar: v => fuzz.ajustarVolumen(v) },
      ],
    }).renderizar());

    this._raiz.appendChild(new VistaEfecto({
      nombre: 'Chorus', claseCss: 'chorus', orden: '⑥', efecto: chorus,
      knobs: [
        { etiqueta: 'RATE',  valorInicial: 2,  min: 0, max: 8,   unidad: 'Hz',
          alCambiar: v => chorus.ajustarVelocidad(v) },
        { etiqueta: 'DEPTH', valorInicial: 40, min: 0, max: 100, unidad: '%',
          alCambiar: v => chorus.ajustarProfundidad(v) },
        { etiqueta: 'MIX',   valorInicial: 50, min: 0, max: 100, unidad: '%',
          alCambiar: v => chorus.ajustarMezcla(v) },
      ],
    }).renderizar());

    this._raiz.appendChild(new VistaEfecto({
      nombre: 'Tremolo', claseCss: 'tremolo', orden: '⑦', efecto: tremolo,
      knobs: [
        { etiqueta: 'RATE',  valorInicial:  5, min: 0, max: 20,  unidad: 'Hz',
          alCambiar: v => tremolo.ajustarVelocidad(v) },
        { etiqueta: 'DEPTH', valorInicial: 60, min: 0, max: 100, unidad: '%',
          alCambiar: v => tremolo.ajustarProfundidad(v) },
      ],
    }).renderizar());

    this._raiz.appendChild(new VistaEfecto({
      nombre: 'Delay', claseCss: 'delay', orden: '⑧', efecto: delay,
      knobs: [
        { etiqueta: 'TIME', valorInicial: 300, min: 0,  max: 1000, unidad: 'ms',
          alCambiar: v => delay.ajustarTiempo(v) },
        { etiqueta: 'FDBK', valorInicial:  30, min: 0,  max: 90,   unidad: '%',
          alCambiar: v => delay.ajustarRetroalimentacion(v) },
        { etiqueta: 'MIX',  valorInicial:  40, min: 0,  max: 100,  unidad: '%',
          alCambiar: v => delay.ajustarMezcla(v) },
      ],
    }).renderizar());

    this._raiz.appendChild(new VistaEfecto({
      nombre: 'Reverb', claseCss: 'reverb', orden: '⑨', efecto: reverb,
      knobs: [
        { etiqueta: 'ROOM',  valorInicial: 50, min: 0, max: 100, unidad: '',
          alCambiar: v => reverb.ajustarTamano(v) },
        { etiqueta: 'DECAY', valorInicial: 50, min: 0, max: 100, unidad: '',
          alCambiar: v => reverb.ajustarDecaimiento(v) },
        { etiqueta: 'MIX',   valorInicial: 30, min: 0, max: 100, unidad: '%',
          alCambiar: v => reverb.ajustarMezcla(v) },
      ],
    }).renderizar());

    this._raiz.appendChild(new VistaEfecto({
      nombre: 'Sim. Bajo', claseCss: 'bajo', orden: '⑩', efecto: bajo,
      knobs: [
        { etiqueta: 'TONE',  valorInicial: 50, min: 0, max: 100, unidad: '',
          alCambiar: v => bajo.ajustarTono(v) },
        { etiqueta: 'BODY',  valorInicial: 60, min: 0, max: 100, unidad: '',
          alCambiar: v => bajo.ajustarCuerpo(v) },
        { etiqueta: 'VOL',   valorInicial: 70, min: 0, max: 100, unidad: '',
          alCambiar: v => bajo.ajustarVolumen(v) },
      ],
    }).renderizar());
  }

  async _conectar(idDispositivo) {
    try {
      this._vistaEstado.mostrarConectando();
      this._pararArchivo();

      if (this._flujoActual) {
        this._flujoActual.getTracks().forEach(t => t.stop());
        this._flujoActual = null;
      }

      const ctx   = await this._gestorCtx.reanudar();
      const flujo = await this._gestorDispositivos.crearFlujo(idDispositivo);
      this._flujoActual = flujo;

      const fuente = ctx.createMediaStreamSource(flujo);
      this._cadena.conectarFuente(fuente);

      const nombreTrack = flujo.getAudioTracks()[0]?.label || 'Dispositivo desconocido';
      this._vistaEstado.mostrarConectado(nombreTrack);
    } catch (e) {
      this._vistaEstado.mostrarError(e.message);
    }
  }

  async _reproducirArchivo(archivo) {
    try {
      this._vistaEstado.mostrarConectando();

      if (this._flujoActual) {
        this._flujoActual.getTracks().forEach(t => t.stop());
        this._flujoActual = null;
      }
      this._pararArchivo();

      const ctx    = await this._gestorCtx.reanudar();
      const buffer = await this._gestorArchivo.decodificar(archivo, ctx);

      const fuente  = ctx.createBufferSource();
      fuente.buffer = buffer;
      fuente.loop   = true;

      this._fuenteArchivo = fuente;
      this._cadena.conectarFuente(fuente);
      fuente.start(0);

      this._vistaEstado.mostrarConectado(archivo.name);
    } catch (e) {
      this._vistaEstado.mostrarError(e.message);
      this._selector.notificarDetenido();
    }
  }

  _detenerArchivo() {
    this._pararArchivo();
    this._vistaEstado.mostrarEsperando();
  }

  _pararArchivo() {
    if (this._fuenteArchivo) {
      try { this._fuenteArchivo.stop(); } catch (_) {}
      this._fuenteArchivo = null;
    }
  }
}

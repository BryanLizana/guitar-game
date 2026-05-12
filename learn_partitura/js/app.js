'use strict';

// DIP: punto de composición. Crea las dependencias y las inyecta en los modos.
// OCP: para agregar un nuevo modo, crear la clase y registrarlo aquí sin tocar lo demás.
var Aplicacion = class {
  constructor() {
    const canvas = document.getElementById('staffCanvas');

    // Servicios compartidos
    this._servAudio        = new ServicioAudio();
    this._servDibujo       = new ServicioDibujo(canvas);
    this._gestorAccidental = new GestorAccidental(
      document.getElementById('selectorAccidental')
    );

    const gestorPuntaje = new GestorPuntaje(
      document.getElementById('sCorrect'),
      document.getElementById('sStreak'),
      document.getElementById('sTotal')
    );

    this._modoLectura = new ModoLectura(
      this._servAudio,
      this._servDibujo,
      gestorPuntaje,
      this._gestorAccidental,
      NOTAS_MUSICALES,
      {
        input:     document.getElementById('noteInput'),
        feedback:  document.getElementById('feedback'),
        checkBtn:  document.getElementById('checkBtn'),
        listenBtn: document.getElementById('listenBtn'),
      }
    );

    this._modoTablatura = new ModoTablatura(
      this._servAudio,
      this._gestorAccidental,
      FRECUENCIAS_TABLATURA,
      MAPA_SOLFEO,
      {
        display:          document.getElementById('tabDisplay'),
        solfeo:           document.getElementById('tabSolfeo'),
        contenedorTeclas: document.getElementById('keyRow'),
      }
    );

    this._modoActual = null;
    this._btnLectura = document.getElementById('tabBtnRead');
    this._btnTabla   = document.getElementById('tabBtnPlay');
    this._panelLect  = document.getElementById('readMode');
    this._panelTabla = document.getElementById('tabMode');
  }

  iniciar() {
    this._btnLectura.addEventListener('click', () => this._cambiarModo('lectura'));
    this._btnTabla.addEventListener('click',   () => this._cambiarModo('tablatura'));
    this._cambiarModo('lectura');
  }

  _cambiarModo(nombre) {
    if (this._modoActual) this._modoActual.desactivar();

    const configuraciones = {
      lectura:   { modo: this._modoLectura,   btnActivo: this._btnLectura, btnInactivo: this._btnTabla,   panelActivo: this._panelLect,  panelInactivo: this._panelTabla },
      tablatura: { modo: this._modoTablatura, btnActivo: this._btnTabla,   btnInactivo: this._btnLectura, panelActivo: this._panelTabla, panelInactivo: this._panelLect  },
    };

    const config = configuraciones[nombre];
    config.btnActivo.classList.add('active');
    config.btnInactivo.classList.remove('active');
    config.panelActivo.style.display   = 'flex';
    config.panelInactivo.style.display = 'none';

    this._modoActual = config.modo;
    this._modoActual.activar();
  }
};

document.addEventListener('DOMContentLoaded', () => new Aplicacion().iniciar());

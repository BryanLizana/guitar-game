'use strict';

// SRP: única responsabilidad → gestionar el modo de accidental seleccionado (♯ / ♭)
//      y construir su UI en el elemento contenedor.
// OCP: para añadir un tercer modo (p.ej. "todos") basta extender OPCIONES sin tocar los modos.
var GestorAccidental = class {
  constructor(elementoContenedor) {
    this._modo = 'natural'; // 'natural' | 'sostenido' | 'bemol'
    this._el   = elementoContenedor;
    this._construirUI();
  }

  get modo() { return this._modo; }

  _construirUI() {
    const OPCIONES = [
      { modo: 'natural',   texto: '○  Natural'   },
      { modo: 'sostenido', texto: '♯  Sostenido' },
      { modo: 'bemol',     texto: '♭  Bemol'     },
    ];

    this._el.innerHTML = '';

    const etiqueta = document.createElement('span');
    etiqueta.className   = 'selector-label';
    etiqueta.textContent = 'Shift + letra:';
    this._el.appendChild(etiqueta);

    OPCIONES.forEach(({ modo, texto }) => {
      const btn = document.createElement('button');
      btn.className    = 'selector-btn' + (modo === this._modo ? ' active' : '');
      btn.textContent  = texto;
      btn.dataset.modo = modo;
      btn.addEventListener('click', () => this._seleccionar(modo));
      this._el.appendChild(btn);
    });
  }

  _seleccionar(modo) {
    this._modo = modo;
    this._el.querySelectorAll('.selector-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.modo === modo);
    });
  }
};

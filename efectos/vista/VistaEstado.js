"use strict";

class VistaEstado {
  constructor() { this._el = null; }

  renderizar() {
    this._el = document.createElement('div');
    this._el.className   = 'barra-estado';
    this._el.textContent = 'Selecciona tu interfaz de audio y presiona CONECTAR';
    return this._el;
  }

  mostrarConectando()    { this._setState('conectando', 'Conectando…'); }
  mostrarError(msg)      { this._setState('error', `✕ ${msg}`); }
  mostrarConectado(disp) { this._setState('conectado', `✓ Conectado: ${disp}`); }
  mostrarEsperando()     { this._setState('', 'Selecciona tu interfaz de audio y presiona CONECTAR'); }

  _setState(cls, txt) {
    this._el.className   = `barra-estado ${cls}`;
    this._el.textContent = txt;
  }
}

"use strict";

class VistaKnob {
  constructor({ etiqueta, valorInicial, min, max, unidad, alCambiar }) {
    this._etiqueta     = etiqueta;
    this._valorInicial = valorInicial;
    this._min          = min;
    this._max          = max;
    this._unidad       = unidad;
    this._alCambiar    = alCambiar;
  }

  renderizar() {
    const grupo = document.createElement('div');
    grupo.className = 'grupo-knob';

    const etiqueta = document.createElement('div');
    etiqueta.className   = 'etiqueta-knob';
    etiqueta.textContent = this._etiqueta;

    const rango = document.createElement('input');
    rango.type      = 'range';
    rango.className = 'rango-knob';
    rango.min   = this._min;
    rango.max   = this._max;
    rango.value = this._valorInicial;
    rango.step  = 1;

    const valorEl = document.createElement('div');
    valorEl.className   = 'valor-knob';
    valorEl.textContent = this._valorInicial + this._unidad;

    rango.addEventListener('input', e => {
      const v = Number(e.target.value);
      valorEl.textContent = v + this._unidad;
      this._alCambiar(v);
    });

    grupo.appendChild(etiqueta);
    grupo.appendChild(rango);
    grupo.appendChild(valorEl);
    return grupo;
  }
}

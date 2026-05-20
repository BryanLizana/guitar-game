"use strict";

class VistaSelector {
  constructor({ dispositivos, alSeleccionar, alConectar }) {
    this._dispositivos  = dispositivos;
    this._alSeleccionar = alSeleccionar;
    this._alConectar    = alConectar;
  }

  renderizar() {
    const bloque = document.createElement('div');
    bloque.className = 'bloque-selector';

    const label = document.createElement('label');
    label.textContent = 'Entrada de Audio';

    const select = document.createElement('select');
    for (const d of this._dispositivos) {
      const opt = document.createElement('option');
      opt.value       = d.deviceId;
      opt.textContent = d.label || `Micrófono ${d.deviceId.slice(0, 8)}…`;
      select.appendChild(opt);
    }
    select.addEventListener('change', e => this._alSeleccionar(e.target.value));

    const btn = document.createElement('button');
    btn.className   = 'btn-conectar';
    btn.textContent = 'CONECTAR';
    btn.addEventListener('click', () => this._alConectar(select.value));

    bloque.appendChild(label);
    bloque.appendChild(select);
    bloque.appendChild(btn);
    return bloque;
  }
}

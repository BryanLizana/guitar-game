"use strict";

class VistaEfecto {
  constructor({ nombre, claseCss, orden, efecto, knobs }) {
    this._nombre   = nombre;
    this._claseCss = claseCss;
    this._orden    = orden;
    this._efecto   = efecto;
    this._knobs    = knobs;
  }

  renderizar() {
    const tarjeta = document.createElement('div');
    tarjeta.className = `tarjeta-efecto ${this._claseCss}`;

    const cabecera = document.createElement('div');
    cabecera.className = 'cabecera-efecto';

    const titulo = document.createElement('div');
    titulo.className = 'nombre-efecto';
    titulo.innerHTML = `${this._nombre}<span class="numero-orden">${this._orden}</span>`;

    const labelToggle = document.createElement('label');
    labelToggle.className = 'toggle';

    const checkToggle = document.createElement('input');
    checkToggle.type = 'checkbox';

    const pista = document.createElement('span');
    pista.className = 'toggle-pista';

    labelToggle.appendChild(checkToggle);
    labelToggle.appendChild(pista);

    checkToggle.addEventListener('change', e => {
      if (e.target.checked) {
        this._efecto.activar();
        tarjeta.classList.add('activo');
      } else {
        this._efecto.desactivar();
        tarjeta.classList.remove('activo');
      }
    });

    cabecera.appendChild(titulo);
    cabecera.appendChild(labelToggle);

    const filaKnobs = document.createElement('div');
    filaKnobs.className = 'fila-knobs';

    for (const cfg of this._knobs) {
      filaKnobs.appendChild(new VistaKnob(cfg).renderizar());
    }

    tarjeta.appendChild(cabecera);
    tarjeta.appendChild(filaKnobs);
    return tarjeta;
  }
}

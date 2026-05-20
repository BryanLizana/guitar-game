"use strict";

class VistaSelector {
  constructor({ dispositivos, alSeleccionar, alConectar, alReproducirArchivo, alDetenerArchivo }) {
    this._dispositivos        = dispositivos;
    this._alSeleccionar       = alSeleccionar;
    this._alConectar          = alConectar;
    this._alReproducirArchivo = alReproducirArchivo;
    this._alDetenerArchivo    = alDetenerArchivo;
    this._archivoSeleccionado = null;
    this._btnPlay             = null;
    this._btnStop             = null;
  }

  renderizar() {
    const bloque = document.createElement('div');
    bloque.className = 'bloque-selector';

    // ── Sección micrófono ─────────────────────────────────
    const labelMic = document.createElement('label');
    labelMic.textContent = 'Entrada: Micrófono';

    const select = document.createElement('select');
    for (const d of this._dispositivos) {
      const opt = document.createElement('option');
      opt.value       = d.deviceId;
      opt.textContent = d.label || `Micrófono ${d.deviceId.slice(0, 8)}…`;
      select.appendChild(opt);
    }
    select.addEventListener('change', e => this._alSeleccionar(e.target.value));

    const btnConectar = document.createElement('button');
    btnConectar.className   = 'btn-conectar';
    btnConectar.textContent = 'CONECTAR';
    btnConectar.addEventListener('click', () => this._alConectar(select.value));

    // ── Divisor ───────────────────────────────────────────
    const divisor = document.createElement('div');
    divisor.className   = 'divisor-selector';
    divisor.textContent = '── o bien ──';

    // ── Sección archivo ───────────────────────────────────
    const labelArch = document.createElement('label');
    labelArch.textContent = 'Entrada: Archivo de Audio';

    const inputFile = document.createElement('input');
    inputFile.type      = 'file';
    inputFile.accept    = 'audio/*';
    inputFile.className = 'input-archivo';

    const nombreArchivo = document.createElement('div');
    nombreArchivo.className   = 'nombre-archivo';
    nombreArchivo.textContent = 'Ningún archivo seleccionado';

    inputFile.addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      this._archivoSeleccionado = f;
      nombreArchivo.textContent = f.name;
      this._btnPlay.disabled = false;
    });

    const filaArchivo = document.createElement('div');
    filaArchivo.className = 'fila-archivo';

    this._btnPlay = document.createElement('button');
    this._btnPlay.className   = 'btn-play';
    this._btnPlay.textContent = '▶ REPRODUCIR';
    this._btnPlay.disabled    = true;
    this._btnPlay.addEventListener('click', () => {
      this._alReproducirArchivo(this._archivoSeleccionado);
      this._btnPlay.disabled = true;
      this._btnStop.disabled = false;
    });

    this._btnStop = document.createElement('button');
    this._btnStop.className   = 'btn-stop';
    this._btnStop.textContent = '■ DETENER';
    this._btnStop.disabled    = true;
    this._btnStop.addEventListener('click', () => {
      this._alDetenerArchivo();
      this._btnPlay.disabled = false;
      this._btnStop.disabled = true;
    });

    filaArchivo.appendChild(this._btnPlay);
    filaArchivo.appendChild(this._btnStop);

    bloque.appendChild(labelMic);
    bloque.appendChild(select);
    bloque.appendChild(btnConectar);
    bloque.appendChild(divisor);
    bloque.appendChild(labelArch);
    bloque.appendChild(inputFile);
    bloque.appendChild(nombreArchivo);
    bloque.appendChild(filaArchivo);
    return bloque;
  }

  notificarDetenido() {
    if (this._btnPlay) this._btnPlay.disabled = !this._archivoSeleccionado;
    if (this._btnStop) this._btnStop.disabled = true;
  }
}

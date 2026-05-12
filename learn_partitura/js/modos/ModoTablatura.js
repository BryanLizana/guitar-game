'use strict';

// SRP: lógica exclusiva del modo tablatura (reproducir nota por tecla pulsada).
// DIP: depende de ServicioAudio y GestorAccidental inyectados.
var ModoTablatura = class extends Modo {
  constructor(servAudio, gestorAccidental, frecuencias, mapaSolfeo, elementos) {
    super();
    this._servAudio        = servAudio;
    this._gestorAccidental = gestorAccidental;
    this._frecuencias      = frecuencias;
    this._mapaSolfeo       = mapaSolfeo;
    this._el               = elementos; // { display, solfeo, contenedorTeclas }
    this._manejadorTeclado = null;

    this._construirTeclas();
  }

  activar() {
    this._el.display.textContent = '— —';
    this._el.solfeo.textContent  = 'escribe una nota';
    this._el.display.className   = 'tab-note-display';

    this._manejadorTeclado = (e) => this._manejarTeclado(e);
    document.addEventListener('keydown', this._manejadorTeclado);
  }

  desactivar() {
    if (this._manejadorTeclado) {
      document.removeEventListener('keydown', this._manejadorTeclado);
      this._manejadorTeclado = null;
    }
  }

  _manejarTeclado(evento) {
    if (evento.ctrlKey || evento.altKey || evento.metaKey) return;
    const letra = evento.key.toUpperCase();
    if (!'ABCDEFG'.includes(letra)) return;
    evento.preventDefault();

    const quereSostenido = evento.shiftKey && this._gestorAccidental.modo === 'sostenido';
    const quereBemol     = evento.shiftKey && this._gestorAccidental.modo === 'bemol';
    this._tocarNota(letra, quereSostenido, quereBemol);
  }

  _tocarNota(letra, quereSostenido, quereBemol) {
    const datos = this._frecuencias[letra];
    let frecuencia, etiquetaNota, etiquetaSolfeo;

    if (quereBemol && datos.bemol !== null) {
      frecuencia     = datos.bemol;
      etiquetaNota   = letra + '♭';
      etiquetaSolfeo = this._mapaSolfeo[letra] + '♭';
    } else if (quereSostenido && datos.sostenido !== null) {
      frecuencia     = datos.sostenido;
      etiquetaNota   = letra + '♯';
      etiquetaSolfeo = this._mapaSolfeo[letra] + '♯';
    } else {
      frecuencia     = datos.natural;
      etiquetaNota   = letra;
      etiquetaSolfeo = this._mapaSolfeo[letra];
    }

    this._servAudio.reproducir(frecuencia, 1.4);
    this._animarDisplay(etiquetaNota, etiquetaSolfeo);
  }

  _animarDisplay(textoNota, textoSolfeo) {
    const el = this._el.display;
    el.className = 'tab-note-display';
    void el.offsetWidth;
    el.className = 'tab-note-display flash';
    el.textContent = textoNota;
    this._el.solfeo.textContent = textoSolfeo;
  }

  _construirTeclas() {
    const contenedor = this._el.contenedorTeclas;
    contenedor.innerHTML = '';

    'ABCDEFG'.split('').forEach(letra => {
      const datos = this._frecuencias[letra];
      const btn = document.createElement('div');
      btn.className = 'key-btn';

      const zonaBemol = document.createElement('span');
      if (datos.bemol !== null) {
        zonaBemol.className   = 'k-flat';
        zonaBemol.textContent = letra + '♭';
        zonaBemol.addEventListener('mousedown', e => {
          e.stopPropagation();
          btn.classList.add('pressed');
          this._tocarNota(letra, false, true);
        });
      } else {
        zonaBemol.className = 'k-accidental-vacio';
      }
      btn.appendChild(zonaBemol);

      const zonaNatural = document.createElement('span');
      zonaNatural.className   = 'k-letter';
      zonaNatural.textContent = letra;
      btn.appendChild(zonaNatural);

      const zonaSostenido = document.createElement('span');
      if (datos.sostenido !== null) {
        zonaSostenido.className   = 'k-sharp';
        zonaSostenido.textContent = letra + '♯';
        zonaSostenido.addEventListener('mousedown', e => {
          e.stopPropagation();
          btn.classList.add('pressed');
          this._tocarNota(letra, true, false);
        });
      } else {
        zonaSostenido.className = 'k-accidental-vacio';
      }
      btn.appendChild(zonaSostenido);

      btn.addEventListener('mousedown', () => {
        btn.classList.add('pressed');
        this._tocarNota(letra, false, false);
      });
      btn.addEventListener('mouseup',    () => btn.classList.remove('pressed'));
      btn.addEventListener('mouseleave', () => btn.classList.remove('pressed'));

      contenedor.appendChild(btn);
    });
  }
};

'use strict';

// SRP: lógica exclusiva del modo lectura de partituras.
// DIP: depende de abstracciones (ServicioAudio, ServicioDibujo, GestorPuntaje, GestorAccidental) inyectadas.
var ModoLectura = class extends Modo {
  constructor(servAudio, servDibujo, gestorPuntaje, gestorAccidental, notas, elementos) {
    super();
    this._servAudio        = servAudio;
    this._servDibujo       = servDibujo;
    this._gestorPuntaje    = gestorPuntaje;
    this._gestorAccidental = gestorAccidental;
    this._notas            = notas;
    this._el               = elementos; // { input, feedback, checkBtn, listenBtn }
    this._notaActual       = null;
    this._esperando        = false;

    this._manejadorVerificar = () => this.verificarRespuesta();
    this._manejadorEscuchar  = () => this._servAudio.reproducir(this._notaActual.freq);
    this._manejadorTeclado   = (e) => { if (e.key === 'Enter') this.verificarRespuesta(); };
  }

  activar() {
    if (!this._notaActual) {
      this._mostrarNota(this._notas.find(n => n.id === 'G4'));
    } else {
      this._servDibujo.dibujarNota(this._notaActual);
      this._el.input.value = '';
    }
    this._el.input.focus();
    this._el.checkBtn.addEventListener('click',   this._manejadorVerificar);
    this._el.listenBtn.addEventListener('click',  this._manejadorEscuchar);
    this._el.input.addEventListener('keydown',    this._manejadorTeclado);
  }

  desactivar() {
    this._esperando = false;
    this._el.checkBtn.removeEventListener('click',  this._manejadorVerificar);
    this._el.listenBtn.removeEventListener('click', this._manejadorEscuchar);
    this._el.input.removeEventListener('keydown',   this._manejadorTeclado);
  }

  verificarRespuesta() {
    if (this._esperando) return;
    const texto = this._el.input.value.trim();
    if (!texto) return;

    const { letra, sostenido, bemol } = this._parsearEntrada(texto);
    const esCorrecta =
      letra     === this._notaActual.letter &&
      sostenido === (this._notaActual.sharp === true) &&
      bemol     === (this._notaActual.flat  === true);

    // Reproduce lo que escribió el usuario (refuerzo auditivo)
    const notaEscrita = this._notas.find(n =>
      n.letter === letra &&
      (n.sharp === true) === sostenido &&
      (n.flat  === true) === bemol &&
      Math.abs(n.step - this._notaActual.step) <= 7
    );
    this._servAudio.reproducir(
      notaEscrita ? notaEscrita.freq : this._notaActual.freq,
      esCorrecta ? 1.8 : 0.9
    );

    if (esCorrecta) {
      this._gestorPuntaje.registrarAcierto();
      this._esperando = true;
      this._mostrarFeedback('correct', '✓  ' + this._nombreNota(this._notaActual));
      setTimeout(() => this._siguienteNota(), 900);
    } else {
      this._gestorPuntaje.registrarFallo();
      this._mostrarFeedback('wrong', '✗  Era ' + this._nombreNota(this._notaActual));
      this._el.input.value = '';
      setTimeout(() => this._servAudio.reproducir(this._notaActual.freq, 1.5), 500);
      this._el.input.focus();
    }
  }

  _mostrarNota(nota) {
    this._notaActual = nota;
    this._servDibujo.dibujarNota(nota);
    this._servAudio.reproducir(nota.freq);
    this._el.input.value = '';
    this._esperando = false;
    this._el.input.focus();
  }

  _notasFiltradas() {
    const modo = this._gestorAccidental.modo;
    return this._notas.filter(n => {
      if (modo === 'natural')   return !n.sharp && !n.flat;
      if (modo === 'sostenido') return n.flat  !== true;
      if (modo === 'bemol')     return n.sharp !== true;
      return true;
    });
  }

  _siguienteNota() {
    const pool = this._notasFiltradas();
    let candidata;
    do {
      candidata = pool[Math.floor(Math.random() * pool.length)];
    } while (candidata.id === this._notaActual.id);
    this._mostrarNota(candidata);
  }

  // OCP: la detección de accidentales es extensible sin modificar el resto del método.
  _parsearEntrada(texto) {
    const s     = texto.trim();
    const lower = s.toLowerCase();

    const MAPA_NOTAS = { do:'C', re:'D', mi:'E', fa:'F', sol:'G', la:'A', si:'B' };

    // Bemol: termina en 'b' y tiene más de 1 carácter (evita confundir con la nota 'b/B')
    // Acepta: Db, Eb, Gb, Ab, Bb  /  Reb, Mib, Solb, Lab, Sib
    if (lower.length > 1 && lower.endsWith('b')) {
      const base  = lower.slice(0, -1);
      const letra = MAPA_NOTAS[base] || base.charAt(0).toUpperCase();
      if ('ABCDEFG'.includes(letra)) {
        return { letra, sostenido: false, bemol: true };
      }
    }

    // Sostenido explícito con '#' o '♯'
    if (lower.endsWith('#') || lower.endsWith('♯')) {
      const base  = lower.replace(/[#♯]$/, '');
      const letra = MAPA_NOTAS[base] || base.charAt(0).toUpperCase();
      return { letra, sostenido: true, bemol: false };
    }

    // Mayúscula = sostenido (convención legacy: C=Do#, G=Sol#, etc.)
    const esMayuscula = (s === s.toUpperCase() && s !== s.toLowerCase());
    const letra       = MAPA_NOTAS[lower] || lower.charAt(0).toUpperCase();
    return { letra, sostenido: esMayuscula, bemol: false };
  }

  _nombreNota(nota) {
    const accidental = nota.flat ? '♭' : (nota.sharp ? '♯' : '');
    return `${nota.letter}${accidental}  —  ${nota.solfeo}${accidental}`;
  }

  _mostrarFeedback(clase, mensaje) {
    const el = this._el.feedback;
    el.className = 'feedback';
    void el.offsetWidth; // forzar reflow para reiniciar la animación CSS
    el.className = `feedback ${clase}`;
    el.textContent = mensaje;
  }
};

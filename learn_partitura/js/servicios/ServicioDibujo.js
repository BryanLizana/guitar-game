'use strict';

// SRP: única responsabilidad → renderizar el pentagrama y la nota en canvas.
var ServicioDibujo = class {
  constructor(canvas) {
    this._ctx         = canvas.getContext('2d');
    this._anchoCanvas = canvas.width;
    this._altoCanvas  = canvas.height;

    // Constantes de layout del pentagrama
    this._INICIO_X     = 85;
    this._FIN_X        = 388;
    this._CENTRO_Y     = 138;   // Y de B4 (step 4, línea central)
    this._ALTURA_PASO  = 12;    // píxeles por step
    this._NOTA_X       = 272;   // X donde se dibuja la nota
    this._MEDIO_LEDGER = 18;    // semi-ancho de líneas adicionales
    this._LINEAS_PASO  = [0, 2, 4, 6, 8]; // E4, G4, B4, D5, F5
  }

  // Convierte step del pentagrama a coordenada Y en canvas
  _pasoAY(paso) {
    return this._CENTRO_Y - (paso - 4) * this._ALTURA_PASO;
  }

  _dibujarFondo() {
    const ctx = this._ctx;
    ctx.fillStyle = '#fffef6';
    ctx.fillRect(0, 0, this._anchoCanvas, this._altoCanvas);
    ctx.strokeStyle = '#e0d8c0';
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 6, this._anchoCanvas - 12, this._altoCanvas - 12);
  }

  _dibujarLineasPentagrama() {
    const ctx = this._ctx;
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1.5;
    this._LINEAS_PASO.forEach(paso => {
      const y = this._pasoAY(paso);
      ctx.beginPath();
      ctx.moveTo(this._INICIO_X, y);
      ctx.lineTo(this._FIN_X,   y);
      ctx.stroke();
    });
  }

  _dibujarClave() {
    const ctx = this._ctx;
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '112px "Times New Roman", Georgia, serif';
    ctx.textBaseline = 'alphabetic';
    // Baseline en la línea E4 (paso=0) → la espiral queda sobre la línea Sol (paso=2)
    ctx.fillText('\u{1D11E}', this._INICIO_X - 66, this._pasoAY(0));
  }

  _dibujarLedgerLines(paso) {
    const ctx = this._ctx;
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1.8;
    const nx = this._NOTA_X;
    const lw = this._MEDIO_LEDGER;

    // Líneas adicionales debajo del pentagrama
    [-2, -4].forEach(s => {
      if (paso <= s) {
        ctx.beginPath();
        ctx.moveTo(nx - lw, this._pasoAY(s));
        ctx.lineTo(nx + lw, this._pasoAY(s));
        ctx.stroke();
      }
    });

    // Líneas adicionales encima del pentagrama
    [10, 12].forEach(s => {
      if (paso >= s) {
        ctx.beginPath();
        ctx.moveTo(nx - lw, this._pasoAY(s));
        ctx.lineTo(nx + lw, this._pasoAY(s));
        ctx.stroke();
      }
    });
  }

  _dibujarSostenido(y) {
    const ctx = this._ctx;
    ctx.fillStyle = '#111';
    ctx.font = 'bold 18px "Times New Roman", serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('♯', this._NOTA_X - 27, y);
  }

  // El símbolo ♭ es más alto; se desplaza un poco arriba para que la "barriga" quede junto a la cabeza
  _dibujarBemol(y) {
    const ctx = this._ctx;
    ctx.fillStyle = '#111';
    ctx.font = 'bold 22px "Times New Roman", serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('♭', this._NOTA_X - 28, y - 5);
  }

  _dibujarCabezaNota(y) {
    const ctx = this._ctx;
    ctx.save();
    ctx.translate(this._NOTA_X, y);
    ctx.rotate(-0.18);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 6.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.restore();
  }

  _dibujarPlica(y, paso) {
    const ctx      = this._ctx;
    const longitud = this._ALTURA_PASO * 7;
    const nx       = this._NOTA_X;
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    if (paso <= 4) {
      ctx.moveTo(nx + 9, y); ctx.lineTo(nx + 9, y - longitud); // hacia arriba
    } else {
      ctx.moveTo(nx - 9, y); ctx.lineTo(nx - 9, y + longitud); // hacia abajo
    }
    ctx.stroke();
  }

  // Punto de entrada público: borra el canvas y dibuja la nota completa
  dibujarNota(nota) {
    this._ctx.clearRect(0, 0, this._anchoCanvas, this._altoCanvas);
    this._dibujarFondo();
    this._dibujarLineasPentagrama();
    this._dibujarClave();
    this._dibujarLedgerLines(nota.step);

    const y = this._pasoAY(nota.step);
    if (nota.flat)       this._dibujarBemol(y);
    else if (nota.sharp) this._dibujarSostenido(y);
    this._dibujarCabezaNota(y);
    this._dibujarPlica(y, nota.step);
  }
};

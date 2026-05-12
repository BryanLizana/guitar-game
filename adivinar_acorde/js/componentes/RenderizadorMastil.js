// S: única responsabilidad — dibuja el mástil de guitarra en un canvas
// D: depende de Guitarra para dimensiones y obtenerNota
class RenderizadorMastil {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d');
        this._calcularDimensiones();
    }

    _calcularDimensiones() {
        const ancho = Math.min(window.innerWidth - 50, 980);
        this.canvas.width  = ancho;
        this.canvas.height = Math.round(ancho * 0.265);
        const mg = { izq: 52, der: 16, arr: 26, aba: 16 };
        this.mg  = mg;
        this.aw  = ancho - mg.izq - mg.der;
        this.ah  = this.canvas.height - mg.arr - mg.aba;
        this.dx  = this.aw / Guitarra.TRASTES;
        this.dy  = this.ah / (Guitarra.CUERDAS - 1);
        this.r   = Math.min(this.dx, this.dy) * 0.31;
    }

    posX(traste)  { return this.mg.izq + (traste - 0.5) * this.dx; }
    posY(cuerda)  { return this.mg.arr + (Guitarra.CUERDAS - 1 - cuerda) * this.dy; }

    dibujar(seleccionadas, estado) {
        const { ctx, canvas } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this._dibujarFondo();
        this._dibujarMarcadores();
        this._dibujarCejuela();
        this._dibujarTrastes();
        this._dibujarCuerdas();
        this._dibujarEtiquetasCuerdas();
        this._dibujarEtiquetasTrastes();
        this._dibujarPuntos(seleccionadas, estado);
    }

    _dibujarFondo() {
        const g = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        g.addColorStop(0,   'rgba(70,30,5,0.25)');
        g.addColorStop(0.5, 'rgba(0,0,0,0.08)');
        g.addColorStop(1,   'rgba(70,30,5,0.25)');
        this.ctx.fillStyle = g;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    _dibujarMarcadores() {
        const ctx = this.ctx;
        [3, 5, 7, 9, 12, 15].forEach(t => {
            const x = this.posX(t);
            ctx.fillStyle = 'rgba(255,255,255,0.09)';
            if (t === 12) {
                [1.5, 3.5].forEach(cy => {
                    ctx.beginPath();
                    ctx.arc(x, this.posY(cy), 9, 0, Math.PI * 2);
                    ctx.fill();
                });
            } else {
                ctx.beginPath();
                ctx.arc(x, this.posY(2.5), 9, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    _dibujarCejuela() {
        const { ctx, mg } = this;
        ctx.fillStyle = '#d4c090';
        ctx.fillRect(mg.izq - 5, mg.arr - 4, 6, this.ah + 8);
    }

    _dibujarTrastes() {
        const { ctx, mg } = this;
        for (let t = 1; t <= Guitarra.TRASTES; t++) {
            const x = mg.izq + t * this.dx;
            ctx.beginPath();
            ctx.moveTo(x, mg.arr - 3);
            ctx.lineTo(x, mg.arr + this.ah + 3);
            ctx.strokeStyle = t === 12 ? 'rgba(210,180,110,0.9)' : 'rgba(160,130,80,0.5)';
            ctx.lineWidth   = t === 12 ? 2.5 : 1.5;
            ctx.stroke();
        }
    }

    _dibujarCuerdas() {
        const { ctx, mg } = this;
        const GROSORES       = [2.7, 2.2, 1.8, 1.3, 0.9, 0.6];
        const COLORES_CUERDA = ['#c8bfa0','#c8bfa8','#bfba9e','#a8a896','#989886','#888876'];
        for (let c = 0; c < Guitarra.CUERDAS; c++) {
            const y = this.posY(c);
            ctx.beginPath();
            ctx.moveTo(mg.izq, y);
            ctx.lineTo(mg.izq + this.aw, y);
            ctx.strokeStyle = COLORES_CUERDA[c];
            ctx.lineWidth   = GROSORES[c];
            ctx.stroke();
        }
    }

    _dibujarEtiquetasCuerdas() {
        const { ctx, mg } = this;
        ctx.font         = '11px monospace';
        ctx.textAlign    = 'right';
        ctx.textBaseline = 'middle';
        for (let c = 0; c < Guitarra.CUERDAS; c++) {
            ctx.fillStyle = '#bbb';
            ctx.fillText(Guitarra.NOMBRES_CUERDAS[c], mg.izq - 8, this.posY(c));
        }
    }

    _dibujarEtiquetasTrastes() {
        const { ctx, mg } = this;
        ctx.font         = '10px monospace';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle    = '#666';
        for (let t = 1; t <= Guitarra.TRASTES; t++) {
            ctx.fillText(t, this.posX(t), mg.arr - 10);
        }
    }

    _dibujarPuntos(seleccionadas, estado) {
        const { ctx } = this;
        const COLORES_ESTADO = { jugando: '#f0a500', correcto: '#2ecc71', incorrecto: '#e74c3c' };
        const color = COLORES_ESTADO[estado] || '#f0a500';

        seleccionadas.forEach(({ cuerda, traste }) => {
            const x    = this.posX(traste);
            const y    = this.posY(cuerda);
            const nota = Guitarra.obtenerNota(cuerda, traste);

            ctx.save();
            ctx.shadowColor = color;
            ctx.shadowBlur  = 14;
            ctx.beginPath();
            ctx.arc(x, y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.75)';
            ctx.lineWidth   = 1.5;
            ctx.stroke();
            ctx.shadowBlur   = 0;
            ctx.font         = `bold ${Math.round(this.r * 0.78)}px sans-serif`;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle    = '#111';
            ctx.fillText(nota.nombre, x, y);
            ctx.restore();
        });
    }

    posicionDesdeClick(px, py) {
        for (let c = 0; c < Guitarra.CUERDAS; c++) {
            for (let t = 1; t <= Guitarra.TRASTES; t++) {
                if (Math.hypot(px - this.posX(t), py - this.posY(c)) < this.dy * 0.46) {
                    return { cuerda: c, traste: t };
                }
            }
        }
        return null;
    }
}

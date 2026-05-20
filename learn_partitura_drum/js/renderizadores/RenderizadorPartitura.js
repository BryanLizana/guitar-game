class RenderizadorPartitura {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.espacio = 20;
        this.notaX = 300;
        this.longitudPlica = 50;
    }

    get linea5Y() {
        return (this.canvas.height - 4 * this.espacio) / 2;
    }

    pasosAY(pasos) {
        return this.linea5Y + pasos * (this.espacio / 2);
    }

    renderizar(nota) {
        this._limpiarCanvas();
        this._dibujarPentagrama();
        this._dibujarClavePercusion();
        if (nota) {
            this._dibujarNota(nota);
        }
    }

    _limpiarCanvas() {
        const { ctx, canvas } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    _dibujarPentagrama() {
        const { ctx, canvas, espacio } = this;
        ctx.save();
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'butt';

        for (let i = 0; i <= 4; i++) {
            const y = this.linea5Y + i * espacio;
            ctx.beginPath();
            ctx.moveTo(44, y);
            ctx.lineTo(canvas.width - 30, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    _dibujarClavePercusion() {
        const { ctx } = this;
        const yTop = this.linea5Y - 2;
        const yBottom = this.linea5Y + 4 * this.espacio + 2;
        const x = 58;

        ctx.save();
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'square';

        ctx.beginPath();
        ctx.moveTo(x, yTop);
        ctx.lineTo(x, yBottom);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 8, yTop);
        ctx.lineTo(x + 8, yBottom);
        ctx.stroke();
        ctx.restore();
    }

    _dibujarNota(nota) {
        const { instrumento } = nota;
        const x = this.notaX;
        const y = this.pasosAY(instrumento.pasos);

        this._dibujarLineasAuxiliares(instrumento.pasos, x);

        if (instrumento.tipoNota === 'oval') {
            this._dibujarCabezaOval(x, y);
        } else {
            this._dibujarCabezaX(x, y);
        }

        this._dibujarPlica(x, y, instrumento.pasos);
    }

    _dibujarCabezaOval(x, y) {
        const { ctx } = this;
        ctx.save();
        ctx.fillStyle = '#111111';
        ctx.translate(x, y);
        ctx.scale(1.3, 1);
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _dibujarCabezaX(x, y) {
        const { ctx } = this;
        const s = 7;
        ctx.save();
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(x - s, y - s);
        ctx.lineTo(x + s, y + s);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + s, y - s);
        ctx.lineTo(x - s, y + s);
        ctx.stroke();
        ctx.restore();
    }

    _dibujarPlica(x, y, pasos) {
        const { ctx, longitudPlica } = this;
        const haciaAbajo = pasos < 4;
        const xPlica = haciaAbajo ? x + 10 : x - 10;
        const yFin = haciaAbajo ? y + longitudPlica : y - longitudPlica;

        ctx.save();
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'butt';

        ctx.beginPath();
        ctx.moveTo(xPlica, y);
        ctx.lineTo(xPlica, yFin);
        ctx.stroke();
        ctx.restore();
    }

    _dibujarLineasAuxiliares(pasos, x) {
        const { ctx } = this;
        ctx.save();
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'butt';

        if (pasos < 0) {
            for (let p = -2; p >= pasos; p -= 2) {
                const y = this.pasosAY(p);
                ctx.beginPath();
                ctx.moveTo(x - 18, y);
                ctx.lineTo(x + 18, y);
                ctx.stroke();
            }
        }

        if (pasos > 8) {
            for (let p = 10; p <= pasos; p += 2) {
                const y = this.pasosAY(p);
                ctx.beginPath();
                ctx.moveTo(x - 18, y);
                ctx.lineTo(x + 18, y);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
}

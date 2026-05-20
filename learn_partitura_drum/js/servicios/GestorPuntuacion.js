class GestorPuntuacion {
    constructor() {
        this.correctas = 0;
        this.incorrectas = 0;
        this.racha = 0;
        this.mejorRacha = 0;
    }

    registrarAcierto() {
        this.correctas++;
        this.racha++;
        if (this.racha > this.mejorRacha) {
            this.mejorRacha = this.racha;
        }
    }

    registrarError() {
        this.incorrectas++;
        this.racha = 0;
    }

    obtenerEstado() {
        return {
            correctas: this.correctas,
            incorrectas: this.incorrectas,
            racha: this.racha,
            mejorRacha: this.mejorRacha
        };
    }

    reiniciar() {
        this.correctas = 0;
        this.incorrectas = 0;
        this.racha = 0;
        this.mejorRacha = 0;
    }
}

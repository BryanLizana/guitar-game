class ControladorJuego {
    constructor({ generadorNotas, validadorRespuesta, gestorPuntuacion, renderizadorPartitura, gestorInterfaz, sintetizadorAudio }) {
        this.generadorNotas        = generadorNotas;
        this.validadorRespuesta    = validadorRespuesta;
        this.gestorPuntuacion      = gestorPuntuacion;
        this.renderizadorPartitura = renderizadorPartitura;
        this.gestorInterfaz        = gestorInterfaz;
        this.sintetizadorAudio     = sintetizadorAudio;

        this.notaActual         = null;
        this.esperandoRespuesta = false;
    }

    iniciar() {
        this.gestorPuntuacion.reiniciar();
        this.gestorInterfaz.actualizarPuntuacion(this.gestorPuntuacion.obtenerEstado());
        this.gestorInterfaz.ocultarFeedback();
        this._mostrarSiguienteNota();
    }

    procesarRespuesta(idInstrumento) {
        if (!this.esperandoRespuesta) return;

        this.sintetizadorAudio.reproducir(idInstrumento);

        this.esperandoRespuesta = false;
        const esCorrecta = this.validadorRespuesta.validar(this.notaActual, idInstrumento);

        if (esCorrecta) {
            this.gestorPuntuacion.registrarAcierto();
        } else {
            this.gestorPuntuacion.registrarError();
        }

        this.gestorInterfaz.mostrarFeedback(
            esCorrecta,
            this.notaActual.instrumento.nombre,
            this.notaActual.instrumento.id,
            idInstrumento
        );
        this.gestorInterfaz.actualizarPuntuacion(this.gestorPuntuacion.obtenerEstado());

        const demora = esCorrecta ? 700 : 1600;
        setTimeout(() => {
            this.gestorInterfaz.ocultarFeedback();
            this._mostrarSiguienteNota();
        }, demora);
    }

    _mostrarSiguienteNota() {
        this.notaActual = this.generadorNotas.generarNotaAleatoria();
        this.renderizadorPartitura.renderizar(this.notaActual);
        this.esperandoRespuesta = true;
    }
}

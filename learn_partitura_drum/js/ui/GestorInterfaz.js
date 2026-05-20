class GestorInterfaz {
    constructor() {
        this.controladorJuego    = null;
        this.elCorrectas         = document.getElementById('contadorCorrectas');
        this.elIncorrectas       = document.getElementById('contadorIncorrectas');
        this.elRacha             = document.getElementById('contadorRacha');
        this.elFeedback          = document.getElementById('feedback');
        this.botonesInstrumento  = document.querySelectorAll('.btn-instrumento');
        this.botonReiniciar      = document.getElementById('btnReiniciar');
    }

    conectar(controladorJuego) {
        this.controladorJuego = controladorJuego;
        this._vincularEventos();
    }

    _vincularEventos() {
        // Solo clics en botones de práctica — el teclado lo gestiona GestorModos
        this.botonesInstrumento.forEach(boton => {
            boton.addEventListener('click', () => {
                this.controladorJuego.procesarRespuesta(boton.dataset.instrumento);
            });
        });

        this.botonReiniciar.addEventListener('click', () => {
            this.controladorJuego.iniciar();
        });
    }

    mostrarFeedback(esCorrecta, nombreCorrecto, idCorrecto, idPresionado) {
        const el = this.elFeedback;
        el.classList.remove('correcto', 'incorrecto');

        if (esCorrecta) {
            el.textContent = '¡Correcto!  ✓';
            el.classList.add('visible', 'correcto');
        } else {
            el.textContent = '✗  Era: ' + nombreCorrecto;
            el.classList.add('visible', 'incorrecto');
        }

        this._resaltarBotones(esCorrecta, idCorrecto, idPresionado);
    }

    ocultarFeedback() {
        this.elFeedback.classList.remove('visible', 'correcto', 'incorrecto');
        this.botonesInstrumento.forEach(btn => {
            btn.classList.remove('correcto', 'incorrecto', 'correcto-pista');
        });
    }

    actualizarPuntuacion({ correctas, incorrectas, racha }) {
        this.elCorrectas.textContent   = correctas;
        this.elIncorrectas.textContent = incorrectas;
        this.elRacha.textContent       = racha;
    }

    _resaltarBotones(esCorrecta, idCorrecto, idPresionado) {
        this.botonesInstrumento.forEach(btn => {
            if (btn.dataset.instrumento === idPresionado) {
                btn.classList.add(esCorrecta ? 'correcto' : 'incorrecto');
            }
            if (!esCorrecta && btn.dataset.instrumento === idCorrecto) {
                btn.classList.add('correcto-pista');
            }
        });
    }
}

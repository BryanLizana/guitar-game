class GestorModos {
    constructor(sintetizadorAudio) {
        this.sintetizadorAudio = sintetizadorAudio;
        this.controladorJuego  = null;
        this.modoActual        = 'practica';
    }

    conectar(controladorJuego) {
        this.controladorJuego = controladorJuego;
        this._vincularEventos();
    }

    _vincularEventos() {
        document.getElementById('btnModoPractica').addEventListener('click', () => this._cambiarModo('practica'));
        document.getElementById('btnModoLibre').addEventListener('click',    () => this._cambiarModo('libre'));

        // Pads del modo libre
        document.querySelectorAll('.pad').forEach(pad => {
            pad.addEventListener('mousedown', () => {
                this.sintetizadorAudio.reproducir(pad.dataset.instrumento);
                pad.classList.add('activo');
            });
            pad.addEventListener('mouseup',    () => pad.classList.remove('activo'));
            pad.addEventListener('mouseleave', () => pad.classList.remove('activo'));
            // Soporte táctil
            pad.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.sintetizadorAudio.reproducir(pad.dataset.instrumento);
                pad.classList.add('activo');
            });
            pad.addEventListener('touchend', () => pad.classList.remove('activo'));
        });

        // Atajos de teclado (ambos modos)
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const mapa = { 'h': 'hihat', 't': 'tarola', 'b': 'bombo' };
            const instrumento = mapa[e.key.toLowerCase()];
            if (!instrumento) return;

            if (this.modoActual === 'libre') {
                this.sintetizadorAudio.reproducir(instrumento);
                const pad = document.querySelector('.pad[data-instrumento="' + instrumento + '"]');
                if (pad) {
                    pad.classList.add('activo');
                    setTimeout(() => pad.classList.remove('activo'), 120);
                }
            } else {
                if (this.controladorJuego) this.controladorJuego.procesarRespuesta(instrumento);
            }
        });
    }

    _cambiarModo(modo) {
        this.modoActual = modo;
        const esPractica = modo === 'practica';
        document.getElementById('seccionPractica').classList.toggle('oculto', !esPractica);
        document.getElementById('seccionLibre').classList.toggle('oculto',    esPractica);
        document.querySelectorAll('.btn-modo').forEach(b => b.classList.remove('activo'));
        document.getElementById(esPractica ? 'btnModoPractica' : 'btnModoLibre').classList.add('activo');
    }
}

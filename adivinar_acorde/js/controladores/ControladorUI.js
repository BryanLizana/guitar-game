// S: única responsabilidad — DOM, eventos y actualización de la interfaz
// D: recibe todas sus dependencias por inyección (constructor), no las instancia
class ControladorUI {
    constructor({ juego, renderizador, seleccion, acordes }) {
        this._juego       = juego;
        this._renderizador = renderizador;
        this._seleccion   = seleccion;
        this._acordes     = acordes;
        this._vincularEventos();
        this._poblarTonalidades();
        this._actualizar();
    }

    // ── Inicialización ────────────────────────────────────────────────────────

    _poblarTonalidades() {
        const selector = document.getElementById('selector-tonalidad');
        TeoríaMusical.NOTAS.forEach(n => {
            const opcion = document.createElement('option');
            opcion.value = opcion.textContent = n;
            selector.appendChild(opcion);
        });
    }

    _vincularEventos() {
        document.getElementById('mastil').addEventListener('click', e => {
            if (this._juego.estado !== 'jugando') return;
            const rect = this._renderizador.canvas.getBoundingClientRect();
            const escX = this._renderizador.canvas.width  / rect.width;
            const escY = this._renderizador.canvas.height / rect.height;
            const pos  = this._renderizador.posicionDesdeClick(
                (e.clientX - rect.left) * escX,
                (e.clientY - rect.top)  * escY
            );
            if (!pos) return;
            this._seleccion.alternar(pos.cuerda, pos.traste);
            this._actualizar();
        });

        document.getElementById('btn-tocar').addEventListener('click', () => {
            const esCorrecta = this._juego.tocarYConfirmar();
            this._actualizar();
            if (esCorrecta === true) {
                setTimeout(() => { this._juego.siguiente(); this._actualizar(); }, 1600);
            } else if (esCorrecta === false) {
                setTimeout(() => { this._juego.volverAJugando(); this._actualizar(); }, 1600);
            }
        });

        document.getElementById('btn-limpiar').addEventListener('click', () => {
            if (this._juego.estado === 'correcto') return;
            this._seleccion.limpiar();
            this._juego.volverAJugando();
            this._actualizar();
        });

        document.getElementById('btn-siguiente').addEventListener('click', () => {
            this._juego.siguiente();
            document.getElementById('pista').style.display = 'none';
            this._actualizar();
        });

        document.getElementById('btn-pista').addEventListener('click', () => {
            this._mostrarPista();
        });

        document.getElementById('selector-modo').addEventListener('change', () => {
            this._aplicarCambioModo();
        });

        ['selector-tonalidad', 'selector-escala'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                if (document.getElementById('selector-modo').value === 'escala') {
                    this._aplicarCambioModo();
                }
            });
        });
    }

    // ── Acciones ──────────────────────────────────────────────────────────────

    _aplicarCambioModo() {
        const modo     = document.getElementById('selector-modo').value;
        const tonalidad = document.getElementById('selector-tonalidad').value;
        const escala   = document.getElementById('selector-escala').value;
        document.getElementById('controles-escala').style.display =
            modo === 'escala' ? 'inline' : 'none';
        if (modo === 'escala') this._acordes.configurarEscala(tonalidad, escala);
        else this._acordes.configurarLibre();
        this._juego.siguiente();
        document.getElementById('pista').style.display = 'none';
        this._actualizar();
    }

    _mostrarPista() {
        if (!this._juego.acorde) return;
        const { raiz, tipo, notas } = this._juego.acorde;
        const nombreAcorde = `${raiz}${tipo === 'maj' ? '' : tipo}`;
        const pistaEl = document.getElementById('pista');
        pistaEl.style.display = 'block';
        pistaEl.textContent =
            `💡 ${nombreAcorde} (${TeoríaMusical.NOMBRE_TIPO[tipo]}): ` +
            `las notas son ${notas.join(' - ')}. ` +
            `Selecciona estas 3 notas en 4 cuerdas distintas (una nota se repite en otra octava).`;
    }

    // ── Renderizado ───────────────────────────────────────────────────────────

    _actualizar() {
        this._renderizador.dibujar(this._seleccion.seleccionadas, this._juego.estado);
        this._actualizarDisplayAcorde();
        this._actualizarBotones();
        this._actualizarFeedback();
        this._actualizarPuntuacion();
        this._actualizarInfoNotas();
    }

    _actualizarDisplayAcorde() {
        const acorde = this._juego.acorde;
        if (!acorde) return;
        const nombre = `${acorde.raiz}${acorde.tipo === 'maj' ? '' : acorde.tipo}`;
        document.getElementById('nombre-acorde').textContent = nombre;
        document.getElementById('descripcion-acorde').textContent =
            `${TeoríaMusical.NOMBRE_TIPO[acorde.tipo]} — ${acorde.notas.join(' · ')}`;
    }

    _actualizarBotones() {
        document.getElementById('btn-tocar').disabled = !this._juego.puedeConfirmar();
    }

    _actualizarFeedback() {
        const el = document.getElementById('feedback');
        const mensajes = {
            correcto:   { texto: '✓ ¡Correcto! Pasando al siguiente...', clase: 'correcto' },
            incorrecto: { texto: '✗ No es ese acorde, intenta de nuevo',  clase: 'incorrecto' },
        };
        const info = mensajes[this._juego.estado];
        el.textContent = info ? info.texto : '';
        el.className   = info ? info.clase  : '';
    }

    _actualizarPuntuacion() {
        document.getElementById('cnt-ok').textContent  = this._juego.totalOk;
        document.getElementById('cnt-mal').textContent = this._juego.totalMal;
    }

    _actualizarInfoNotas() {
        const notas = [...this._seleccion.seleccionadas]
            .sort((a, b) => a.cuerda - b.cuerda)
            .map(s => Guitarra.obtenerNota(s.cuerda, s.traste).nombre);
        document.getElementById('texto-notas').textContent =
            notas.length ? `${notas.join(' — ')} (${notas.length}/4)` : '—';
    }
}

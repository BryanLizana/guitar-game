class GestorMetronomo {
    constructor(metronomo) {
        this.metronomo = metronomo;
        this._vincularEventos();
    }

    _vincularEventos() {
        document.getElementById('btnMetronomo').addEventListener('click',  () => this._toggleMetronomo());
        document.getElementById('btnBpmMenos').addEventListener('click',   () => this._ajustarBpm(-5));
        document.getElementById('btnBpmMas').addEventListener('click',     () => this._ajustarBpm(+5));
        document.getElementById('sliderBpm').addEventListener('input', (e) => {
            this.metronomo.ajustarBpm(parseInt(e.target.value));
            this._actualizarDisplayBpm();
        });
    }

    _toggleMetronomo() {
        const btn = document.getElementById('btnMetronomo');
        if (this.metronomo.activo) {
            this.metronomo.detener();
            btn.textContent = '▶ Metrónomo';
            btn.classList.remove('activo');
        } else {
            this.metronomo.iniciar();
            btn.textContent = '⏹ Detener';
            btn.classList.add('activo');
        }
    }

    _ajustarBpm(delta) {
        this.metronomo.ajustarBpm(this.metronomo.bpm + delta);
        this._actualizarDisplayBpm();
    }

    _actualizarDisplayBpm() {
        document.getElementById('valorBpm').textContent = this.metronomo.bpm;
        document.getElementById('sliderBpm').value     = this.metronomo.bpm;
    }

    actualizarBeat(beatIndex, esAccento) {
        const beats = document.querySelectorAll('.beat');
        beats.forEach((beat, i) => {
            beat.classList.remove('activo', 'acento');
            if (i === beatIndex) {
                beat.classList.add('activo');
                if (esAccento) beat.classList.add('acento');
            }
        });
        setTimeout(() => beats.forEach(b => b.classList.remove('activo', 'acento')), 130);
    }
}

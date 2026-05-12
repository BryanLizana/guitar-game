// S: única responsabilidad — lógica del juego y puntuación
// D: recibe sus dependencias por inyección (DIP), no las crea
class JuegoAcordes {
    constructor(gestorSeleccion, gestorAcordes, motorAudio) {
        this._seleccion = gestorSeleccion;
        this._acordes   = gestorAcordes;
        this._audio     = motorAudio;
        this.acorde     = null;
        this.estado     = 'esperando'; // 'esperando' | 'jugando' | 'correcto' | 'incorrecto'
        this.totalOk    = 0;
        this.totalMal   = 0;
    }

    siguiente() {
        this.acorde = this._acordes.aleatorio(this.acorde);
        this._seleccion.limpiar();
        this.estado = 'jugando';
    }

    puedeConfirmar() {
        return this._seleccion.estaCompleta() && this.estado === 'jugando';
    }

    tocarYConfirmar() {
        if (!this.puedeConfirmar()) return null;
        const midis = this._seleccion.midiOrdenados();
        this._audio.tocarAcorde(midis);
        const esCorrecta = TeoríaMusical.esVoicingValido(midis, this.acorde);
        if (esCorrecta) { this.estado = 'correcto';   this.totalOk++;  }
        else            { this.estado = 'incorrecto'; this.totalMal++; }
        return esCorrecta;
    }

    volverAJugando() {
        if (this.estado === 'incorrecto') this.estado = 'jugando';
    }
}

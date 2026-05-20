class GeneradorNotas {
    constructor(instrumentos) {
        this.instrumentos = instrumentos;
        this.ultimoInstrumento = null;
    }

    generarNotaAleatoria() {
        let instrumento;
        do {
            const indice = Math.floor(Math.random() * this.instrumentos.length);
            instrumento = this.instrumentos[indice];
        } while (this.instrumentos.length > 1 && instrumento === this.ultimoInstrumento);

        this.ultimoInstrumento = instrumento;
        return new Nota(instrumento);
    }
}

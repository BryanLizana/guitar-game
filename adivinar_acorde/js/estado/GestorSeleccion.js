// S: única responsabilidad — estado de las notas marcadas por el jugador en el mástil
class GestorSeleccion {
    constructor() {
        this.seleccionadas = [];
        this.MAX = 4;
    }

    alternar(cuerda, traste) {
        const mismoIndice = this.seleccionadas.findIndex(
            s => s.cuerda === cuerda && s.traste === traste
        );
        if (mismoIndice >= 0) {
            this.seleccionadas.splice(mismoIndice, 1);
            return true;
        }
        // Reemplaza cualquier nota ya marcada en la misma cuerda
        this.seleccionadas = this.seleccionadas.filter(s => s.cuerda !== cuerda);
        if (this.seleccionadas.length < this.MAX) {
            this.seleccionadas.push({ cuerda, traste });
            return true;
        }
        return false;
    }

    limpiar()      { this.seleccionadas = []; }
    estaCompleta() { return this.seleccionadas.length === this.MAX; }

    midiOrdenados() {
        return [...this.seleccionadas]
            .sort((a, b) => a.cuerda - b.cuerda)
            .map(s => Guitarra.obtenerNota(s.cuerda, s.traste).midi);
    }
}

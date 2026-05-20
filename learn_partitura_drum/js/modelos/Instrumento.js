class Instrumento {
    constructor({ id, nombre, pasos, tipoNota, tecla }) {
        this.id = id;
        this.nombre = nombre;
        this.pasos = pasos;   // pasos desde línea 5 (superior), cada paso = espacio/2
        this.tipoNota = tipoNota; // 'oval' | 'x'
        this.tecla = tecla;
    }
}

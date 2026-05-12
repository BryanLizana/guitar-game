// S: única responsabilidad — lista de acordes disponibles según el modo de juego
// O: nuevos modos se agregan sin modificar la lógica de selección aleatoria
class GestorAcordes {
    constructor() {
        this._lista = this._generarLibres();
    }

    _generarLibres() {
        const acordes = [];
        TeoríaMusical.NOTAS.forEach(raiz => {
            ['maj', 'm', 'dim'].forEach(tipo => {
                acordes.push({ raiz, tipo, notas: TeoríaMusical.notasDeAcorde(raiz, tipo) });
            });
        });
        return acordes;
    }

    configurarLibre() {
        this._lista = this._generarLibres();
    }

    configurarEscala(tonalidad, tipoEscala) {
        this._lista = TeoríaMusical.acordesDiatonicos(tonalidad, tipoEscala);
    }

    aleatorio(excluir) {
        const candidatos = excluir
            ? this._lista.filter(a => !(a.raiz === excluir.raiz && a.tipo === excluir.tipo))
            : this._lista;
        return candidatos[Math.floor(Math.random() * candidatos.length)];
    }
}

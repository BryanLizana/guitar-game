class ValidadorRespuesta {
    validar(nota, idInstrumentoElegido) {
        return nota.instrumento.id === idInstrumentoElegido;
    }
}

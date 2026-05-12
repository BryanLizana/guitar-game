// S: única responsabilidad — lógica de teoría musical
// D: depende de constantes globales de ConstantesMusicales.js, no de implementaciones concretas
const TeoríaMusical = (() => {
    function idx(nota) { return NOTAS.indexOf(nota); }
    function nombre(i)  { return NOTAS[((i % 12) + 12) % 12]; }

    function notasDeAcorde(raiz, tipo) {
        return INTERVALOS_ACORDE[tipo].map(i => nombre(idx(raiz) + i));
    }

    function acordesDiatonicos(tonalidad, tipoEscala) {
        const base = idx(tonalidad);
        return INTERVALOS_ESCALA[tipoEscala].map((iv, i) => {
            const raiz = nombre(base + iv);
            const tipo = TIPOS_DIATONICOS[tipoEscala][i];
            return { raiz, tipo, notas: notasDeAcorde(raiz, tipo) };
        });
    }

    function esVoicingValido(notasMidi, acorde) {
        const selec   = new Set(notasMidi.map(m => ((m % 12) + 12) % 12));
        const objetivo = new Set(acorde.notas.map(n => idx(n)));
        if (selec.size !== objetivo.size) return false;
        for (const c of objetivo) { if (!selec.has(c)) return false; }
        return true;
    }

    // Re-expone las constantes para que los módulos clientes usen un solo punto de acceso
    return { NOTAS, NOMBRE_TIPO, idx, nombre, notasDeAcorde, acordesDiatonicos, esVoicingValido };
})();

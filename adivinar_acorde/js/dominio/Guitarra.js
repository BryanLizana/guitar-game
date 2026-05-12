// S: única responsabilidad — datos y cálculos del instrumento guitarra
// D: depende de TeoríaMusical para convertir MIDI a nombre de nota
const Guitarra = (() => {
    const MIDI_BASE        = [40, 45, 50, 55, 59, 64]; // E₂ A₂ D₃ G₃ B₃ e₄
    const NOMBRES_CUERDAS  = ['E₂','A₂','D₃','G₃','B₃','e₄'];
    const TRASTES          = 16;
    const CUERDAS          = 6;

    function obtenerNota(cuerda, traste) {
        const midi = MIDI_BASE[cuerda] + traste;
        return { midi, nombre: TeoríaMusical.nombre(midi) };
    }

    function midiAHz(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    return { MIDI_BASE, NOMBRES_CUERDAS, TRASTES, CUERDAS, obtenerNota, midiAHz };
})();

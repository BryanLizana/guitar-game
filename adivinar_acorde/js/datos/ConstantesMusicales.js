// S: única responsabilidad — constantes puras del dominio musical
// O: nuevos tipos de acorde o escala se agregan aquí sin tocar lógica

const NOTAS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

const INTERVALOS_ACORDE = {
    maj: [0, 4, 7],
    m:   [0, 3, 7],
    dim: [0, 3, 6],
    aug: [0, 4, 8],
};

const NOMBRE_TIPO = {
    maj: 'Mayor',
    m:   'menor',
    dim: 'disminuido',
    aug: 'aumentado',
};

const INTERVALOS_ESCALA = {
    mayor:         [0, 2, 4, 5, 7, 9, 11],
    menorNatural:  [0, 2, 3, 5, 7, 8, 10],
    menorArmonica: [0, 2, 3, 5, 7, 8, 11],
};

const TIPOS_DIATONICOS = {
    mayor:         ['maj','m','m','maj','maj','m','dim'],
    menorNatural:  ['m','dim','maj','m','m','maj','maj'],
    menorArmonica: ['m','dim','aug','m','maj','maj','dim'],
};

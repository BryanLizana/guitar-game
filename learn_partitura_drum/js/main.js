const canvas = document.getElementById('canvasPartitura');

// Audio y metrónomo
const sintetizadorAudio = new SintetizadorAudio();
const metronomo         = new Metronomo(sintetizadorAudio);
const gestorMetronomo   = new GestorMetronomo(metronomo);
metronomo.callbackTick  = function(beatIndex, esAccento) {
    gestorMetronomo.actualizarBeat(beatIndex, esAccento);
};

// Juego de práctica
const generadorNotas        = new GeneradorNotas(catalogoInstrumentos);
const validadorRespuesta    = new ValidadorRespuesta();
const gestorPuntuacion      = new GestorPuntuacion();
const renderizadorPartitura = new RenderizadorPartitura(canvas);
const gestorInterfaz        = new GestorInterfaz();

const controladorJuego = new ControladorJuego({
    generadorNotas,
    validadorRespuesta,
    gestorPuntuacion,
    renderizadorPartitura,
    gestorInterfaz,
    sintetizadorAudio
});

// Modos (practica / libre) + teclado
const gestorModos = new GestorModos(sintetizadorAudio);

gestorInterfaz.conectar(controladorJuego);
gestorModos.conectar(controladorJuego);
controladorJuego.iniciar();

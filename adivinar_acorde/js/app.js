// Punto de entrada — composición de dependencias (DIP)
// Instancia y conecta todos los módulos; ningún otro archivo conoce el grafo completo
window.addEventListener('DOMContentLoaded', () => {
    const motorAudio   = new MotorAudio();
    const seleccion    = new GestorSeleccion();
    const acordes      = new GestorAcordes();
    const renderizador = new RenderizadorMastil(document.getElementById('mastil'));
    const juego        = new JuegoAcordes(seleccion, acordes, motorAudio);
    new ControladorUI({ juego, renderizador, seleccion, acordes });
});

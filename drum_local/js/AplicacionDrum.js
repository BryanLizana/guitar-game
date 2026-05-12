// DIP: Raíz de composición — inyecta todas las dependencias
class AplicacionDrum {
  constructor() {
    const gestorContexto = new GestorContextoAudio();
    const sintetizador   = new SintetizadorDrum(gestorContexto);
    const biblioteca     = new BibliotecaSonidos(sintetizador);
    const secuenciador   = new SecuenciadorRitmo(biblioteca, gestorContexto);
    const metronomo      = new MetronomoTap();
    const presets        = new PresetsRitmo();
    const grid           = new RenderizadorGrid(
      document.getElementById('contenedor-pistas'),
      biblioteca
    );

    this._controlador = new ControladorUI(secuenciador, metronomo, presets, grid, biblioteca);
  }

  iniciar() {
    this._controlador.inicializar();
    this._controlador.cargarPresetInicial('rock_basico');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AplicacionDrum().iniciar();
});

// DIP: Raíz de composición — inyecta todas las dependencias
class AplicacionDrum {
  constructor() {
    const gestorContexto = new GestorContextoAudio();
    const sintetizador   = new SintetizadorDrum(gestorContexto);
    const cargador       = new CargadorSamples(gestorContexto);
    const reproductor    = new ReproductorSamples(gestorContexto, cargador, sintetizador);
    const biblioteca     = new BibliotecaSonidos(reproductor);
    const secuenciador   = new SecuenciadorRitmo(biblioteca, gestorContexto);
    const metronomo      = new MetronomoTap();
    const presets        = new PresetsRitmo();
    const grid           = new RenderizadorGrid(
      document.getElementById('contenedor-pistas'),
      biblioteca
    );

    this._controlador      = new ControladorUI(secuenciador, metronomo, presets, grid, biblioteca);
    this._controladorCarga = new ControladorCargaSamples(cargador);
  }

  async iniciar() {
    this._controlador.inicializar();
    this._controlador.cargarPresetInicial('rock_basico');
    this._controladorCarga.inicializar();
    await this._controladorCarga.intentarCargaAutomatica();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AplicacionDrum().iniciar();
});

// S: única responsabilidad — estado centralizado de la aplicación
// I: interfaz mínima — solo expone lo que los módulos necesitan
(function () {
  window.GuitarScaleFinder.EstadoApp = {
    // Estado de la lista de acordes
    listaAcordes: [],

    // Posiciones seleccionadas en el mástil del detector
    posSelec: new Map(),

    // Modo activo: 'detector' | 'mapa'
    modo: 'detector',

    // Configuración del mapa de escala
    tonica: 'C',
    tipoEsc: 'mayor',

    // Acorde diatónico seleccionado (para highlight)
    acordeDiatSel: null,
    acordeDiatColor: null,

    // Estado de highlight del mástil
    hlAcordeIdx: null,
    mostrarEnMastil: true,
    acorDeHighlightTimer: null,
    hlCountdownInterval: null,
  };
})();

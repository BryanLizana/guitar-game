// Punto de entrada — inicializa la aplicación una vez el DOM está listo
(function () {
  const { ACORDES_RAPIDOS } = window.GuitarScaleFinder.Acordes;
  const { ControladorApp, ComponentePanelIzq, ComponentePanelDer } = window.GuitarScaleFinder;

  function inicializarAcordesRapidos() {
    document.getElementById('acordes-rapidos').innerHTML = ACORDES_RAPIDOS
      .map(a => `<button class="btn-rapido" data-acorde="${a}">${a}</button>`)
      .join('');
    document.getElementById('acordes-rapidos').addEventListener('click', e => {
      const btn = e.target.closest('.btn-rapido');
      if (btn) ControladorApp.agregarAcorde(btn.dataset.acorde);
    });
  }

  function inicializar() {
    inicializarAcordesRapidos();
    ControladorApp.vincularEventosEstaticos();
    ComponentePanelIzq.renderizarPanelIzquierdo();
    ComponentePanelDer.renderizarPanelDerecho();
  }

  inicializar();
})();

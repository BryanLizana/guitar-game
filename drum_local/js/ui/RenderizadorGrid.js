// SRP: Único responsable de renderizar el grid de pistas y actualizar el paso activo
class RenderizadorGrid {
  constructor(contenedor, biblioteca) {
    this._contenedor = contenedor;
    this._biblioteca = biblioteca; // DIP
    this._onAlternarPaso = null;
    this._onCambiarTipo = null;
    this._onEliminarPista = null;
    this._onCambiarVolumen = null;
    this._onMutePista = null;
  }

  establecerCallbacks({ alternarPaso, cambiarTipo, eliminarPista, cambiarVolumen, mutePista }) {
    this._onAlternarPaso = alternarPaso;
    this._onCambiarTipo = cambiarTipo;
    this._onEliminarPista = eliminarPista;
    this._onCambiarVolumen = cambiarVolumen;
    this._onMutePista = mutePista;
  }

  renderizar(pistas) {
    this._contenedor.innerHTML = '';
    pistas.forEach(pista => {
      this._contenedor.appendChild(this._crearFilaPista(pista));
    });
  }

  _crearFilaPista(pista) {
    const sonido = this._biblioteca.obtenerSonido(pista.tipoSonido);
    const fila = document.createElement('div');
    fila.className = `pista ${pista.silenciada ? 'silenciada' : ''}`;
    fila.dataset.pistaId = pista.id;

    fila.appendChild(this._crearControlesPista(pista, sonido));
    fila.appendChild(this._crearGridPasos(pista, sonido));
    return fila;
  }

  _crearControlesPista(pista, sonido) {
    const controles = document.createElement('div');
    controles.className = 'pista-controles';

    // Color accent strip
    const strip = document.createElement('div');
    strip.className = 'pista-color';
    strip.style.background = sonido.color;
    controles.appendChild(strip);

    // Select tipo sonido
    const select = document.createElement('select');
    select.className = 'selector-tipo';
    this._biblioteca.obtenerTipos().forEach(tipo => {
      const op = document.createElement('option');
      op.value = tipo;
      op.textContent = this._biblioteca.obtenerSonido(tipo).nombre;
      if (tipo === pista.tipoSonido) op.selected = true;
      select.appendChild(op);
    });
    select.addEventListener('change', e => this._onCambiarTipo?.(pista.id, e.target.value));
    controles.appendChild(select);

    // Volumen
    const vol = document.createElement('input');
    vol.type = 'range';
    vol.min = 0; vol.max = 1; vol.step = 0.05;
    vol.value = pista.volumen;
    vol.className = 'slider-volumen';
    vol.title = 'Volumen';
    vol.addEventListener('input', e => this._onCambiarVolumen?.(pista.id, parseFloat(e.target.value)));
    controles.appendChild(vol);

    // Mute
    const btnMute = document.createElement('button');
    btnMute.className = `btn-mute ${pista.silenciada ? 'activo' : ''}`;
    btnMute.textContent = 'M';
    btnMute.title = 'Silenciar';
    btnMute.addEventListener('click', () => {
      pista.silenciada = !pista.silenciada;
      btnMute.classList.toggle('activo', pista.silenciada);
      btnMute.closest('.pista').classList.toggle('silenciada', pista.silenciada);
      this._onMutePista?.(pista.id, pista.silenciada);
    });
    controles.appendChild(btnMute);

    // Eliminar
    const btnDel = document.createElement('button');
    btnDel.className = 'btn-eliminar';
    btnDel.textContent = '×';
    btnDel.title = 'Eliminar pista';
    btnDel.addEventListener('click', () => this._onEliminarPista?.(pista.id));
    controles.appendChild(btnDel);

    return controles;
  }

  _crearGridPasos(pista, sonido) {
    const grid = document.createElement('div');
    grid.className = 'grid-pasos';

    pista.pasos.forEach((activo, i) => {
      const btn = document.createElement('button');
      btn.className = `paso ${activo ? 'activo' : ''}`;
      btn.dataset.indice = i;
      btn.style.setProperty('--color-pista', sonido.color);

      // separador visual cada 4 pasos
      if (i > 0 && i % 4 === 0) btn.classList.add('grupo-inicio');

      btn.addEventListener('click', () => {
        this._onAlternarPaso?.(pista.id, i);
        btn.classList.toggle('activo');
      });

      grid.appendChild(btn);
    });

    return grid;
  }

  actualizarPaso(paso) {
    // Quitar clase 'actual' de todos
    this._contenedor.querySelectorAll('.paso.actual').forEach(el => el.classList.remove('actual'));

    if (paso < 0) return;

    // Poner 'actual' en el paso correcto de cada pista
    this._contenedor.querySelectorAll(`.paso[data-indice="${paso}"]`).forEach(el => {
      el.classList.add('actual');
    });

    // Actualizar indicadores de beat (4 puntos, cada 4 pasos)
    const grupo = Math.floor(paso / 4) % 4;
    document.querySelectorAll('.beat-dot').forEach((dot, idx) => {
      dot.classList.toggle('beat-activo', idx === grupo);
    });
  }
}

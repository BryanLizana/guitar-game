// SRP: controla la UI para cargar y mostrar el estado del kit de samples
class ControladorCargaSamples {
  constructor(cargadorSamples) {
    this._cargador = cargadorSamples;
  }

  inicializar() {
    const input  = document.getElementById('input-samples');
    const btn    = document.getElementById('btn-cargar-kit');
    const estado = document.getElementById('estado-samples');
    const btnLimpiar = document.getElementById('btn-limpiar-kit');

    btn.addEventListener('click', () => input.click());

    input.addEventListener('change', async (e) => {
      const archivos = Array.from(e.target.files);
      if (!archivos.length) return;

      estado.textContent = 'Cargando…';
      estado.className = 'estado-samples cargando';
      btn.disabled = true;

      const res = await this._cargador.cargarArchivos(archivos);

      if (res.cargados === 0) {
        estado.textContent = 'Sin coincidencias';
        estado.className = 'estado-samples error';
      } else {
        estado.textContent = `${res.cargados} samples`;
        estado.className = 'estado-samples ok';
        btnLimpiar.style.display = 'inline-block';
      }
      btn.disabled = false;
      input.value = '';
    });

    btnLimpiar.addEventListener('click', () => {
      this._cargador.limpiar();
      estado.textContent = 'Síntesis';
      estado.className = 'estado-samples';
      btnLimpiar.style.display = 'none';
    });
  }

  // Intenta cargar desde samples/ automáticamente (falla silenciosamente en file://)
  async intentarCargaAutomatica() {
    const estado     = document.getElementById('estado-samples');
    const btnLimpiar = document.getElementById('btn-limpiar-kit');
    try {
      estado.textContent = 'Cargando…';
      estado.className = 'estado-samples cargando';
      const n = await this._cargador.cargarDesdeRuta('samples/');
      if (n > 0) {
        estado.textContent = `${n} samples`;
        estado.className = 'estado-samples ok';
        btnLimpiar.style.display = 'inline-block';
      } else {
        estado.textContent = 'Síntesis';
        estado.className = 'estado-samples';
      }
    } catch {
      estado.textContent = 'Síntesis';
      estado.className = 'estado-samples';
    }
  }
}

// SRP: Único responsable del estado de una pista (track) del looper
class PistaRitmo {
  constructor(id, tipoSonido, numeroPasos = 16) {
    this.id = id;
    this.tipoSonido = tipoSonido;
    this.numeroPasos = numeroPasos;
    this.pasos = new Array(numeroPasos).fill(false);
    this.volumen = 0.8;
    this.silenciada = false;
  }

  alternarPaso(indice) {
    if (indice >= 0 && indice < this.numeroPasos) {
      this.pasos[indice] = !this.pasos[indice];
    }
  }

  estaActivo(indice) {
    return this.pasos[indice] === true;
  }

  establecerPatron(patron) {
    this.pasos = patron.slice(0, this.numeroPasos);
    while (this.pasos.length < this.numeroPasos) this.pasos.push(false);
  }

  redimensionar(nuevoPasos) {
    if (nuevoPasos > this.numeroPasos) {
      while (this.pasos.length < nuevoPasos) this.pasos.push(false);
    } else {
      this.pasos = this.pasos.slice(0, nuevoPasos);
    }
    this.numeroPasos = nuevoPasos;
  }

  limpiar() {
    this.pasos.fill(false);
  }

  cambiarTipo(nuevoTipo) {
    this.tipoSonido = nuevoTipo;
  }
}

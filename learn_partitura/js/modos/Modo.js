'use strict';

// LSP / OCP: clase base que define el contrato de todos los modos.
// Cualquier nuevo modo debe extender esta clase e implementar activar/desactivar.
var Modo = class {
  activar()    {}
  desactivar() {}
};

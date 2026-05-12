'use strict';

// step: posición en el pentagrama (clave de Sol)
//   0=E4 (1ª línea), 1=F4, 2=G4 (2ª línea), 4=B4 (centro), 6=D5, 8=F5 (5ª línea)
//   Líneas del pentagrama: steps pares 0,2,4,6,8
var NOTAS_MUSICALES = [
  { id:'A3',  letter:'A', solfeo:'La',  sharp:false, step:-4, freq:220.00  },
  { id:'B3',  letter:'B', solfeo:'Si',  sharp:false, step:-3, freq:246.94  },
  { id:'C4',  letter:'C', solfeo:'Do',  sharp:false, step:-2, freq:261.63  },
  { id:'C#4', letter:'C', solfeo:'Do',  sharp:true,  step:-2, freq:277.18  },
  { id:'Db4', letter:'D', solfeo:'Re',  flat:true,   step:-2, freq:277.18  },
  { id:'D4',  letter:'D', solfeo:'Re',  sharp:false, step:-1, freq:293.66  },
  { id:'D#4', letter:'D', solfeo:'Re',  sharp:true,  step:-1, freq:311.13  },
  { id:'Eb4', letter:'E', solfeo:'Mi',  flat:true,   step:-1, freq:311.13  },
  { id:'E4',  letter:'E', solfeo:'Mi',  sharp:false, step: 0, freq:329.63  },
  { id:'F4',  letter:'F', solfeo:'Fa',  sharp:false, step: 1, freq:349.23  },
  { id:'F#4', letter:'F', solfeo:'Fa',  sharp:true,  step: 1, freq:369.99  },
  { id:'Gb4', letter:'G', solfeo:'Sol', flat:true,   step: 1, freq:369.99  },
  { id:'G4',  letter:'G', solfeo:'Sol', sharp:false, step: 2, freq:392.00  },
  { id:'G#4', letter:'G', solfeo:'Sol', sharp:true,  step: 2, freq:415.30  },
  { id:'Ab4', letter:'A', solfeo:'La',  flat:true,   step: 2, freq:415.30  },
  { id:'A4',  letter:'A', solfeo:'La',  sharp:false, step: 3, freq:440.00  },
  { id:'A#4', letter:'A', solfeo:'La',  sharp:true,  step: 3, freq:466.16  },
  { id:'Bb4', letter:'B', solfeo:'Si',  flat:true,   step: 3, freq:466.16  },
  { id:'B4',  letter:'B', solfeo:'Si',  sharp:false, step: 4, freq:493.88  },
  { id:'C5',  letter:'C', solfeo:'Do',  sharp:false, step: 5, freq:523.25  },
  { id:'C#5', letter:'C', solfeo:'Do',  sharp:true,  step: 5, freq:554.37  },
  { id:'Db5', letter:'D', solfeo:'Re',  flat:true,   step: 5, freq:554.37  },
  { id:'D5',  letter:'D', solfeo:'Re',  sharp:false, step: 6, freq:587.33  },
  { id:'D#5', letter:'D', solfeo:'Re',  sharp:true,  step: 6, freq:622.25  },
  { id:'Eb5', letter:'E', solfeo:'Mi',  flat:true,   step: 6, freq:622.25  },
  { id:'E5',  letter:'E', solfeo:'Mi',  sharp:false, step: 7, freq:659.25  },
  { id:'F5',  letter:'F', solfeo:'Fa',  sharp:false, step: 8, freq:698.46  },
  { id:'F#5', letter:'F', solfeo:'Fa',  sharp:true,  step: 8, freq:739.99  },
  { id:'Gb5', letter:'G', solfeo:'Sol', flat:true,   step: 8, freq:739.99  },
  { id:'G5',  letter:'G', solfeo:'Sol', sharp:false, step: 9, freq:783.99  },
  { id:'G#5', letter:'G', solfeo:'Sol', sharp:true,  step: 9, freq:830.61  },
  { id:'Ab5', letter:'A', solfeo:'La',  flat:true,   step: 9, freq:830.61  },
  { id:'A5',  letter:'A', solfeo:'La',  sharp:false, step:10, freq:880.00  },
  { id:'A#5', letter:'A', solfeo:'La',  sharp:true,  step:10, freq:932.33  },
  { id:'Bb5', letter:'B', solfeo:'Si',  flat:true,   step:10, freq:932.33  },
  { id:'B5',  letter:'B', solfeo:'Si',  sharp:false, step:11, freq:987.77  },
  { id:'C6',  letter:'C', solfeo:'Do',  sharp:false, step:12, freq:1046.50 },
];

var MAPA_SOLFEO = { A:'La', B:'Si', C:'Do', D:'Re', E:'Mi', F:'Fa', G:'Sol' };

// Frecuencias para modo tablatura (octava 4).
// bemol: null = ese bemol no se usa en notación estándar (Cb, Fb).
var FRECUENCIAS_TABLATURA = {
  A: { natural:440.00, sostenido:466.16, bemol:415.30 }, // Ab = G#
  B: { natural:493.88, sostenido:null,   bemol:466.16 }, // Bb = A#
  C: { natural:261.63, sostenido:277.18, bemol:null   }, // Cb no estándar
  D: { natural:293.66, sostenido:311.13, bemol:277.18 }, // Db = C#
  E: { natural:329.63, sostenido:null,   bemol:311.13 }, // Eb = D#
  F: { natural:349.23, sostenido:369.99, bemol:null   }, // Fb no estándar
  G: { natural:392.00, sostenido:415.30, bemol:369.99 }, // Gb = F#
};

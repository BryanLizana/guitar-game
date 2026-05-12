// SRP: Único responsable de generar formas de onda para cada tipo de drum
class SintetizadorDrum {
  constructor(gestorContexto) {
    this._gestor = gestorContexto; // DIP: depende de abstracción
  }

  tocarKick(tiempo, volumen = 1) {
    const ctx = this._gestor.obtener();
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.connect(env);
    env.connect(ctx.destination);

    osc.frequency.setValueAtTime(160, tiempo);
    osc.frequency.exponentialRampToValueAtTime(0.001, tiempo + 0.5);
    env.gain.setValueAtTime(volumen * 1.2, tiempo);
    env.gain.exponentialRampToValueAtTime(0.001, tiempo + 0.5);

    osc.start(tiempo);
    osc.stop(tiempo + 0.5);
  }

  tocarSnare(tiempo, volumen = 1) {
    const ctx = this._gestor.obtener();
    const tamano = ctx.sampleRate * 0.18;
    const buffer = ctx.createBuffer(1, tamano, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < tamano; i++) datos[i] = Math.random() * 2 - 1;

    const fuente = ctx.createBufferSource();
    fuente.buffer = buffer;

    const filtro = ctx.createBiquadFilter();
    filtro.type = 'highpass';
    filtro.frequency.value = 1200;

    // tono de caja
    const osc = ctx.createOscillator();
    const envOsc = ctx.createGain();
    osc.frequency.value = 180;
    envOsc.gain.setValueAtTime(volumen * 0.4, tiempo);
    envOsc.gain.exponentialRampToValueAtTime(0.001, tiempo + 0.1);
    osc.connect(envOsc);
    envOsc.connect(ctx.destination);

    const env = ctx.createGain();
    env.gain.setValueAtTime(volumen, tiempo);
    env.gain.exponentialRampToValueAtTime(0.001, tiempo + 0.18);
    fuente.connect(filtro);
    filtro.connect(env);
    env.connect(ctx.destination);

    fuente.start(tiempo);
    fuente.stop(tiempo + 0.18);
    osc.start(tiempo);
    osc.stop(tiempo + 0.1);
  }

  tocarHihat(tiempo, volumen = 0.7, abierto = false) {
    const ctx = this._gestor.obtener();
    const duracion = abierto ? 0.35 : 0.06;
    const tamano = Math.floor(ctx.sampleRate * duracion);
    const buffer = ctx.createBuffer(1, tamano, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < tamano; i++) datos[i] = Math.random() * 2 - 1;

    const fuente = ctx.createBufferSource();
    fuente.buffer = buffer;

    const filtro = ctx.createBiquadFilter();
    filtro.type = 'highpass';
    filtro.frequency.value = 8000;

    const env = ctx.createGain();
    env.gain.setValueAtTime(volumen, tiempo);
    env.gain.exponentialRampToValueAtTime(0.001, tiempo + duracion);

    fuente.connect(filtro);
    filtro.connect(env);
    env.connect(ctx.destination);

    fuente.start(tiempo);
    fuente.stop(tiempo + duracion);
  }

  tocarTom(tiempo, frecuencia = 120, volumen = 0.85) {
    const ctx = this._gestor.obtener();
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.connect(env);
    env.connect(ctx.destination);

    osc.frequency.setValueAtTime(frecuencia, tiempo);
    osc.frequency.exponentialRampToValueAtTime(frecuencia * 0.4, tiempo + 0.35);
    env.gain.setValueAtTime(volumen, tiempo);
    env.gain.exponentialRampToValueAtTime(0.001, tiempo + 0.35);

    osc.start(tiempo);
    osc.stop(tiempo + 0.35);
  }

  tocarClap(tiempo, volumen = 0.85) {
    const ctx = this._gestor.obtener();
    [0, 0.012, 0.024].forEach(offset => {
      const tamano = Math.floor(ctx.sampleRate * 0.12);
      const buffer = ctx.createBuffer(1, tamano, ctx.sampleRate);
      const datos = buffer.getChannelData(0);
      for (let i = 0; i < tamano; i++) datos[i] = Math.random() * 2 - 1;

      const fuente = ctx.createBufferSource();
      fuente.buffer = buffer;

      const filtro = ctx.createBiquadFilter();
      filtro.type = 'bandpass';
      filtro.frequency.value = 1100;
      filtro.Q.value = 0.8;

      const env = ctx.createGain();
      env.gain.setValueAtTime(volumen * 0.75, tiempo + offset);
      env.gain.exponentialRampToValueAtTime(0.001, tiempo + offset + 0.12);

      fuente.connect(filtro);
      filtro.connect(env);
      env.connect(ctx.destination);
      fuente.start(tiempo + offset);
      fuente.stop(tiempo + offset + 0.12);
    });
  }

  tocarRimshot(tiempo, volumen = 0.7) {
    const ctx = this._gestor.obtener();
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = 900;
    env.gain.setValueAtTime(volumen, tiempo);
    env.gain.exponentialRampToValueAtTime(0.001, tiempo + 0.06);

    osc.connect(env);
    env.connect(ctx.destination);
    osc.start(tiempo);
    osc.stop(tiempo + 0.06);
  }

  tocarCowbell(tiempo, volumen = 0.6) {
    const ctx = this._gestor.obtener();
    const env = ctx.createGain();
    env.connect(ctx.destination);
    env.gain.setValueAtTime(volumen * 0.5, tiempo);
    env.gain.exponentialRampToValueAtTime(0.001, tiempo + 0.6);

    [562, 845].forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      osc.connect(env);
      osc.start(tiempo);
      osc.stop(tiempo + 0.6);
    });
  }

  tocarPercusion(tiempo, volumen = 0.7) {
    const ctx = this._gestor.obtener();
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, tiempo);
    osc.frequency.exponentialRampToValueAtTime(180, tiempo + 0.15);
    env.gain.setValueAtTime(volumen, tiempo);
    env.gain.exponentialRampToValueAtTime(0.001, tiempo + 0.15);

    osc.connect(env);
    env.connect(ctx.destination);
    osc.start(tiempo);
    osc.stop(tiempo + 0.15);
  }

  tocarCrash(tiempo, volumen = 0.7) {
    const ctx = this._gestor.obtener();
    const tamano = Math.floor(ctx.sampleRate * 1.2);
    const buffer = ctx.createBuffer(1, tamano, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < tamano; i++) datos[i] = Math.random() * 2 - 1;

    const fuente = ctx.createBufferSource();
    fuente.buffer = buffer;

    const filtro = ctx.createBiquadFilter();
    filtro.type = 'highpass';
    filtro.frequency.value = 5000;

    const env = ctx.createGain();
    env.gain.setValueAtTime(volumen * 0.5, tiempo);
    env.gain.exponentialRampToValueAtTime(0.001, tiempo + 1.2);

    fuente.connect(filtro);
    filtro.connect(env);
    env.connect(ctx.destination);
    fuente.start(tiempo);
    fuente.stop(tiempo + 1.2);
  }
}

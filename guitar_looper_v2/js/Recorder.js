var GL = GL || {};

GL.recorder = {
  _recorder: null,
  _chunks:   [],

  start() {
    this._chunks   = [];
    this._recorder = null;

    const recDest = GL.audioEngine.recDest;
    if (!recDest) {
      console.error('[Recorder] recDest no inicializado — llama a audioEngine.init() primero');
      return;
    }

    const opts = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? { mimeType: 'audio/webm;codecs=opus' } : {};

    try {
      this._recorder = new MediaRecorder(recDest.stream, opts);
    } catch (e) {
      console.error('[Recorder] No se pudo crear MediaRecorder:', e);
      this._recorder = null;
      return;
    }

    this._recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) this._chunks.push(e.data);
    };
    this._recorder.start();
  },

  stop() {
    return new Promise((resolve, reject) => {
      if (!this._recorder) {
        reject(new Error('La grabación nunca se inició correctamente'));
        return;
      }
      const rec = this._recorder;
      rec.onstop = () => {
        resolve(new Blob(this._chunks, { type: rec.mimeType || 'audio/webm' }));
        this._recorder = null;
      };
      rec.stop();
    });
  }
};

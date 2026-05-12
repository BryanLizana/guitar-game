var GL = GL || {};

GL.recorder = {
  _recorder: null,
  _chunks:   [],

  start() {
    this._chunks = [];
    const opts = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? { mimeType: 'audio/webm;codecs=opus' } : {};
    this._recorder = new MediaRecorder(GL.audioEngine.recDest.stream, opts);
    this._recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) this._chunks.push(e.data);
    };
    this._recorder.start();
  },

  stop() {
    return new Promise(resolve => {
      this._recorder.onstop = () => {
        resolve(new Blob(this._chunks, { type: this._recorder.mimeType || 'audio/webm' }));
      };
      this._recorder.stop();
    });
  }
};

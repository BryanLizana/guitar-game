var GL = GL || {};

GL.audioEngine = {
  audioCtx:    null,
  micSrc:      null,
  visAn:       null,
  metroGain:   null,
  recDest:     null,
  mediaStream: null,

  init() {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      return;
    }
    this.audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
    this.metroGain = this.audioCtx.createGain();
    this.metroGain.gain.value = 1;
    this.metroGain.connect(this.audioCtx.destination);
    this.recDest = this.audioCtx.createMediaStreamDestination();
  },

  async initMic() {
    if (this.mediaStream) return true;
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false
      });
      this.init();
      this.micSrc = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.visAn  = this.audioCtx.createAnalyser();
      this.visAn.fftSize = 1024;
      this.micSrc.connect(this.visAn);
      this.micSrc.connect(this.recDest);
      return true;
    } catch (e) {
      return false;
    }
  },

  async decodeBlob(blob) {
    const ab = await blob.arrayBuffer();
    return new Promise((res, rej) => this.audioCtx.decodeAudioData(ab, res, rej));
  }
};

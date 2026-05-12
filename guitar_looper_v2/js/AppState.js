var GL = GL || {};

GL.ST = Object.freeze({
  IDLE: 'idle', REC: 'rec', PLAYING: 'playing', OVERLAY: 'overlay', WAITING: 'waiting'
});

GL.COLORS = Object.freeze([
  '#ef5350','#FFA726','#66BB6A','#29B6F6','#AB47BC','#EC407A','#26C6DA'
]);

GL.appState = {
  current:      'idle',
  bpm:          120,
  beatsPerBar:  4,
  loopStart:    0,
  loopDuration: 0,
  trimStart:    0,
  trimEnd:      0,
  mainBuffer:   null,
  layers:       [],
  recStartPhase: 0,
  waitTimer:    null,

  reset() {
    this.current      = 'idle';
    this.loopStart    = 0;
    this.loopDuration = 0;
    this.trimStart    = 0;
    this.trimEnd      = 0;
    this.mainBuffer   = null;
    this.layers       = [];
    this.recStartPhase = 0;
    this.waitTimer    = null;
  }
};

var GL = GL || {};

GL.app = {
  // DOM refs
  _mainBtn: null, _btnIcon: null, _btnLbl: null, _statusEl: null,
  _stopBtn: null, _tracksEl: null, _metroBt: null, _metroDt: null,
  _metroLbl: null, _bpmSl: null, _bpmVEl: null, _sigSel: null,
  _rulCv: null, _waveCv: null, _trimCv: null, _playheadEl: null,
  _trimHint: null, _countInBtn: null, _dlBtn: null,

  init() {
    this._bindDOM();
    this._setupMetronome();
    this._setupTrimEditor();
    this._setupCountIn();
    this._setupTapTempo();
    this._bindEvents();

    GL.playhead.init(this._playheadEl, () => ({
      loopStart:    GL.appState.loopStart,
      loopDuration: GL.appState.loopDuration,
      trimStart:    GL.appState.trimStart,
      trimEnd:      GL.appState.trimEnd,
      canvas:       this._waveCv,
    }));

    window.addEventListener('resize', () => this._resizeCvs());
    setTimeout(() => this._resizeCvs(), 80);
  },

  _bindDOM() {
    this._mainBtn    = document.getElementById('main-btn');
    this._btnIcon    = document.getElementById('btn-icon');
    this._btnLbl     = document.getElementById('btn-lbl');
    this._statusEl   = document.getElementById('status');
    this._stopBtn    = document.getElementById('stop-btn');
    this._tracksEl   = document.getElementById('tracks');
    this._metroBt    = document.getElementById('metro-btn');
    this._metroDt    = document.getElementById('metro-dot');
    this._metroLbl   = document.getElementById('metro-lbl');
    this._bpmSl      = document.getElementById('bpm-sl');
    this._bpmVEl     = document.getElementById('bpm-v');
    this._sigSel     = document.getElementById('sig-sel');
    this._rulCv      = document.getElementById('ruler-cv');
    this._waveCv     = document.getElementById('wave-cv');
    this._trimCv     = document.getElementById('trim-cv');
    this._playheadEl = document.getElementById('playhead');
    this._trimHint   = document.getElementById('trim-hint');
    this._countInBtn = document.getElementById('countin-btn');
    this._dlBtn      = document.getElementById('dl-btn');
  },

  _setupMetronome() {
    GL.metronome.configure({
      getBpm:         () => GL.appState.bpm,
      getBeatsPerBar: () => GL.appState.beatsPerBar,
      getLoopInfo:    () => ({ loopStart: GL.appState.loopStart, loopDuration: GL.appState.loopDuration }),
      onUI:    ({ on, muted }) => this._updateMetroUI(on, muted),
      onFlash: () => this._flashDot(),
    });
  },

  _setupTrimEditor() {
    GL.trimEditor.init(
      this._trimCv,
      () => ({
        loopDuration: GL.appState.loopDuration,
        trimStart:    GL.appState.trimStart,
        trimEnd:      GL.appState.trimEnd,
        bpm:          GL.appState.bpm,
      }),
      ({ trimStart, trimEnd }) => {
        GL.appState.trimStart = trimStart;
        GL.appState.trimEnd   = trimEnd;
        this._redrawDAW();
        const s = GL.appState.current;
        if (s === GL.ST.PLAYING || s === GL.ST.OVERLAY) {
          GL.player.restartLayers(GL.appState.layers, GL.appState.loopStart, trimStart, trimEnd);
        }
      }
    );
  },

  _setupCountIn() {
    GL.countIn.configure({
      playClick: first => GL.metronome.playClick(first),
      flashDot:  ()    => this._flashDot(),
      getBpm:    ()    => GL.appState.bpm,
      onTick: (label, remaining) => {
        this._btnIcon.textContent = label;
        this._btnLbl.textContent  = '';
        this._setStatus('Grabando en ' + remaining + '...');
      },
      onDone: () => {
        this._countInBtn.classList.remove('active');
        this._countInBtn.disabled = false;
        this._mainBtn.disabled    = false;
        this._btnIcon.textContent = '⏺';
        this._btnLbl.textContent  = 'GRABAR';
        this._mainBtn.click();
      },
      onCancel: () => {
        this._countInBtn.classList.remove('active');
        this._countInBtn.disabled = false;
        this._mainBtn.disabled    = false;
        this._btnIcon.textContent = '⏺';
        this._btnLbl.textContent  = 'GRABAR';
        this._setStatus('Presiona para grabar el loop principal');
      },
    });
  },

  _setupTapTempo() {
    GL.tapTempo.configure({
      onBpm: bpm => {
        GL.appState.bpm          = bpm;
        this._bpmSl.value        = bpm;
        this._bpmVEl.textContent = bpm;
        if (GL.metronome.on) { GL.metronome.stop(); GL.metronome.start(); }
        if (GL.appState.mainBuffer) this._drawRuler();
      },
    });
  },

  _bindEvents() {
    this._bpmSl.addEventListener('input', () => {
      GL.appState.bpm = parseInt(this._bpmSl.value);
      this._bpmVEl.textContent = GL.appState.bpm;
      if (GL.metronome.on) { GL.metronome.stop(); GL.metronome.start(); }
      if (GL.appState.mainBuffer) this._drawRuler();
    });

    this._sigSel.addEventListener('change', () => {
      GL.appState.beatsPerBar = parseInt(this._sigSel.value);
      if (GL.metronome.on) { GL.metronome.stop(); GL.metronome.start(); }
      if (GL.appState.mainBuffer) this._drawRuler();
    });

    this._metroBt.addEventListener('click', () => {
      const s = GL.appState.current;
      if (s === GL.ST.REC || s === GL.ST.OVERLAY || s === GL.ST.WAITING) return;
      if (GL.metronome.on) { GL.metronome.stop(); GL.metronome.mute(false); }
      else                 { GL.metronome.mute(false); GL.metronome.start(); }
    });

    this._stopBtn.addEventListener('click', () => this._resetAll());
    this._mainBtn.addEventListener('click', () => this._onMainBtn());

    this._countInBtn.addEventListener('click', async () => {
      if (GL.appState.current !== GL.ST.IDLE) return;
      if (GL.countIn.active) { GL.countIn.cancel(); return; }
      const ok = await GL.audioEngine.initMic();
      if (!ok) { this._setStatus('⚠️ Sin acceso al micrófono'); return; }
      GL.audioEngine.init();
      this._countInBtn.classList.add('active');
      this._countInBtn.disabled = true;
      this._mainBtn.disabled    = true;
      GL.countIn.start();
    });

    this._dlBtn.addEventListener('click', async () => {
      this._dlBtn.disabled    = true;
      this._dlBtn.textContent = '⏳ Procesando...';
      try {
        await GL.exporter.downloadMix(GL.appState.layers, GL.appState.trimStart, GL.appState.trimEnd);
      } catch (e) {
        this._setStatus('⚠️ Error al exportar: ' + e.message);
      }
      this._dlBtn.disabled    = false;
      this._dlBtn.textContent = '⬇ Descargar mix';
    });

    const tapBtn = document.getElementById('tap-btn');
    tapBtn.addEventListener('click', () => { GL.audioEngine.init(); GL.tapTempo.tap(); });
    tapBtn.addEventListener('touchstart', e => { e.preventDefault(); GL.audioEngine.init(); GL.tapTempo.tap(); }, { passive: false });

    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.code === 'KeyT') { GL.audioEngine.init(); GL.tapTempo.tap(); return; }
      if (e.code !== 'Space') return;
      e.preventDefault();
      this._mainBtn.click();
    });
  },

  // ── State machine ────────────────────────────────────────────────

  async _onMainBtn() {
    const s   = GL.appState.current;
    const ST  = GL.ST;
    const ctx = GL.audioEngine.audioCtx;

    if (s === ST.IDLE) {
      const ok = await GL.audioEngine.initMic();
      if (!ok) { this._setStatus('⚠️ Sin acceso al micrófono'); return; }
      GL.audioEngine.init();
      if (GL.metronome.on) GL.metronome.mute(true);
      GL.appState.current = ST.REC;
      this._mainBtn.className   = 'main-btn rec';
      this._btnIcon.textContent = '⏹'; this._btnLbl.textContent = 'PARAR';
      this._setStatus('🔴 Grabando loop principal...');
      GL.appState.loopStart = ctx.currentTime;
      GL.recorder.start();
      GL.liveWaveform.start(this._waveCv);
      this._stopBtn.classList.add('show');
      return;
    }

    if (s === ST.REC) {
      const blob = await GL.recorder.stop();
      GL.liveWaveform.stop();
      GL.appState.loopDuration = ctx.currentTime - GL.appState.loopStart;
      let buf;
      try { buf = await GL.audioEngine.decodeBlob(blob); }
      catch (e) {
        this._setStatus('⚠️ Error de audio');
        GL.appState.current = ST.IDLE; this._mainBtn.className = 'main-btn idle'; return;
      }
      GL.appState.mainBuffer = buf;
      GL.appState.trimStart  = 0;
      GL.appState.trimEnd    = GL.appState.loopDuration;

      const layer = { buffer: buf, color: GL.COLORS[0], muted: false };
      GL.appState.layers.push(layer);
      this._addTrack(layer, 0);

      GL.appState.current = ST.PLAYING;
      this._mainBtn.className   = 'main-btn playing';
      this._btnIcon.textContent = '⏺'; this._btnLbl.textContent = 'NUEVA CAPA';
      this._setStatus('🟢 En bucle — ' + GL.appState.loopDuration.toFixed(2) + 's');
      this._redrawDAW(GL.COLORS[0]);
      this._trimHint.classList.add('show');
      if (GL.metronome.on) { GL.metronome.stop(); GL.metronome.mute(false); GL.metronome.start(); }
      GL.player.restartLayers(GL.appState.layers, GL.appState.loopStart, GL.appState.trimStart, GL.appState.trimEnd);
      GL.playhead.start();
      return;
    }

    if (s === ST.WAITING) {
      clearTimeout(GL.appState.waitTimer); GL.appState.waitTimer = null;
      GL.appState.current = ST.PLAYING;
      this._mainBtn.className   = 'main-btn playing';
      this._btnIcon.textContent = '⏺'; this._btnLbl.textContent = 'NUEVA CAPA';
      this._setStatus('🟢 En bucle — ' + GL.appState.layers.length + ' pistas');
      return;
    }

    if (s === ST.PLAYING) {
      const dur     = GL.appState.trimEnd - GL.appState.trimStart;
      const elapsed = (ctx.currentTime - GL.appState.loopStart) % dur;
      GL.appState.recStartPhase = 0;
      GL.appState.current = ST.WAITING;
      this._mainBtn.className   = 'main-btn overlay';
      this._btnIcon.textContent = '⏺'; this._btnLbl.textContent = 'ESPERANDO';
      this._setStatus('⏳ Grabando al inicio del próximo loop...');
      GL.appState.waitTimer = setTimeout(() => {
        if (GL.appState.current !== ST.WAITING) return;
        if (GL.metronome.on) GL.metronome.mute(true);
        GL.appState.current = ST.OVERLAY;
        this._mainBtn.className   = 'main-btn overlay';
        this._btnIcon.textContent = '⏹'; this._btnLbl.textContent = 'PARAR CAPA';
        this._setStatus('🟡 Grabando capa ' + (GL.appState.layers.length + 1) + '...');
        GL.recorder.start();
        GL.liveWaveform.start(this._waveCv, GL.COLORS[GL.appState.layers.length % GL.COLORS.length]);
      }, (dur - elapsed) * 1000);
      return;
    }

    if (s === ST.OVERLAY) {
      const blob = await GL.recorder.stop();
      let rawBuf;
      try { rawBuf = await GL.audioEngine.decodeBlob(blob); }
      catch (e) {
        this._setStatus('⚠️ Error');
        GL.appState.current = ST.PLAYING; this._mainBtn.className = 'main-btn playing'; return;
      }

      const loopDur    = GL.appState.trimEnd - GL.appState.trimStart;
      const sr         = ctx.sampleRate;
      const frameCount = GL.appState.mainBuffer
        ? Math.round((GL.appState.trimEnd - GL.appState.trimStart) / GL.appState.mainBuffer.duration * GL.appState.mainBuffer.length)
        : Math.round(loopDur * sr);
      const nCh        = rawBuf.numberOfChannels;
      const alignedBuf = ctx.createBuffer(nCh, frameCount, sr);
      const phaseFrame = Math.round(GL.appState.recStartPhase * sr);
      const fadeSamples = Math.min(Math.floor(sr * 0.01), Math.floor(frameCount * 0.05));

      for (let ch = 0; ch < nCh; ch++) {
        const src = rawBuf.getChannelData(ch);
        const dst = alignedBuf.getChannelData(ch);
        const copyLen = Math.min(src.length, frameCount);
        for (let i = 0; i < copyLen; i++) dst[(phaseFrame + i) % frameCount] = src[i];
        for (let i = 0; i < fadeSamples && i < copyLen; i++)
          dst[(phaseFrame + i) % frameCount] *= i / fadeSamples;
        for (let i = 0; i < fadeSamples && i < copyLen; i++) {
          const pos = copyLen - fadeSamples + i;
          if (pos >= 0) dst[(phaseFrame + pos) % frameCount] *= (fadeSamples - 1 - i) / fadeSamples;
        }
      }

      GL.liveWaveform.stop();
      this._redrawDAW(GL.COLORS[0]);

      const color = GL.COLORS[GL.appState.layers.length % GL.COLORS.length];
      const layer = { buffer: alignedBuf, color, muted: false, aligned: true };
      GL.appState.layers.push(layer);
      this._addTrack(layer, GL.appState.layers.length - 1);

      GL.appState.current = ST.PLAYING;
      this._mainBtn.className   = 'main-btn playing';
      this._btnIcon.textContent = '⏺'; this._btnLbl.textContent = 'NUEVA CAPA';
      this._setStatus('🟢 En bucle — ' + GL.appState.layers.length + ' pistas');
      if (GL.metronome.on) GL.metronome.mute(false);

      const el2 = (ctx.currentTime - GL.appState.loopStart) % loopDur;
      GL.player.addSrc(GL.player.playLayer(alignedBuf, el2, 0, alignedBuf.duration, layer.gainNode));
    }
  },

  // ── Track management ─────────────────────────────────────────────

  _addTrack(layer, index) {
    layer.vol      = 1;
    layer.gainNode = GL.audioEngine.audioCtx.createGain();
    layer.gainNode.gain.value = 1;
    layer.gainNode.connect(GL.audioEngine.audioCtx.destination);
    GL.fxChain.create(layer);

    if (this._tracksEl.querySelector('.empty')) this._tracksEl.innerHTML = '';

    const el = GL.trackView.create(layer, index, {
      onDelete: (l, wrap) => {
        const i = GL.appState.layers.indexOf(l);
        if (i > -1) GL.appState.layers.splice(i, 1);
        GL.fxChain.destroy(l);
        if (l.gainNode) { l.gainNode.disconnect(); l.gainNode = null; }
        wrap.remove();
        if (!GL.appState.layers.length)
          this._tracksEl.innerHTML = '<div class="empty">Aún no hay pistas grabadas</div>';
        GL.player.restartLayers(GL.appState.layers, GL.appState.loopStart, GL.appState.trimStart, GL.appState.trimEnd);
        this._updateDlBtn();
      },
    });
    this._tracksEl.appendChild(el);
    this._updateDlBtn();
  },

  // ── Rendering ────────────────────────────────────────────────────

  _resizeCvs() {
    const w = this._waveCv.offsetWidth || 640;
    [this._rulCv, this._waveCv, this._trimCv].forEach(c => { c.width = w; });
    this._rulCv.height = 20; this._waveCv.height = 90; this._trimCv.height = 90;
    if (GL.appState.mainBuffer) this._redrawDAW();
  },

  _redrawDAW(color) {
    GL.waveformRenderer.drawMainWave(GL.appState.mainBuffer, this._waveCv, color || GL.COLORS[0]);
    this._drawRuler();
    GL.waveformRenderer.drawTrimOverlay(
      this._trimCv, GL.appState.loopDuration,
      GL.appState.trimStart, GL.appState.trimEnd,
      GL.appState.bpm, GL.appState.beatsPerBar
    );
  },

  _drawRuler() {
    GL.waveformRenderer.drawRuler(this._rulCv, GL.appState.bpm, GL.appState.beatsPerBar, GL.appState.trimStart, GL.appState.trimEnd);
  },

  // ── Reset ────────────────────────────────────────────────────────

  _resetAll() {
    clearTimeout(GL.appState.waitTimer);
    GL.appState.layers.forEach(l => {
      GL.fxChain.destroy(l);
      if (l.gainNode) { l.gainNode.disconnect(); l.gainNode = null; }
    });
    GL.player.stopAll();
    GL.metronome.stop();
    GL.liveWaveform.stop();
    GL.playhead.stop();
    this._waveCv.getContext('2d').clearRect(0, 0, this._waveCv.width, 90);
    this._trimCv.getContext('2d').clearRect(0, 0, this._trimCv.width, 90);
    this._rulCv.getContext('2d').clearRect(0, 0, this._rulCv.width, 20);

    GL.appState.reset();
    this._tracksEl.innerHTML      = '<div class="empty">Aún no hay pistas grabadas</div>';
    this._mainBtn.className        = 'main-btn idle';
    this._btnIcon.textContent      = '⏺'; this._btnLbl.textContent = 'GRABAR';
    this._stopBtn.classList.remove('show'); this._trimHint.classList.remove('show');
    this._setStatus('Presiona para grabar el loop principal');
    this._updateDlBtn();
    GL.metronome.mute(false);
  },

  // ── UI helpers ───────────────────────────────────────────────────

  _setStatus(t) { this._statusEl.textContent = t; },

  _updateDlBtn() { this._dlBtn.classList.toggle('show', GL.appState.layers.length > 0); },

  _flashDot() {
    this._metroDt.classList.add('flash');
    setTimeout(() => this._metroDt.classList.remove('flash'), 80);
  },

  _updateMetroUI(on, muted) {
    if (!on)        { this._metroBt.className = 'metro-btn';       this._metroLbl.textContent = 'Metrónomo'; }
    else if (muted) { this._metroBt.className = 'metro-btn muted'; this._metroLbl.textContent = 'Muteado'; }
    else            { this._metroBt.className = 'metro-btn on';    this._metroLbl.textContent = 'Metrónomo'; }
  }
};

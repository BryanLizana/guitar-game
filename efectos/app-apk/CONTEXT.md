# Guitar Effects APK — Contexto de sesión

## Estado actual del proyecto
App Android de efectos de guitarra con Oboe (NDK C++). Refactorizada para usar full-duplex con ring buffer SPSC y resampler adaptativo. **El audio sigue saturando** — ahora con un artefacto adicional "tipo alienígena" (pitch-shift audible) durante los intentos de auto-recovery.

## Bug activo: audio saturado + artefacto "alienígena"

### Síntoma actual
- Al arrancar suena bien unos segundos
- Después aparece saturación + sonido artificial / metálico / "alienígena"
- El motor intenta auto-recuperarse (resyncs internos) pero hay micro-saturaciones audibles en cada uno
- Cuando se hace stop+start manualmente, vuelve a funcionar bien por unos segundos
- El contador `resyncs` crece sin parar

### Diagnóstico mostrado en pantalla
```
44100Hz/256 peak=0.xx miss=N drops=N resyncs=N ring=N drift=+Nppm xrun i=0 o=0
```
Sin xruns de Oboe (i=0 o=0) → el problema no es subida del sistema, es desincronización entre los streams.

### Hipótesis confirmadas
1. ✅ El input USB y el output del Android están a sample rates físicos distintos
2. ✅ El drift residual entre cristales es lo suficientemente grande para saturar el resampler
3. ❓ Posible que Oboe esté reportando un sample rate distinto al real del USB

### Lo que YA hemos probado
1. **FullDuplex pattern** con ring buffer SPSC (en lugar de read() non-blocking en el output callback) — mejoró pero no resolvió
2. **Resampler adaptativo fraccional** con PI controller — funciona pero satura el límite
3. **Apertura del input PRIMERO sin forzar SR** (que Oboe elija el nativo) — ayuda pero insuficiente
4. **baseStep = inSR/outSR explícito** para separar conversión física vs drift residual — mejoró estabilidad
5. **PI gains agresivos** (kP=8e-4, kI=2e-6) + LP α=0.20 + boost de emergencia — necesario pero insuficiente
6. **Ring target 8×burst, cap 32×burst** + pre-fill con silencio — elimina underflow inicial
7. **Auto-resync interno** cuando ring < target/4 por 5 callbacks seguidos — funciona pero se dispara demasiado
8. **Cascada de rates explícitos para el input** (44100 → 48000 → 96000 → 32000)
9. **kMaxDrift ampliado a 10%** como red de seguridad (causa el pitch-shift "alienígena")
10. **Crossfade de ~11ms en los resyncs** para evitar clicks

### Próximos pasos sugeridos
1. **Medir el rate físico REAL del input** — contar frames recibidos en una ventana de tiempo conocida (ej. 5 segundos). Calcular `framesActuales / segundos` y comparar con `inputStream_->getSampleRate()`. Si difiere → Oboe miente sobre el rate.
2. **Auto-calibrar `baseStep_` dinámicamente** — en lugar de calcular `inSR/outSR`, medir el ratio de producción/consumo en runtime durante los primeros 5–10 segundos y fijar `baseStep_` al valor medido.
3. **Probar `FullDuplexStream` de Oboe** — patrón oficial, maneja sync interno (lo dejamos para esto si la auto-calibración no funciona)
4. **Probar AudioRecord/AudioTrack en Java** — Oboe puede estar haciendo SRC silencioso mal en este dispositivo
5. **Reducir kMaxDrift a 2-3%** una vez resuelta la causa raíz (10% es demasiado, produce el sonido alienígena)
6. **Bajar lowFillStreak threshold** — actualmente 5 callbacks; quizás 10-15 para no disparar resyncs prematuros si es solo jitter

---

## Arquitectura actual del código

### Archivos C++ clave
```
app/src/main/cpp/
├── AudioEngine.h / .cpp     ← Full-duplex + ring SPSC + resampler adaptativo
├── jni_bridge.cpp           ← JNI: init/stop/setGain/setEffect/getDiagInfo
└── dsp/
    ├── DspProcessor.h / .cpp ← Pipeline DSP (mismo de antes)
    ├── Effects.h            ← NoiseGate, Overdrive, Wah, Reverb, Delay
    ├── Biquad.h             ← Biquad IIR filters
    └── Oversampler.h        ← 2× oversampling
```

### Estado actual de AudioEngine.cpp — openStreams()
1. **Input se abre PRIMERO** con cascada de rates: 44100 → 48000 → 96000 → 32000 → libre
   - Sharing=Shared, Format=Float, Mono, InputPreset=VoicePerformance, AAudio
   - Si se conoce inputDeviceId del USB se setea explícitamente
   - Buffer del input = burst × 4 (más colchón para jitter de Shared mode)
2. **Output se abre DESPUÉS** al `preferredSampleRate` del Android (típico 48000)
   - Sharing=Exclusive (fallback a Shared), Format=Float, Mono
   - Buffer del output = burst × 2 (low latency)
3. **baseStep_ = inSR / outSR** se calcula tras la apertura
4. **Pre-fill del ring** con `ringTargetFrames_ = 8 × burst` muestras de silencio
5. **inputStream->requestStart()** primero, luego **outputStream->requestStart()**

### Callbacks (single class, dispatched por `stream` pointer)
- **Input callback**: down-mix a mono si stereo → escribe al ring → cuenta drops si ring lleno
- **Output callback**:
  1. Lee fill actual del ring
  2. Si fill < target/4 por 5 callbacks → resync (limpiar ring, pre-fill, reset PI, iniciar crossfade)
  3. Si fill > 75% de capacidad → resync también
  4. Actualiza PI: `ppm = kP × error + kI × integral` (saturado a ±kMaxDrift)
  5. Si fill < target/2 → fuerza ppm = -kMaxDrift (emergencia)
  6. Suaviza step: `resampStep_ = 0.8 × prev + 0.2 × target`
  7. Lee del ring con interpolación lineal fraccional usando `resampStep_`
  8. Aplica crossfade si está activo (~2 bursts ~11ms)
  9. Pasa cada sample por DspProcessor

### Constantes del resampler
```cpp
kMaxDrift = 0.10    // ±10% max (TEMPORAL, causa pitch-shift; bajar a 0.02 después)
kP        = 8e-4    // proporcional sobre error normalizado de fill
kI        = 2e-6    // integral
crossfadeLen = burst * 2   // ~11ms a 256/48000
```

### Constantes del ring
```cpp
ringTargetFrames_ = outFramesPerCb * 8    // ~43ms latencia
ringCap           = outFramesPerCb * 32+1 // mucho headroom
inputStreamBuffer = inFramesPerCb * 4     // jitter de Shared mode
outputStreamBuffer= outFramesPerCb * 2    // low latency
```

### Diagnóstico expuesto
DiagSnapshot incluye: peak, missed, xrunIn, xrunOut, sampleRate, framesPerBurst, inputDeviceId, ringFill, driftPpm, **resyncs**, **inputDrops**

`drift` reportado es relativo a `baseStep_`, no a 1.0 — mide solo el residual del PI.

### DSP chain (sin cambios)
```
input → DC blocker → NoiseGate → gain * input → tanhf →
[Overdrive si ON] → [Wah si ON] → [Reverb si ON] → [Delay si ON] →
tanhf → LP smoother → output
```
Cabinet simulation eliminado.

---

## Archivos Kotlin clave
```
app/src/main/java/com/guitareffects/
├── GuitarEffectsApp.kt
├── audio/JniAudioEngine.kt          ← queryDeviceParams detecta USB device ID + sample rates
├── data/repository/AudioRepositoryImpl.kt
├── domain/model/AudioEffect.kt      ← enum REVERB, DELAY, OVERDRIVE, WAH
├── domain/model/AudioState.kt
├── presentation/MainActivity.kt     ← UI + polling diagnóstico (1Hz)
└── presentation/MainViewModel.kt
```

**Legacy eliminado**: `data/engine/AudioEngine.kt` y `data/engine/effects/*` (era AudioRecord/AudioTrack, ya no se usa).

JniAudioEngine ahora expone también `nativeGetActualSampleRate()` y `DeviceParams` con `inputNativeRates: IntArray` y `inputProductName: String?`.

---

## Configuración del build
- `app/build.gradle`: NDK 28.2.13676358, CMake 3.22.1, c++_shared, O3, DANDROID
- `app/CMakeLists.txt`: guitar-engine, AudioEngine.cpp + jni_bridge.cpp (DspProcessor.cpp incluido directamente)
- Oboe 1.9.3 via prefab
- minSdk 29, targetSdk 35, compileSdk 35
- ABI: arm64-v8a, x86_64

---

## Comandos útiles
```bash
# Build
cd efectos/app-apk && ./gradlew.bat assembleDebug

# Install
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Ver logs C++ (importante: registra los rates negociados al inicio)
adb logcat -s GuitarEngine

# Ver logs Kotlin
adb logcat -s GuitarEffects
```

## Nota sobre el timestamp en el título
El título de la app muestra la hora del build `[HH:MM DD/MM/AA]` para confirmar qué versión está instalada. Está en `BuildConfig.BUILD_TIME` generado en `build.gradle`.

---

## Pendiente para próxima sesión
1. **CRÍTICO**: medir rate físico real del input USB (no confiar en `getSampleRate()`)
2. **IMPORTANTE**: bajar `kMaxDrift` a 2-3% una vez resuelto el rate físico (sino se va a oír "alienígena")
3. Considerar: FullDuplexStream de Oboe vs implementación manual
4. Considerar: log de los primeros segundos para ver convergencia del PI

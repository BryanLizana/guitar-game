package com.guitareffects.data.repository

import android.content.Context
import com.guitareffects.audio.JniAudioEngine
import com.guitareffects.domain.model.AudioEffect
import com.guitareffects.domain.model.AudioState
import com.guitareffects.domain.repository.IAudioRepository
import com.guitareffects.infrastructure.diagnostic.IDiagnosticTracer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext

class AudioRepositoryImpl(
    private val context: Context,
    private val tracer: IDiagnosticTracer
) : IAudioRepository {

    private val _state = MutableStateFlow<AudioState>(AudioState.Idle)
    override val audioState: Flow<AudioState> = _state.asStateFlow()

    override suspend fun startPassthrough(): Result<Unit> = withContext(Dispatchers.IO) {
        _state.value = AudioState.Starting
        runCatching {
            val p = JniAudioEngine.queryDeviceParams(context)
            val ratesStr = if (p.inputNativeRates.isEmpty()) "any"
                           else p.inputNativeRates.joinToString(",")
            val source = p.inputProductName?.let { "USB($it)" } ?: "built-in mic"
            tracer.log("Native: $source rates=[$ratesStr] → ${p.sampleRate}Hz burst=${p.framesPerBurst} devId=${p.inputDeviceId}")
            tracer.updateAudioParams(p.sampleRate, p.framesPerBurst, source, false)

            val ok = JniAudioEngine.nativeInit(p.sampleRate, p.framesPerBurst, p.inputDeviceId)
            if (!ok) error("Oboe stream failed to open — check mic permission and USB device")

            val actualSr = JniAudioEngine.nativeGetActualSampleRate()
            if (actualSr > 0 && actualSr != p.sampleRate) {
                tracer.log("Native: device negotiated ${actualSr}Hz (requested ${p.sampleRate}Hz)")
                tracer.updateAudioParams(actualSr, p.framesPerBurst, source, false)
            }

            tracer.updateRecordState("RECORDING")
            tracer.updateTrackState("PLAYING")
            tracer.log("Native engine: running")
            _state.value = AudioState.Running
        }.onFailure { e ->
            tracer.logError("Native engine start failed: ${e.message}")
            _state.value = AudioState.Error(e.message ?: "Unknown error")
        }
    }

    override suspend fun stopPassthrough(): Result<Unit> = withContext(Dispatchers.IO) {
        _state.value = AudioState.Stopping
        runCatching {
            JniAudioEngine.nativeStop()
            tracer.updateRecordState("IDLE")
            tracer.updateTrackState("IDLE")
            tracer.log("Native engine: stopped")
            _state.value = AudioState.Idle
        }.onFailure { e ->
            tracer.logError("Native engine stop failed: ${e.message}")
            _state.value = AudioState.Error(e.message ?: "Unknown error")
        }
    }

    override fun isRunning(): Boolean = JniAudioEngine.nativeIsRunning()

    override fun setGain(gain: Float) = JniAudioEngine.nativeSetGain(gain)

    override fun setEffectEnabled(effect: AudioEffect, enabled: Boolean) =
        JniAudioEngine.setEffectEnabled(effect, enabled)
}

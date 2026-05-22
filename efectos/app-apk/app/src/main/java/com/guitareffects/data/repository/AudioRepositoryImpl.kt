package com.guitareffects.data.repository

import com.guitareffects.data.engine.AudioEngine
import com.guitareffects.domain.model.AudioState
import com.guitareffects.domain.repository.IAudioRepository
import com.guitareffects.infrastructure.diagnostic.IDiagnosticTracer
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class AudioRepositoryImpl(
    private val engine: AudioEngine,
    private val tracer: IDiagnosticTracer
) : IAudioRepository {

    private val _audioState = MutableStateFlow<AudioState>(AudioState.Idle)
    override val audioState: Flow<AudioState> = _audioState.asStateFlow()

    override suspend fun startPassthrough(): Result<Unit> {
        _audioState.value = AudioState.Starting
        return engine.start()
            .onSuccess { _audioState.value = AudioState.Running }
            .onFailure { e ->
                val msg = e.message ?: "Unknown audio engine error"
                tracer.logError("Repository: $msg")
                _audioState.value = AudioState.Error(msg)
            }
    }

    override suspend fun stopPassthrough(): Result<Unit> {
        _audioState.value = AudioState.Stopping
        return engine.stop()
            .onSuccess { _audioState.value = AudioState.Idle }
            .onFailure { e ->
                val msg = e.message ?: "Unknown stop error"
                tracer.logError("Repository: stop failed — $msg")
                _audioState.value = AudioState.Error(msg)
            }
    }

    override fun isRunning(): Boolean = engine.isRunning()

    override fun setGain(gain: Float) {
        engine.gain = gain
    }
}

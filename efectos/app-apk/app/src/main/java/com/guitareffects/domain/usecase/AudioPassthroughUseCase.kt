package com.guitareffects.domain.usecase

import com.guitareffects.domain.model.AudioEffect
import com.guitareffects.domain.model.AudioState
import com.guitareffects.domain.repository.IAudioRepository
import com.guitareffects.infrastructure.diagnostic.IDiagnosticTracer
import kotlinx.coroutines.flow.Flow

class AudioPassthroughUseCase(
    private val repository: IAudioRepository,
    private val tracer: IDiagnosticTracer
) {
    val audioState: Flow<AudioState> = repository.audioState

    suspend fun start(): Result<Unit> {
        tracer.log("UseCase: starting audio passthrough")
        return repository.startPassthrough()
            .onSuccess { tracer.log("UseCase: passthrough started OK") }
            .onFailure { tracer.logError("UseCase: start failed — ${it.message}") }
    }

    suspend fun stop(): Result<Unit> {
        tracer.log("UseCase: stopping audio passthrough")
        return repository.stopPassthrough()
            .onSuccess { tracer.log("UseCase: passthrough stopped OK") }
            .onFailure { tracer.logError("UseCase: stop failed — ${it.message}") }
    }

    fun isRunning(): Boolean = repository.isRunning()

    fun setGain(gain: Float) = repository.setGain(gain)

    fun setEffectEnabled(effect: AudioEffect, enabled: Boolean) =
        repository.setEffectEnabled(effect, enabled)
}

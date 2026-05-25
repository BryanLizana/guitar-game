package com.guitareffects.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.guitareffects.domain.model.AudioEffect
import com.guitareffects.domain.model.AudioState
import com.guitareffects.domain.model.DiagnosticInfo
import com.guitareffects.domain.usecase.AudioPassthroughUseCase
import com.guitareffects.infrastructure.diagnostic.IDiagnosticTracer
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MainViewModel(
    private val useCase: AudioPassthroughUseCase,
    private val tracer: IDiagnosticTracer
) : ViewModel() {

    val audioState: StateFlow<AudioState> = useCase.audioState
        .stateIn(viewModelScope, SharingStarted.Eagerly, AudioState.Idle)

    val diagnosticInfo: StateFlow<DiagnosticInfo> = tracer.diagnosticInfo
        .stateIn(viewModelScope, SharingStarted.Eagerly, DiagnosticInfo())

    fun togglePassthrough() {
        viewModelScope.launch {
            if (useCase.isRunning()) {
                useCase.stop()
            } else {
                useCase.start()
            }
        }
    }

    fun setGain(gain: Float) = useCase.setGain(gain)

    fun setEffectEnabled(effect: AudioEffect, enabled: Boolean) =
        useCase.setEffectEnabled(effect, enabled)

    fun updatePermissionState(granted: Boolean) {
        tracer.updatePermissionState(granted)
    }

    override fun onCleared() {
        super.onCleared()
        viewModelScope.launch { useCase.stop() }
    }

    class Factory(
        private val useCase: AudioPassthroughUseCase,
        private val tracer: IDiagnosticTracer
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(MainViewModel::class.java)) {
                return MainViewModel(useCase, tracer) as T
            }
            throw IllegalArgumentException("Unknown ViewModel: ${modelClass.name}")
        }
    }
}

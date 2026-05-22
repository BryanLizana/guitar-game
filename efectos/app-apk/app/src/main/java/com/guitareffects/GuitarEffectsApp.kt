package com.guitareffects

import android.app.Application
import android.media.AudioManager
import androidx.core.content.getSystemService
import com.guitareffects.data.engine.AudioEngine
import com.guitareffects.data.repository.AudioRepositoryImpl
import com.guitareffects.domain.usecase.AudioPassthroughUseCase
import com.guitareffects.infrastructure.diagnostic.DiagnosticTracer
import com.guitareffects.presentation.MainViewModel

class GuitarEffectsApp : Application() {

    private val diagnosticTracer by lazy { DiagnosticTracer() }

    private val audioEngine by lazy {
        AudioEngine(getSystemService<AudioManager>()!!, diagnosticTracer)
    }

    private val audioRepository by lazy {
        AudioRepositoryImpl(audioEngine, diagnosticTracer)
    }

    private val audioUseCase by lazy {
        AudioPassthroughUseCase(audioRepository, diagnosticTracer)
    }

    val viewModelFactory by lazy {
        MainViewModel.Factory(audioUseCase, diagnosticTracer)
    }
}

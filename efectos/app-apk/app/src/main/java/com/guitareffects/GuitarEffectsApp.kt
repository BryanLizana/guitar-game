package com.guitareffects

import android.app.Application
import com.guitareffects.data.repository.AudioRepositoryImpl
import com.guitareffects.domain.usecase.AudioPassthroughUseCase
import com.guitareffects.infrastructure.diagnostic.DiagnosticTracer
import com.guitareffects.presentation.MainViewModel

class GuitarEffectsApp : Application() {

    private val diagnosticTracer by lazy { DiagnosticTracer() }

    private val audioRepository by lazy {
        AudioRepositoryImpl(this, diagnosticTracer)
    }

    private val audioUseCase by lazy {
        AudioPassthroughUseCase(audioRepository, diagnosticTracer)
    }

    val viewModelFactory by lazy {
        MainViewModel.Factory(audioUseCase, diagnosticTracer)
    }
}

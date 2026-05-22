package com.guitareffects.infrastructure.diagnostic

import android.util.Log
import com.guitareffects.domain.model.DiagnosticInfo
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.CopyOnWriteArrayList

class DiagnosticTracer : IDiagnosticTracer {

    private val tag = "GuitarEffects"
    private val errorLog = CopyOnWriteArrayList<String>()

    private val _diagnosticInfo = MutableStateFlow(DiagnosticInfo())
    override val diagnosticInfo: StateFlow<DiagnosticInfo> = _diagnosticInfo.asStateFlow()

    override fun log(message: String) {
        Log.d(tag, message)
    }

    override fun logError(message: String) {
        Log.e(tag, message)
        if (errorLog.size >= 50) {
            errorLog.removeAt(0)
        }
        errorLog.add(message)
        _diagnosticInfo.value = _diagnosticInfo.value.copy(errorLog = errorLog.toList())
    }

    override fun updateAudioParams(
        sampleRate: Int,
        bufferSizeFrames: Int,
        audioSource: String,
        isUnprocessed: Boolean
    ) {
        _diagnosticInfo.value = _diagnosticInfo.value.copy(
            sampleRate = sampleRate,
            bufferSizeFrames = bufferSizeFrames,
            audioSourceInUse = audioSource,
            isUnprocessedSourceSupported = isUnprocessed
        )
    }

    override fun updateRunningStats(framesProcessed: Long, underrunCount: Int, latencyMs: Float) {
        _diagnosticInfo.value = _diagnosticInfo.value.copy(
            totalFramesProcessed = framesProcessed,
            underrunCount = underrunCount,
            estimatedLatencyMs = latencyMs
        )
    }

    override fun updatePermissionState(granted: Boolean) {
        _diagnosticInfo.value = _diagnosticInfo.value.copy(micPermissionGranted = granted)
    }

    override fun updateRecordState(state: String) {
        _diagnosticInfo.value = _diagnosticInfo.value.copy(recordState = state)
    }

    override fun updateTrackState(state: String) {
        _diagnosticInfo.value = _diagnosticInfo.value.copy(trackState = state)
    }

    override fun getSnapshot(): DiagnosticInfo = _diagnosticInfo.value

    override fun clear() {
        errorLog.clear()
        _diagnosticInfo.value = DiagnosticInfo()
    }
}

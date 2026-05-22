package com.guitareffects.infrastructure.diagnostic

import com.guitareffects.domain.model.DiagnosticInfo
import kotlinx.coroutines.flow.Flow

interface IDiagnosticTracer {
    val diagnosticInfo: Flow<DiagnosticInfo>
    fun log(message: String)
    fun logError(message: String)
    fun updateAudioParams(sampleRate: Int, bufferSizeFrames: Int, audioSource: String, isUnprocessed: Boolean)
    fun updateRunningStats(framesProcessed: Long, underrunCount: Int, latencyMs: Float)
    fun updatePermissionState(granted: Boolean)
    fun updateRecordState(state: String)
    fun updateTrackState(state: String)
    fun getSnapshot(): DiagnosticInfo
    fun clear()
}
